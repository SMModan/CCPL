import "./asyncRoutes.js";
import express from "express";
import cors from "cors";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { STAGES, CLOSED_STAGES, SERVICES } from "../../shared/pipeline.js";
import { hashPassword, openDatabase, verifyPassword } from "./db.js";
import { exec, many, one } from "./pgdb.js";
import { publishedServiceNames, registerContent } from "./contentRoutes.js";
import { ensureClientFromWonLead, registerOps } from "./opsRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function clean(value, max) {
  if (value == null) return "";
  return String(value).replace(/\s+/g, " ").trim().slice(0, max);
}

function nextWeekday(from = new Date()) {
  const date = new Date(from);
  date.setDate(date.getDate() + 1);
  while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function leadOut(record, assigneeName = null) {
  if (!record) return null;
  return {
    id: record.id,
    reference: `CC-${String(record.id).padStart(4, "0")}`,
    contactName: record.contact_name,
    companyName: record.company_name || "",
    email: record.email || "",
    phone: record.phone || "",
    facilityDetails: record.facility_details || "",
    service: record.service || "",
    serviceWindow: record.service_window || "",
    source: record.source || "",
    assignedTo: record.assigned_to,
    assigneeName: assigneeName || record.assignee_name || "",
    notes: record.notes || "",
    value: record.value_cents == null ? null : record.value_cents / 100,
    stage: record.stage,
    lastContact: record.last_contact,
    nextAction: record.next_action || "",
    followUpDate: record.follow_up_date,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

const LEAD_SELECT = `
  SELECT leads.*, users.name AS assignee_name
  FROM leads
  LEFT JOIN users ON users.id = leads.assigned_to
`;

export function buildApp(db) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json({ limit: "80kb" }));

  const hits = new Map();
  function limit(req, res, next) {
    if (process.env.RATE_LIMIT === "off") return next();
    const key = req.ip || "local";
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((time) => now - time < 10 * 60 * 1000);
    if (recent.length >= 12) return res.status(429).json({ error: "Too many enquiries. Please wait a few minutes." });
    recent.push(now);
    hits.set(key, recent);
    next();
  }

  async function requireUser(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Sign in required." });
    const session = await one(
      db,
      `SELECT sessions.expires_at, users.id, users.name, users.email, users.role
       FROM sessions JOIN users ON users.id = sessions.user_id
       WHERE sessions.token = ?`,
      [token]
    );
    if (!session || new Date(session.expires_at).getTime() < Date.now()) {
      return res.status(401).json({ error: "Session expired. Sign in again." });
    }
    req.user = { id: session.id, name: session.name, email: session.email, role: session.role };
    next();
  }

  function requireAdmin(req, res, next) {
    if (req.user.role !== "admin") return res.status(403).json({ error: "An administrator has to do that." });
    next();
  }

  async function addActivity(leadId, userId, type, body) {
    await exec(db, "INSERT INTO activities (lead_id, user_id, type, body, created_at) VALUES (?, ?, ?, ?, ?)", [
      leadId,
      userId,
      type,
      body,
      new Date().toISOString(),
    ]);
  }

  async function notifyAdmins(leadId, title, body) {
    const admins = await many(db, "SELECT id FROM users WHERE role = 'admin'");
    const now = new Date().toISOString();
    for (const admin of admins) {
      await exec(db, "INSERT INTO notifications (user_id, lead_id, title, body, created_at) VALUES (?, ?, ?, ?, ?)", [
        admin.id,
        leadId,
        title,
        body,
        now,
      ]);
    }
  }

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/api/auth/login", async (req, res) => {
    const email = clean(req.body?.email, 160).toLowerCase();
    const password = String(req.body?.password || "");
    const user = await one(db, "SELECT * FROM users WHERE email = ?", [email]);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: "Those sign-in details are not recognised." });
    }
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await exec(db, "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", [token, user.id, expires]);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  });

  app.post("/api/auth/logout", requireUser, async (req, res) => {
    const token = (req.headers.authorization || "").slice(7);
    await exec(db, "DELETE FROM sessions WHERE token = ?", [token]);
    res.json({ ok: true });
  });

  app.get("/api/auth/me", requireUser, (req, res) => {
    res.json({ user: req.user });
  });

  app.get("/api/users", requireUser, async (_req, res) => {
    const users = await many(db, "SELECT id, name, email, role, created_at FROM users ORDER BY name");
    res.json({ users });
  });

  app.post("/api/users", requireUser, requireAdmin, async (req, res) => {
    const name = clean(req.body?.name, 120);
    const email = clean(req.body?.email, 160).toLowerCase();
    const password = String(req.body?.password || "");
    const role = req.body?.role === "admin" ? "admin" : "sales";
    if (!name || !email || password.length < 8) {
      return res.status(400).json({ error: "Name, email, and a password of at least 8 characters are required." });
    }
    try {
      const result = await exec(db, "INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)", [
        name,
        email,
        hashPassword(password),
        role,
        new Date().toISOString(),
      ]);
      res.status(201).json({ id: result.lastInsertRowid, name, email, role });
    } catch {
      res.status(409).json({ error: "That email is already in use." });
    }
  });

  app.get("/api/dashboard", requireUser, async (_req, res) => {
    const counts = await many(db, "SELECT stage, COUNT(*) AS count FROM leads GROUP BY stage");
    const byStage = Object.fromEntries(STAGES.map((stage) => [stage, 0]));
    for (const item of counts) byStage[item.stage] = Number(item.count);
    const today = new Date().toISOString().slice(0, 10);
    const due = (
      await many(
        db,
        `${LEAD_SELECT}
         WHERE follow_up_date IS NOT NULL AND follow_up_date <= ?
           AND stage NOT IN (${CLOSED_STAGES.map(() => "?").join(",")})
         ORDER BY follow_up_date ASC LIMIT 8`,
        [today, ...CLOSED_STAGES]
      )
    ).map((record) => leadOut(record));
    const recent = (await many(db, `${LEAD_SELECT} ORDER BY id DESC LIMIT 6`)).map((record) => leadOut(record));
    const notifications = await many(
      db,
      "SELECT * FROM notifications WHERE user_id = ? AND read_at IS NULL ORDER BY id DESC LIMIT 12",
      [_req.user.id]
    );
    const open = (
      await one(db, `SELECT COUNT(*) AS n FROM leads WHERE stage NOT IN (${CLOSED_STAGES.map(() => "?").join(",")})`, CLOSED_STAGES)
    ).n;
    res.json({ counts: byStage, open, due, recent, notifications });
  });

  app.post("/api/notifications/:id/read", requireUser, async (req, res) => {
    await exec(db, "UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ?", [
      new Date().toISOString(),
      Number(req.params.id),
      req.user.id,
    ]);
    res.json({ ok: true });
  });

  app.get("/api/leads/export.csv", requireUser, async (_req, res) => {
    const leads = (await many(db, `${LEAD_SELECT} ORDER BY id DESC`)).map((record) => leadOut(record));
    const headers = [
      "Reference",
      "Stage",
      "Contact name",
      "Company",
      "Email",
      "Phone",
      "Facility",
      "Service",
      "Service window",
      "Source",
      "Assignee",
      "Value AUD",
      "Next action",
      "Follow-up",
      "Last contact",
      "Notes",
      "Created",
    ];
    const lines = [headers.join(",")];
    for (const lead of leads) {
      const cells = [
        lead.reference,
        lead.stage,
        lead.contactName,
        lead.companyName,
        lead.email,
        lead.phone,
        lead.facilityDetails,
        lead.service,
        lead.serviceWindow,
        lead.source,
        lead.assigneeName,
        lead.value ?? "",
        lead.nextAction,
        lead.followUpDate || "",
        lead.lastContact || "",
        lead.notes,
        lead.createdAt,
      ];
      lines.push(cells.map(csvCell).join(","));
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=comprehensive-cleaning-leads.csv");
    res.send(lines.join("\n"));
  });

  app.get("/api/leads", requireUser, async (req, res) => {
    const where = [];
    const params = [];
    if (req.query.stage && STAGES.includes(req.query.stage)) {
      where.push("leads.stage = ?");
      params.push(req.query.stage);
    }
    if (req.query.service) {
      where.push("leads.service = ?");
      params.push(clean(req.query.service, 80));
    }
    if (req.query.assignee) {
      where.push("leads.assigned_to = ?");
      params.push(Number(req.query.assignee));
    }
    if (req.query.q) {
      const like = `%${clean(req.query.q, 80).replace(/[%_]/g, "")}%`;
      where.push(
        "(leads.contact_name ILIKE ? OR leads.company_name ILIKE ? OR leads.email ILIKE ? OR leads.phone ILIKE ? OR leads.facility_details ILIKE ?)"
      );
      params.push(like, like, like, like, like);
    }
    const sql = `${LEAD_SELECT} ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY leads.id DESC LIMIT 10000`;
    res.json({ leads: (await many(db, sql, params)).map((record) => leadOut(record)) });
  });

  app.post("/api/leads/clear-samples", requireUser, requireAdmin, async (_req, res) => {
    const result = await exec(db, "DELETE FROM leads WHERE source = 'Sample'");
    res.json({ removed: result.changes });
  });

  app.post("/api/leads", requireUser, async (req, res) => {
    const created = await createLead(db, req.body, { user: req.user, publicForm: false, addActivity, notifyAdmins });
    if (created.error) return res.status(created.status).json({ error: created.error });
    res.status(201).json(created.lead);
  });

  app.get("/api/leads/:id", requireUser, async (req, res) => {
    const record = await one(db, `${LEAD_SELECT} WHERE leads.id = ?`, [Number(req.params.id)]);
    if (!record) return res.status(404).json({ error: "Lead not found." });
    const activities = await many(
      db,
      `SELECT activities.*, users.name AS user_name
       FROM activities LEFT JOIN users ON users.id = activities.user_id
       WHERE lead_id = ? ORDER BY activities.id DESC`,
      [record.id]
    );
    const messages = await many(db, "SELECT * FROM outbox WHERE lead_id = ? ORDER BY id DESC", [record.id]);
    const account = await one(db, "SELECT id, name FROM clients WHERE lead_id = ?", [record.id]);
    res.json({
      lead: leadOut(record),
      activities,
      messages,
      client: account ? { id: account.id, name: account.name } : null,
    });
  });

  app.patch("/api/leads/:id", requireUser, async (req, res) => {
    const existing = await one(db, "SELECT * FROM leads WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "Lead not found." });
    const body = req.body || {};
    const fields = [];
    const params = [];
    const set = (column, value) => {
      fields.push(`${column} = ?`);
      params.push(value);
    };

    if ("contactName" in body) {
      const name = clean(body.contactName, 120);
      if (!name) return res.status(400).json({ error: "Contact name is required." });
      set("contact_name", name);
    }
    if ("companyName" in body) set("company_name", clean(body.companyName, 160));
    if ("email" in body) set("email", clean(body.email, 160));
    if ("phone" in body) set("phone", clean(body.phone, 40));
    if ("facilityDetails" in body) set("facility_details", clean(body.facilityDetails, 2000));
    if ("service" in body) set("service", clean(body.service, 80));
    if ("serviceWindow" in body) set("service_window", clean(body.serviceWindow, 80));
    if ("source" in body) set("source", clean(body.source, 40));
    if ("notes" in body) set("notes", clean(body.notes, 4000));
    if ("nextAction" in body) set("next_action", clean(body.nextAction, 240));
    if ("followUpDate" in body) set("follow_up_date", body.followUpDate ? clean(body.followUpDate, 10) : null);
    if ("lastContact" in body) set("last_contact", body.lastContact ? clean(body.lastContact, 10) : null);
    if ("assignedTo" in body) {
      const assignee = body.assignedTo ? Number(body.assignedTo) : null;
      if (assignee && !(await one(db, "SELECT id FROM users WHERE id = ?", [assignee]))) {
        return res.status(400).json({ error: "That team member does not exist." });
      }
      set("assigned_to", assignee);
    }
    if ("value" in body) {
      if (body.value === null || body.value === "") set("value_cents", null);
      else if (!Number.isFinite(Number(body.value)) || Number(body.value) < 0) {
        return res.status(400).json({ error: "Opportunity value needs to be a number." });
      } else set("value_cents", Math.round(Number(body.value) * 100));
    }
    if ("stage" in body) {
      if (!STAGES.includes(body.stage)) return res.status(400).json({ error: "That stage is not in the pipeline." });
      set("stage", body.stage);
      if (body.stage !== existing.stage && body.stage !== "New" && !("lastContact" in body)) {
        set("last_contact", new Date().toISOString().slice(0, 10));
      }
    }
    if (!fields.length) return res.status(400).json({ error: "Nothing to update." });
    set("updated_at", new Date().toISOString());
    params.push(existing.id);
    await exec(db, `UPDATE leads SET ${fields.join(", ")} WHERE id = ?`, params);

    if ("stage" in body && body.stage !== existing.stage) {
      await addActivity(existing.id, req.user.id, "stage", `${req.user.name} moved this from ${existing.stage} to ${body.stage}.`);
      if (body.stage === "Won") await ensureClientFromWonLead(db, existing.id);
    } else {
      await addActivity(existing.id, req.user.id, "update", `${req.user.name} updated the lead.`);
    }
    const record = await one(db, `${LEAD_SELECT} WHERE leads.id = ?`, [existing.id]);
    res.json({ lead: leadOut(record) });
  });

  app.post("/api/leads/:id/notes", requireUser, async (req, res) => {
    const existing = await one(db, "SELECT id FROM leads WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "Lead not found." });
    const body = clean(req.body?.body, 4000);
    if (!body) return res.status(400).json({ error: "Write a note before saving." });
    await addActivity(existing.id, req.user.id, "note", body);
    await exec(db, "UPDATE leads SET updated_at = ?, last_contact = ? WHERE id = ?", [
      new Date().toISOString(),
      new Date().toISOString().slice(0, 10),
      existing.id,
    ]);
    res.status(201).json({ ok: true });
  });

  app.delete("/api/leads/:id", requireUser, requireAdmin, async (req, res) => {
    const result = await exec(db, "DELETE FROM leads WHERE id = ?", [Number(req.params.id)]);
    if (!result.changes) return res.status(404).json({ error: "Lead not found." });
    res.json({ ok: true });
  });

  app.post("/api/enquiries", limit, async (req, res) => {
    if (clean(req.body?.companyWebsite, 200)) return res.status(201).json({ reference: "CC-0000", id: 0 });
    const created = await createLead(db, { ...req.body, source: "Website" }, { publicForm: true, addActivity, notifyAdmins });
    if (created.error) return res.status(created.status).json({ error: created.error });
    res.status(201).json({ id: created.lead.id, reference: created.lead.reference });
  });

  registerContent(app, db, { requireUser, requireAdmin });
  registerOps(app, db, { requireUser, requireAdmin });

  const uploads = path.resolve(__dirname, "../../client/public/uploads");
  app.use("/uploads", express.static(uploads));

  const dist = path.resolve(__dirname, "../../client/dist");
  if (existsSync(dist)) {
    app.use(express.static(dist));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      res.sendFile(path.join(dist, "index.html"));
    });
  }

  app.use((error, _req, res, _next) => {
    console.error(error);
    if (!res.headersSent) res.status(500).json({ error: "Something went wrong." });
  });

  return app;
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

async function createLead(db, input, { user = null, publicForm, addActivity, notifyAdmins }) {
  const contactName = clean(input?.contactName, 120);
  const email = clean(input?.email, 160);
  const phone = clean(input?.phone, 40);
  if (!contactName) return { status: 400, error: "Contact name is required." };
  if (!email && !phone) return { status: 400, error: "Add an email address or a phone number." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { status: 400, error: "That email address does not look right." };
  const service = clean(input?.service, 80);
  if (!publicForm) {
    if (!email || !phone) return { status: 400, error: "Email and phone are both required." };
    if (!clean(input?.companyName, 160)) return { status: 400, error: "Company is required." };
    if (!clean(input?.facilityDetails, 2000)) return { status: 400, error: "Facility is required." };
    if (!service) return { status: 400, error: "Choose a service." };
    if (!clean(input?.serviceWindow, 80)) return { status: 400, error: "Choose a service window." };
    if (input?.value === "" || input?.value === null || input?.value === undefined || !Number.isFinite(Number(input.value)) || Number(input.value) < 0) {
      return { status: 400, error: "Enter an estimated value." };
    }
    if (!clean(input?.followUpDate, 10)) return { status: 400, error: "Choose a follow-up date." };
    if (!clean(input?.nextAction, 240)) return { status: 400, error: "Enter the next action." };
    if (!clean(input?.message || input?.notes, 4000)) return { status: 400, error: "Add a note about the opportunity." };
  }
  const knownServices = await publishedServiceNames(db);
  const allowedServices = new Set(knownServices.length ? knownServices : SERVICES);
  allowedServices.add("More than one of these");
  allowedServices.add("Not sure yet");
  if (publicForm && service && !allowedServices.has(service)) return { status: 400, error: "Choose a service from the list." };

  const now = new Date().toISOString();
  const stage = !publicForm && STAGES.includes(input?.stage) ? input.stage : "New";
  const nextAction = publicForm ? "Call and acknowledge the enquiry" : clean(input?.nextAction, 240) || "Make first contact";
  const followUpDate = !publicForm && clean(input?.followUpDate, 10) ? clean(input.followUpDate, 10) : nextWeekday();
  const notes = clean(input?.message || input?.notes, 4000);
  const result = await exec(
    db,
    `INSERT INTO leads (
      contact_name, company_name, email, phone, facility_details, service, service_window,
      source, assigned_to, notes, value_cents, stage, last_contact, next_action, follow_up_date,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
    [
    contactName,
    clean(input?.companyName, 160),
    email,
    phone,
    clean(input?.facilityDetails, 2000),
    service,
    clean(input?.serviceWindow, 80),
    clean(input?.source, 40) || (publicForm ? "Website" : "Other"),
    !publicForm && input?.assignedTo ? Number(input.assignedTo) : null,
    notes,
    !publicForm && (input?.value === 0 || Number(input?.value)) ? Math.round(Number(input.value) * 100) : null,
    stage,
    nextAction,
    followUpDate,
    now,
    now,
    ]
  );
  const id = Number(result.lastInsertRowid);
  const reference = `CC-${String(id).padStart(4, "0")}`;
  await addActivity(id, user?.id || null, "created", publicForm ? "Website enquiry received." : `${user.name} created this lead.`);
  if (notes) await addActivity(id, user?.id || null, "note", notes);

  if (email) {
    await exec(db, "INSERT INTO outbox (lead_id, to_email, subject, body, status, created_at) VALUES (?, ?, ?, ?, ?, ?)", [
      id,
      email,
      `We have your enquiry ${reference}`,
      `Hello ${contactName},\n\nThank you for contacting Comprehensive Cleaning. Your enquiry reference is ${reference}. We will review the site details and be in touch about a site assessment.\n\nComprehensive Cleaning Pty Ltd`,
      "queued",
      now,
    ]);
  }
  await notifyAdmins(
    id,
    `New enquiry ${reference}`,
    `${contactName}${input?.companyName ? ` · ${clean(input.companyName, 160)}` : ""} asked about ${service || "cleaning"}.`
  );

  const record = await one(
    db,
    `SELECT leads.*, users.name AS assignee_name FROM leads LEFT JOIN users ON users.id = leads.assigned_to WHERE leads.id = ?`,
    [id]
  );
  return { lead: leadOut(record) };
}

export async function start(port = process.env.PORT || 4000) {
  if (Number(process.versions.node.split(".")[0]) < 22) {
    console.error("Node.js 22 or newer is required.");
    process.exit(1);
  }
  const db = await openDatabase();
  const app = buildApp(db);
  app.listen(port, () => {
    console.log(`CRM API listening on http://127.0.0.1:${port}`);
    console.log("PostgreSQL database is ready. Photographs are stored in the database.");
  });
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invoked) start();
