import { exec, many, one } from "./pgdb.js";
import {
  CLIENT_STATUSES,
  CREW_ROLES,
  CREW_STATUSES,
  INVOICE_STATUSES,
  JOB_STATUSES,
  QUOTE_STATUSES,
  SITE_FREQUENCIES,
} from "../../shared/operations.js";

function clean(value, max) {
  if (value == null) return "";
  return String(value).replace(/\s+/g, " ").trim().slice(0, max);
}

function dollars(cents) {
  return cents == null ? null : Number(cents) / 100;
}

function centsFrom(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return null;
  return Math.round(number * 100);
}

function dateKey(value) {
  const text = clean(value, 10);
  if (!text) return "";
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function localDate(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
}

function weekBounds(from = new Date()) {
  const date = new Date(from);
  date.setHours(12, 0, 0, 0);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setDate(date.getDate() + mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: localDate(start), end: localDate(end) };
}

function clientOut(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    contactName: row.contact_name || "",
    email: row.email || "",
    phone: row.phone || "",
    suburb: row.suburb || "",
    status: row.status,
    notes: row.notes || "",
    leadId: row.lead_id,
    siteCount: row.site_count == null ? undefined : Number(row.site_count),
    createdAt: row.created_at,
  };
}

function siteOut(row) {
  if (!row) return null;
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name || "",
    name: row.name,
    address: row.address || "",
    service: row.service || "",
    frequency: row.frequency || "",
    accessNotes: row.access_notes || "",
    createdAt: row.created_at,
  };
}

function jobOut(row) {
  if (!row) return null;
  return {
    id: row.id,
    siteId: row.site_id,
    siteName: row.site_name || "",
    clientId: row.client_id,
    clientName: row.client_name || "",
    crewId: row.crew_id,
    crewName: row.crew_name || "",
    title: row.title,
    scheduledDate: row.scheduled_date,
    window: row.service_window || "",
    status: row.status,
    notes: row.notes || "",
    createdAt: row.created_at,
  };
}

function quoteOut(row) {
  if (!row) return null;
  return {
    id: row.id,
    reference: `Q-${String(row.id).padStart(4, "0")}`,
    clientId: row.client_id,
    clientName: row.client_name || "",
    leadId: row.lead_id,
    leadName: row.lead_company || row.lead_contact || "",
    title: row.title,
    amount: dollars(row.amount_cents),
    status: row.status,
    validUntil: row.valid_until,
    notes: row.notes || "",
    createdAt: row.created_at,
  };
}

function invoiceOut(row) {
  if (!row) return null;
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name || "",
    number: row.number,
    amount: dollars(row.amount_cents),
    status: row.status,
    issuedOn: row.issued_on,
    dueOn: row.due_on,
    notes: row.notes || "",
    createdAt: row.created_at,
  };
}

function crewOut(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    role: row.role || "",
    phone: row.phone || "",
    status: row.status,
    createdAt: row.created_at,
  };
}

const SITE_FROM = `
  SELECT sites.*, clients.name AS client_name
  FROM sites
  JOIN clients ON clients.id = sites.client_id
`;

const JOB_FROM = `
  SELECT jobs.*, sites.name AS site_name, sites.client_id, clients.name AS client_name, crew.name AS crew_name
  FROM jobs
  JOIN sites ON sites.id = jobs.site_id
  JOIN clients ON clients.id = sites.client_id
  LEFT JOIN crew ON crew.id = jobs.crew_id
`;

const QUOTE_FROM = `
  SELECT quotes.*, clients.name AS client_name, leads.company_name AS lead_company, leads.contact_name AS lead_contact
  FROM quotes
  LEFT JOIN clients ON clients.id = quotes.client_id
  LEFT JOIN leads ON leads.id = quotes.lead_id
`;

const INVOICE_FROM = `
  SELECT invoices.*, clients.name AS client_name
  FROM invoices
  JOIN clients ON clients.id = invoices.client_id
`;

export async function ensureClientFromWonLead(db, leadId) {
  const lead = await one(db, "SELECT * FROM leads WHERE id = ?", [leadId]);
  if (!lead) return null;
  const linked = await one(db, "SELECT id FROM clients WHERE lead_id = ?", [lead.id]);
  if (linked) return linked.id;
  const name = clean(lead.company_name, 160) || clean(lead.contact_name, 160);
  const same = name ? await one(db, "SELECT id, lead_id FROM clients WHERE lower(name) = lower(?)", [name]) : null;
  if (same) {
    if (!same.lead_id) await exec(db, "UPDATE clients SET lead_id = ? WHERE id = ?", [lead.id, same.id]);
    return same.id;
  }
  const now = new Date().toISOString();
  const created = await exec(
    db,
    `INSERT INTO clients (name, contact_name, email, phone, suburb, status, notes, lead_id, created_at)
     VALUES (?, ?, ?, ?, '', 'Onboarding', ?, ?, ?)`,
    [name || "New account", lead.contact_name || "", lead.email || "", lead.phone || "", "Opened when the lead was marked Won.", lead.id, now]
  );
  const frequency = {
    "After production / night": "Nightly",
    "Weekend shutdown": "Shutdown",
    "Between shifts": "Weekly",
    "Business hours": "Weekly",
    "One-off or periodic": "Monthly",
  }[lead.service_window] || "";
  await exec(
    db,
    `INSERT INTO sites (client_id, name, address, service, frequency, access_notes, created_at)
     VALUES (?, ?, '', ?, ?, ?, ?)`,
    [created.lastInsertRowid, clean(lead.facility_details, 120) || "Main site", lead.service || "", frequency, clean(lead.facility_details, 2000), now]
  );
  return created.lastInsertRowid;
}

export function registerOps(app, db, { requireUser, requireAdmin }) {
  app.get("/api/ops/summary", requireUser, async (_req, res) => {
    const clients = await one(db, "SELECT COUNT(*) AS n FROM clients");
    const active = await one(db, "SELECT COUNT(*) AS n FROM clients WHERE status = 'Active'");
    const sites = await one(db, "SELECT COUNT(*) AS n FROM sites");
    const { start, end } = weekBounds();
    const today = localDate();
    const weekJobs = await one(db, "SELECT COUNT(*) AS n FROM jobs WHERE scheduled_date >= ? AND scheduled_date <= ?", [start, end]);
    const todayJobs = await one(db, "SELECT COUNT(*) AS n FROM jobs WHERE scheduled_date = ? AND status <> 'Done'", [today]);
    const openQuotes = await one(db, "SELECT COUNT(*) AS n FROM quotes WHERE status IN ('Draft', 'Sent')");
    const unpaid = await one(
      db,
      "SELECT COUNT(*) AS n, COALESCE(SUM(amount_cents), 0) AS cents FROM invoices WHERE status IN ('Draft', 'Sent', 'Overdue')"
    );
    const onShift = await one(db, "SELECT COUNT(*) AS n FROM crew WHERE status = 'On shift'");
    const upcoming = (
      await many(db, `${JOB_FROM} WHERE jobs.scheduled_date >= ? AND jobs.status <> 'Done' ORDER BY jobs.scheduled_date, jobs.id LIMIT 6`, [today])
    ).map(jobOut);
    const invoices = (
      await many(db, `${INVOICE_FROM} WHERE invoices.status IN ('Sent', 'Overdue') ORDER BY invoices.due_on NULLS LAST, invoices.id LIMIT 6`)
    ).map(invoiceOut);
    res.json({
      clients: Number(clients.n),
      activeClients: Number(active.n),
      sites: Number(sites.n),
      jobsThisWeek: Number(weekJobs.n),
      jobsToday: Number(todayJobs.n),
      openQuotes: Number(openQuotes.n),
      unpaidInvoices: Number(unpaid.n),
      unpaidTotal: dollars(unpaid.cents) || 0,
      crewOnShift: Number(onShift.n),
      weekStart: start,
      weekEnd: end,
      upcoming,
      invoices,
    });
  });

  app.get("/api/clients", requireUser, async (req, res) => {
    const params = [];
    let where = "";
    if (req.query.q) {
      const like = `%${clean(req.query.q, 80).replace(/[%_]/g, "")}%`;
      where = "WHERE clients.name ILIKE ? OR clients.contact_name ILIKE ? OR clients.email ILIKE ? OR clients.suburb ILIKE ?";
      params.push(like, like, like, like);
    }
    const rows = await many(
      db,
      `SELECT clients.*, (SELECT COUNT(*) FROM sites WHERE sites.client_id = clients.id) AS site_count
       FROM clients ${where} ORDER BY clients.name`,
      params
    );
    res.json({ clients: rows.map(clientOut) });
  });

  app.post("/api/clients", requireUser, async (req, res) => {
    const name = clean(req.body?.name, 160);
    if (!name) return res.status(400).json({ error: "Account name is required." });
    const status = CLIENT_STATUSES.includes(req.body?.status) ? req.body.status : "Onboarding";
    const leadId = req.body?.leadId ? Number(req.body.leadId) : null;
    if (leadId && !(await one(db, "SELECT id FROM leads WHERE id = ?", [leadId]))) {
      return res.status(400).json({ error: "That lead does not exist." });
    }
    const created = await exec(
      db,
      `INSERT INTO clients (name, contact_name, email, phone, suburb, status, notes, lead_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        clean(req.body?.contactName, 120),
        clean(req.body?.email, 160),
        clean(req.body?.phone, 40),
        clean(req.body?.suburb, 80),
        status,
        clean(req.body?.notes, 2000),
        leadId,
        new Date().toISOString(),
      ]
    );
    const row = await one(db, "SELECT *, 0 AS site_count FROM clients WHERE id = ?", [created.lastInsertRowid]);
    res.status(201).json(clientOut(row));
  });

  app.get("/api/clients/:id", requireUser, async (req, res) => {
    const id = Number(req.params.id);
    const row = await one(
      db,
      `SELECT clients.*, (SELECT COUNT(*) FROM sites WHERE sites.client_id = clients.id) AS site_count
       FROM clients WHERE clients.id = ?`,
      [id]
    );
    if (!row) return res.status(404).json({ error: "Account not found." });
    const sites = (await many(db, `${SITE_FROM} WHERE sites.client_id = ? ORDER BY sites.name`, [id])).map(siteOut);
    const jobs = (await many(db, `${JOB_FROM} WHERE sites.client_id = ? ORDER BY jobs.scheduled_date DESC, jobs.id DESC`, [id])).map(jobOut);
    const quotes = (await many(db, `${QUOTE_FROM} WHERE quotes.client_id = ? ORDER BY quotes.id DESC`, [id])).map(quoteOut);
    const invoices = (await many(db, `${INVOICE_FROM} WHERE invoices.client_id = ? ORDER BY invoices.id DESC`, [id])).map(invoiceOut);
    res.json({ client: clientOut(row), sites, jobs, quotes, invoices });
  });

  app.patch("/api/clients/:id", requireUser, async (req, res) => {
    const existing = await one(db, "SELECT * FROM clients WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "Account not found." });
    const body = req.body || {};
    const fields = [];
    const params = [];
    const set = (column, value) => {
      fields.push(`${column} = ?`);
      params.push(value);
    };
    if ("name" in body) {
      const name = clean(body.name, 160);
      if (!name) return res.status(400).json({ error: "Account name is required." });
      set("name", name);
    }
    if ("contactName" in body) set("contact_name", clean(body.contactName, 120));
    if ("email" in body) set("email", clean(body.email, 160));
    if ("phone" in body) set("phone", clean(body.phone, 40));
    if ("suburb" in body) set("suburb", clean(body.suburb, 80));
    if ("notes" in body) set("notes", clean(body.notes, 2000));
    if ("status" in body) {
      if (!CLIENT_STATUSES.includes(body.status)) return res.status(400).json({ error: "That account status is not used." });
      set("status", body.status);
    }
    if (!fields.length) return res.status(400).json({ error: "Nothing to update." });
    params.push(existing.id);
    await exec(db, `UPDATE clients SET ${fields.join(", ")} WHERE id = ?`, params);
    const row = await one(
      db,
      `SELECT clients.*, (SELECT COUNT(*) FROM sites WHERE sites.client_id = clients.id) AS site_count FROM clients WHERE id = ?`,
      [existing.id]
    );
    res.json({ client: clientOut(row) });
  });

  app.delete("/api/clients/:id", requireUser, requireAdmin, async (req, res) => {
    const result = await exec(db, "DELETE FROM clients WHERE id = ?", [Number(req.params.id)]);
    if (!result.changes) return res.status(404).json({ error: "Account not found." });
    res.json({ ok: true });
  });

  app.get("/api/sites", requireUser, async (_req, res) => {
    const rows = await many(db, `${SITE_FROM} ORDER BY clients.name, sites.name`);
    res.json({ sites: rows.map(siteOut) });
  });

  app.post("/api/sites", requireUser, async (req, res) => {
    const clientId = Number(req.body?.clientId);
    const name = clean(req.body?.name, 160);
    if (!name) return res.status(400).json({ error: "Site name is required." });
    if (!(await one(db, "SELECT id FROM clients WHERE id = ?", [clientId]))) {
      return res.status(400).json({ error: "Choose an account for this site." });
    }
    const frequency = clean(req.body?.frequency, 40);
    if (frequency && !SITE_FREQUENCIES.includes(frequency)) return res.status(400).json({ error: "That frequency is not used." });
    const created = await exec(
      db,
      `INSERT INTO sites (client_id, name, address, service, frequency, access_notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clientId, name, clean(req.body?.address, 200), clean(req.body?.service, 80), frequency, clean(req.body?.accessNotes, 2000), new Date().toISOString()]
    );
    const row = await one(db, `${SITE_FROM} WHERE sites.id = ?`, [created.lastInsertRowid]);
    res.status(201).json(siteOut(row));
  });

  app.patch("/api/sites/:id", requireUser, async (req, res) => {
    const existing = await one(db, "SELECT * FROM sites WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "Site not found." });
    const body = req.body || {};
    const fields = [];
    const params = [];
    const set = (column, value) => {
      fields.push(`${column} = ?`);
      params.push(value);
    };
    if ("name" in body) {
      const name = clean(body.name, 160);
      if (!name) return res.status(400).json({ error: "Site name is required." });
      set("name", name);
    }
    if ("address" in body) set("address", clean(body.address, 200));
    if ("service" in body) set("service", clean(body.service, 80));
    if ("accessNotes" in body) set("access_notes", clean(body.accessNotes, 2000));
    if ("frequency" in body) {
      const frequency = clean(body.frequency, 40);
      if (frequency && !SITE_FREQUENCIES.includes(frequency)) return res.status(400).json({ error: "That frequency is not used." });
      set("frequency", frequency);
    }
    if ("clientId" in body) {
      const clientId = Number(body.clientId);
      if (!(await one(db, "SELECT id FROM clients WHERE id = ?", [clientId]))) {
        return res.status(400).json({ error: "Choose an account for this site." });
      }
      set("client_id", clientId);
    }
    if (!fields.length) return res.status(400).json({ error: "Nothing to update." });
    params.push(existing.id);
    await exec(db, `UPDATE sites SET ${fields.join(", ")} WHERE id = ?`, params);
    const row = await one(db, `${SITE_FROM} WHERE sites.id = ?`, [existing.id]);
    res.json({ site: siteOut(row) });
  });

  app.delete("/api/sites/:id", requireUser, requireAdmin, async (req, res) => {
    const result = await exec(db, "DELETE FROM sites WHERE id = ?", [Number(req.params.id)]);
    if (!result.changes) return res.status(404).json({ error: "Site not found." });
    res.json({ ok: true });
  });

  app.get("/api/jobs", requireUser, async (req, res) => {
    const where = [];
    const params = [];
    const from = dateKey(req.query.from);
    const to = dateKey(req.query.to);
    if (req.query.from && !from) return res.status(400).json({ error: "The start date is not valid." });
    if (req.query.to && !to) return res.status(400).json({ error: "The end date is not valid." });
    if (from) {
      where.push("jobs.scheduled_date >= ?");
      params.push(from);
    }
    if (to) {
      where.push("jobs.scheduled_date <= ?");
      params.push(to);
    }
    if (req.query.status) {
      if (!JOB_STATUSES.includes(req.query.status)) return res.status(400).json({ error: "That job status is not used." });
      where.push("jobs.status = ?");
      params.push(req.query.status);
    }
    const sql = `${JOB_FROM} ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY jobs.scheduled_date DESC, jobs.id DESC`;
    res.json({ jobs: (await many(db, sql, params)).map(jobOut) });
  });

  app.post("/api/jobs", requireUser, async (req, res) => {
    const siteId = Number(req.body?.siteId);
    const title = clean(req.body?.title, 160);
    const scheduledDate = dateKey(req.body?.scheduledDate);
    if (!title) return res.status(400).json({ error: "Job title is required." });
    if (!scheduledDate) return res.status(400).json({ error: "Choose the date of the clean." });
    if (!(await one(db, "SELECT id FROM sites WHERE id = ?", [siteId]))) {
      return res.status(400).json({ error: "Choose a site for this job." });
    }
    const status = JOB_STATUSES.includes(req.body?.status) ? req.body.status : "Scheduled";
    const crewId = req.body?.crewId ? Number(req.body.crewId) : null;
    if (crewId && !(await one(db, "SELECT id FROM crew WHERE id = ?", [crewId]))) {
      return res.status(400).json({ error: "That crew member does not exist." });
    }
    const created = await exec(
      db,
      `INSERT INTO jobs (site_id, crew_id, title, scheduled_date, service_window, status, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [siteId, crewId, title, scheduledDate, clean(req.body?.window, 80), status, clean(req.body?.notes, 2000), new Date().toISOString()]
    );
    const row = await one(db, `${JOB_FROM} WHERE jobs.id = ?`, [created.lastInsertRowid]);
    res.status(201).json(jobOut(row));
  });

  app.patch("/api/jobs/:id", requireUser, async (req, res) => {
    const existing = await one(db, "SELECT * FROM jobs WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "Job not found." });
    const body = req.body || {};
    const fields = [];
    const params = [];
    const set = (column, value) => {
      fields.push(`${column} = ?`);
      params.push(value);
    };
    if ("title" in body) {
      const title = clean(body.title, 160);
      if (!title) return res.status(400).json({ error: "Job title is required." });
      set("title", title);
    }
    if ("scheduledDate" in body) {
      const scheduledDate = dateKey(body.scheduledDate);
      if (!scheduledDate) return res.status(400).json({ error: "Choose the date of the clean." });
      set("scheduled_date", scheduledDate);
    }
    if ("window" in body) set("service_window", clean(body.window, 80));
    if ("notes" in body) set("notes", clean(body.notes, 2000));
    if ("status" in body) {
      if (!JOB_STATUSES.includes(body.status)) return res.status(400).json({ error: "That job status is not used." });
      set("status", body.status);
    }
    if ("siteId" in body) {
      const siteId = Number(body.siteId);
      if (!(await one(db, "SELECT id FROM sites WHERE id = ?", [siteId]))) return res.status(400).json({ error: "Choose a site for this job." });
      set("site_id", siteId);
    }
    if ("crewId" in body) {
      const crewId = body.crewId ? Number(body.crewId) : null;
      if (crewId && !(await one(db, "SELECT id FROM crew WHERE id = ?", [crewId]))) {
        return res.status(400).json({ error: "That crew member does not exist." });
      }
      set("crew_id", crewId);
    }
    if (!fields.length) return res.status(400).json({ error: "Nothing to update." });
    params.push(existing.id);
    await exec(db, `UPDATE jobs SET ${fields.join(", ")} WHERE id = ?`, params);
    const row = await one(db, `${JOB_FROM} WHERE jobs.id = ?`, [existing.id]);
    res.json({ job: jobOut(row) });
  });

  app.delete("/api/jobs/:id", requireUser, requireAdmin, async (req, res) => {
    const result = await exec(db, "DELETE FROM jobs WHERE id = ?", [Number(req.params.id)]);
    if (!result.changes) return res.status(404).json({ error: "Job not found." });
    res.json({ ok: true });
  });

  app.get("/api/quotes", requireUser, async (_req, res) => {
    const rows = await many(db, `${QUOTE_FROM} ORDER BY quotes.id DESC`);
    res.json({ quotes: rows.map(quoteOut) });
  });

  app.post("/api/quotes", requireUser, async (req, res) => {
    const title = clean(req.body?.title, 160);
    const amount = centsFrom(req.body?.amount);
    if (!title) return res.status(400).json({ error: "Quote title is required." });
    if (amount == null) return res.status(400).json({ error: "Enter the quote amount." });
    const status = QUOTE_STATUSES.includes(req.body?.status) ? req.body.status : "Draft";
    const clientId = req.body?.clientId ? Number(req.body.clientId) : null;
    const leadId = req.body?.leadId ? Number(req.body.leadId) : null;
    if (clientId && !(await one(db, "SELECT id FROM clients WHERE id = ?", [clientId]))) {
      return res.status(400).json({ error: "That account does not exist." });
    }
    if (leadId && !(await one(db, "SELECT id FROM leads WHERE id = ?", [leadId]))) {
      return res.status(400).json({ error: "That lead does not exist." });
    }
    const validUntil = req.body?.validUntil ? dateKey(req.body.validUntil) : null;
    if (req.body?.validUntil && !validUntil) return res.status(400).json({ error: "The valid-until date is not valid." });
    const created = await exec(
      db,
      `INSERT INTO quotes (client_id, lead_id, title, amount_cents, status, valid_until, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [clientId, leadId, title, amount, status, validUntil, clean(req.body?.notes, 2000), new Date().toISOString()]
    );
    const row = await one(db, `${QUOTE_FROM} WHERE quotes.id = ?`, [created.lastInsertRowid]);
    res.status(201).json(quoteOut(row));
  });

  app.patch("/api/quotes/:id", requireUser, async (req, res) => {
    const existing = await one(db, "SELECT * FROM quotes WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "Quote not found." });
    const body = req.body || {};
    const fields = [];
    const params = [];
    const set = (column, value) => {
      fields.push(`${column} = ?`);
      params.push(value);
    };
    if ("title" in body) {
      const title = clean(body.title, 160);
      if (!title) return res.status(400).json({ error: "Quote title is required." });
      set("title", title);
    }
    if ("amount" in body) {
      const amount = centsFrom(body.amount);
      if (amount == null) return res.status(400).json({ error: "Enter the quote amount." });
      set("amount_cents", amount);
    }
    if ("status" in body) {
      if (!QUOTE_STATUSES.includes(body.status)) return res.status(400).json({ error: "That quote status is not used." });
      set("status", body.status);
    }
    if ("notes" in body) set("notes", clean(body.notes, 2000));
    if ("validUntil" in body) {
      const validUntil = body.validUntil ? dateKey(body.validUntil) : null;
      if (body.validUntil && !validUntil) return res.status(400).json({ error: "The valid-until date is not valid." });
      set("valid_until", validUntil);
    }
    if ("clientId" in body) {
      const clientId = body.clientId ? Number(body.clientId) : null;
      if (clientId && !(await one(db, "SELECT id FROM clients WHERE id = ?", [clientId]))) {
        return res.status(400).json({ error: "That account does not exist." });
      }
      set("client_id", clientId);
    }
    if (!fields.length) return res.status(400).json({ error: "Nothing to update." });
    params.push(existing.id);
    await exec(db, `UPDATE quotes SET ${fields.join(", ")} WHERE id = ?`, params);
    const row = await one(db, `${QUOTE_FROM} WHERE quotes.id = ?`, [existing.id]);
    res.json({ quote: quoteOut(row) });
  });

  app.delete("/api/quotes/:id", requireUser, requireAdmin, async (req, res) => {
    const result = await exec(db, "DELETE FROM quotes WHERE id = ?", [Number(req.params.id)]);
    if (!result.changes) return res.status(404).json({ error: "Quote not found." });
    res.json({ ok: true });
  });

  app.get("/api/invoices", requireUser, async (_req, res) => {
    const rows = await many(db, `${INVOICE_FROM} ORDER BY invoices.id DESC`);
    res.json({ invoices: rows.map(invoiceOut) });
  });

  app.post("/api/invoices", requireUser, async (req, res) => {
    const clientId = Number(req.body?.clientId);
    const amount = centsFrom(req.body?.amount);
    if (!(await one(db, "SELECT id FROM clients WHERE id = ?", [clientId]))) {
      return res.status(400).json({ error: "Choose an account for this invoice." });
    }
    if (amount == null) return res.status(400).json({ error: "Enter the invoice amount." });
    const status = INVOICE_STATUSES.includes(req.body?.status) ? req.body.status : "Draft";
    const issuedOn = req.body?.issuedOn ? dateKey(req.body.issuedOn) : localDate();
    const dueOn = req.body?.dueOn ? dateKey(req.body.dueOn) : null;
    if (req.body?.issuedOn && !issuedOn) return res.status(400).json({ error: "The issue date is not valid." });
    if (req.body?.dueOn && !dueOn) return res.status(400).json({ error: "The due date is not valid." });
    const next = await one(db, "SELECT COALESCE(MAX(id), 0) + 1 AS n FROM invoices");
    const number = clean(req.body?.number, 40) || `INV-${1000 + Number(next.n)}`;
    try {
      const created = await exec(
        db,
        `INSERT INTO invoices (client_id, number, amount_cents, status, issued_on, due_on, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [clientId, number, amount, status, issuedOn, dueOn, clean(req.body?.notes, 2000), new Date().toISOString()]
      );
      const row = await one(db, `${INVOICE_FROM} WHERE invoices.id = ?`, [created.lastInsertRowid]);
      res.status(201).json(invoiceOut(row));
    } catch (error) {
      if (error.code === "23505") return res.status(409).json({ error: "That invoice number is already used." });
      throw error;
    }
  });

  app.patch("/api/invoices/:id", requireUser, async (req, res) => {
    const existing = await one(db, "SELECT * FROM invoices WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "Invoice not found." });
    const body = req.body || {};
    const fields = [];
    const params = [];
    const set = (column, value) => {
      fields.push(`${column} = ?`);
      params.push(value);
    };
    if ("number" in body) {
      const number = clean(body.number, 40);
      if (!number) return res.status(400).json({ error: "Invoice number is required." });
      set("number", number);
    }
    if ("amount" in body) {
      const amount = centsFrom(body.amount);
      if (amount == null) return res.status(400).json({ error: "Enter the invoice amount." });
      set("amount_cents", amount);
    }
    if ("status" in body) {
      if (!INVOICE_STATUSES.includes(body.status)) return res.status(400).json({ error: "That invoice status is not used." });
      set("status", body.status);
    }
    if ("notes" in body) set("notes", clean(body.notes, 2000));
    if ("issuedOn" in body) {
      const issuedOn = body.issuedOn ? dateKey(body.issuedOn) : null;
      if (body.issuedOn && !issuedOn) return res.status(400).json({ error: "The issue date is not valid." });
      set("issued_on", issuedOn);
    }
    if ("dueOn" in body) {
      const dueOn = body.dueOn ? dateKey(body.dueOn) : null;
      if (body.dueOn && !dueOn) return res.status(400).json({ error: "The due date is not valid." });
      set("due_on", dueOn);
    }
    if (!fields.length) return res.status(400).json({ error: "Nothing to update." });
    params.push(existing.id);
    try {
      await exec(db, `UPDATE invoices SET ${fields.join(", ")} WHERE id = ?`, params);
    } catch (error) {
      if (error.code === "23505") return res.status(409).json({ error: "That invoice number is already used." });
      throw error;
    }
    const row = await one(db, `${INVOICE_FROM} WHERE invoices.id = ?`, [existing.id]);
    res.json({ invoice: invoiceOut(row) });
  });

  app.delete("/api/invoices/:id", requireUser, requireAdmin, async (req, res) => {
    const result = await exec(db, "DELETE FROM invoices WHERE id = ?", [Number(req.params.id)]);
    if (!result.changes) return res.status(404).json({ error: "Invoice not found." });
    res.json({ ok: true });
  });

  app.get("/api/crew", requireUser, async (_req, res) => {
    const rows = await many(db, "SELECT * FROM crew ORDER BY name");
    res.json({ crew: rows.map(crewOut) });
  });

  app.post("/api/crew", requireUser, async (req, res) => {
    const name = clean(req.body?.name, 120);
    if (!name) return res.status(400).json({ error: "Name is required." });
    const role = CREW_ROLES.includes(req.body?.role) ? req.body.role : "Cleaner";
    const status = CREW_STATUSES.includes(req.body?.status) ? req.body.status : "Available";
    const created = await exec(
      db,
      "INSERT INTO crew (name, role, phone, status, created_at) VALUES (?, ?, ?, ?, ?)",
      [name, role, clean(req.body?.phone, 40), status, new Date().toISOString()]
    );
    const row = await one(db, "SELECT * FROM crew WHERE id = ?", [created.lastInsertRowid]);
    res.status(201).json(crewOut(row));
  });

  app.patch("/api/crew/:id", requireUser, async (req, res) => {
    const existing = await one(db, "SELECT * FROM crew WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "Crew member not found." });
    const body = req.body || {};
    const fields = [];
    const params = [];
    const set = (column, value) => {
      fields.push(`${column} = ?`);
      params.push(value);
    };
    if ("name" in body) {
      const name = clean(body.name, 120);
      if (!name) return res.status(400).json({ error: "Name is required." });
      set("name", name);
    }
    if ("phone" in body) set("phone", clean(body.phone, 40));
    if ("role" in body) {
      if (!CREW_ROLES.includes(body.role)) return res.status(400).json({ error: "That role is not used." });
      set("role", body.role);
    }
    if ("status" in body) {
      if (!CREW_STATUSES.includes(body.status)) return res.status(400).json({ error: "That crew status is not used." });
      set("status", body.status);
    }
    if (!fields.length) return res.status(400).json({ error: "Nothing to update." });
    params.push(existing.id);
    await exec(db, `UPDATE crew SET ${fields.join(", ")} WHERE id = ?`, params);
    const row = await one(db, "SELECT * FROM crew WHERE id = ?", [existing.id]);
    res.json({ crew: crewOut(row) });
  });

  app.delete("/api/crew/:id", requireUser, requireAdmin, async (req, res) => {
    const result = await exec(db, "DELETE FROM crew WHERE id = ?", [Number(req.params.id)]);
    if (!result.changes) return res.status(404).json({ error: "Crew member not found." });
    res.json({ ok: true });
  });
}
