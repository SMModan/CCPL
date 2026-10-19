import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import { ensurePages, ensureSettings, seedContent } from "./seedContent.js";
import { connectAndMigrate, exec, one } from "./pgdb.js";

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 64);
  const prev = Buffer.from(hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

export function asRow(record) {
  return record ? { ...record } : null;
}

export function asRows(records) {
  return records.map((record) => ({ ...record }));
}

export async function openDatabase(target) {
  const db = await connectAndMigrate(target);
  await seed(db);
  await ensureCrmUsers(db);
  await ensureDemoLeads(db);
  await ensureOperations(db);
  await seedContent(db);
  await ensureSettings(db);
  await ensurePages(db);
  return db;
}

async function ensureCrmUsers(db) {
  const now = new Date().toISOString();
  const people = [
    ["David Simpson", "david.simpson@comprehensivecleaning.local", process.env.ADMIN_PASSWORD || "Assessment-2026", "admin"],
    ["Operations", "operations@comprehensivecleaning.local", process.env.SALES_PASSWORD || "Pipeline-2026", "sales"],
  ];
  for (const [name, email, password, role] of people) {
    const existing = await one(db, "SELECT id FROM users WHERE lower(email) = lower(?)", [email]);
    if (existing) continue;
    await exec(
      db,
      "INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashPassword(password), role, now]
    );
  }
}

async function seed(db) {
  const count = (await one(db, "SELECT COUNT(*) AS n FROM users")).n;
  if (count > 0) return;

  const now = new Date().toISOString();
  const adminPassword = process.env.ADMIN_PASSWORD || "Assessment-2026";
  const salesPassword = process.env.SALES_PASSWORD || "Pipeline-2026";
  await exec(
    db,
    "INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
    ["David Simpson", "david.simpson@comprehensivecleaning.local", hashPassword(adminPassword), "admin", now]
  );
  await exec(
    db,
    "INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
    ["Operations", "operations@comprehensivecleaning.local", hashPassword(salesPassword), "sales", now]
  );
}

function shiftDate(days) {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

async function ensureDemoLeads(db) {
  const existing = await one(db, "SELECT id FROM leads WHERE email ILIKE ?", ["%@demo.invalid"]);
  if (existing) return;

  const admin = await one(db, "SELECT id, name FROM users WHERE lower(email) = lower(?)", ["david.simpson@comprehensivecleaning.local"]);
  const sales = await one(db, "SELECT id, name FROM users WHERE lower(email) = lower(?)", ["operations@comprehensivecleaning.local"]);
  const note = "Demonstration record for the CRM. Not a real enquiry.";
  const leads = [
    ["Helen Brooks", "Peel Cold Rooms", "helen.brooks@demo.invalid", "0412 100 201", "Chilled packing room in Mandurah. Production finishes at 10pm.", "Food manufacturing cleaning", "After production / night", "Website", null, 480000, "New", null, "Call and acknowledge the enquiry", 0, -1, "Website form, no one has called yet."],
    ["Mark Adey", "Harbour Warehousing", "mark.adey@demo.invalid", "0413 220 418", "High-bay warehouse, forklifts on the floor until Friday afternoon.", "Industrial & warehouse cleaning", "Weekend shutdown", "Phone", sales?.id ?? null, 1260000, "New", shiftDate(-1).slice(0, 10), "Confirm weekend access and induction", 1, -3, "Phoned in. Waiting on the site supervisor."],
    ["Priya Nair", "Estuary Offices", "priya.nair@demo.invalid", "0418 554 902", "Two-storey office and staff amenities, occupied through the day.", "Commercial & office cleaning", "Business hours", "Email", admin?.id ?? null, 640000, "Contacted", shiftDate(-6).slice(0, 10), "Send the scope notes from the call", -3, -12, "Spoke on Tuesday. Follow-up is overdue."],
    ["Owen Clarke", "Inlet Grain Processors", "owen.clarke@demo.invalid", "0407 881 334", "Dry processing hall and staff amenities. Gap between the morning and afternoon shifts.", "Food manufacturing cleaning", "Between shifts", "LinkedIn", sales?.id ?? null, 1850000, "Contacted", shiftDate(-4).slice(0, 10), "Ask for the current cleaning specification", 6, -18, "LinkedIn message, then a short call."],
    ["Susan Pell", "Murray Packhouse", "susan.pell@demo.invalid", "0421 773 650", "Packhouse plus the dispatch warehouse. They are not sure which window will work.", "More than one of these", "Not sure yet", "Referral", admin?.id ?? null, 2200000, "Qualified", shiftDate(-2).slice(0, 10), "Book a site walk with both areas", 2, -21, "Referred by a supplier. Budget discussed."],
    ["Daniel Khoo", "Coastal Packers", "daniel.khoo@demo.invalid", "0432 119 780", "Ready-meal plant. Night crew can start once production is clear.", "Food manufacturing cleaning", "After production / night", "Website", sales?.id ?? null, 3100000, "Site Assessment", shiftDate(-1).slice(0, 10), "Attend the booked walk-through", 1, -8, "Walk booked for tomorrow morning."],
    ["Rita Bowen", "Greenfields Distribution", "rita.bowen@demo.invalid", "0415 662 014", "Ambient warehouse and a small office. Needs a full weekend to clear the aisles.", "Industrial & warehouse cleaning", "Weekend shutdown", "Phone", null, 920000, "Site Assessment", shiftDate(-5).slice(0, 10), "Write up what was seen on site", 0, -28, "Walk done. Notes still to be written. Due today."],
    ["Chris Lang", "Workshop Street Offices", "chris.lang@demo.invalid", "0402 448 915", "Open-plan office, meeting rooms, and a small kitchen.", "Commercial & office cleaning", "Business hours", "Email", admin?.id ?? null, 1475000, "Proposal / Quote", shiftDate(-3).slice(0, 10), "Chase the quote that was sent", 5, -14, "Quote sent. Waiting on their facilities manager."],
    ["Angela Moss", "Peel Protein Foods", "angela.moss@demo.invalid", "0419 300 672", "Protein processing room and amenities. Ongoing night clean.", "Food manufacturing cleaning", "After production / night", "Referral", sales?.id ?? null, 4800000, "Won", shiftDate(-10).slice(0, 10), "Hand over the start date to operations", -2, -35, "Agreed a monthly night clean."],
    ["Tom Reid", "Estuary Logistics", "tom.reid@demo.invalid", "0428 551 203", "Warehouse aisles cleaned between the day and night shifts.", "Industrial & warehouse cleaning", "Between shifts", "Website", admin?.id ?? null, 2760000, "Won", shiftDate(-20).slice(0, 10), "Confirm the first service date", -12, -49, "Won last month. First service already agreed."],
    ["Nina Walsh", "Harbour Front Offices", "nina.walsh@demo.invalid", "0411 909 446", "Small commercial office. They chose a cheaper quote.", "Commercial & office cleaning", "Business hours", "Phone", sales?.id ?? null, 800000, "Lost", shiftDate(-9).slice(0, 10), "Leave closed unless they come back", -7, -42, "Lost on price. No further action."],
    ["Pat Nguyen", "Home enquiry", "pat.nguyen@demo.invalid", "0408 221 557", "Asked for a one-off house clean. Outside the commercial scope.", "Not sure yet", "One-off or periodic", "Other", null, 0, "Not Suitable", shiftDate(-4).slice(0, 10), "No further action", -4, -10, "Declined. The company does not do domestic cleaning."],
    ["Leah Grant", "Sample Cold Store", "leah.grant@demo.invalid", "0433 700 128", "Cold store, periodic shutdown only. Used as the sample-source example.", "Food manufacturing cleaning", "One-off or periodic", "Sample", sales?.id ?? null, 560000, "Qualified", shiftDate(-1).slice(0, 10), "Confirm the shutdown dates", 4, -4, "Marked Sample so the source chart and badge both show."],
  ];

  const leadSql = `INSERT INTO leads (
    contact_name, company_name, email, phone, facility_details, service, service_window,
    source, assigned_to, notes, value_cents, stage, last_contact, next_action, follow_up_date,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  for (const lead of leads) {
    const created = shiftDate(lead[14]);
    const inserted = await exec(db, leadSql, [
      lead[0], lead[1], lead[2], lead[3], lead[4], lead[5], lead[6], lead[7], lead[8],
      `${note} ${lead[15]}`,
      lead[9], lead[10], lead[11], lead[12], ymdFrom(lead[13]), created, created,
    ]);
    await exec(
      db,
      "INSERT INTO activities (lead_id, user_id, type, body, created_at) VALUES (?, ?, 'note', ?, ?)",
      [inserted.lastInsertRowid, lead[8], lead[15], created]
    );
  }
}

function ymdFrom(days) {
  return shiftDate(days).slice(0, 10);
}

async function ensureOperations(db) {
  const existing = await one(db, "SELECT id FROM clients LIMIT 1");
  if (existing) return;
  const now = new Date().toISOString();

  async function leadId(email) {
    const row = await one(db, "SELECT id FROM leads WHERE lower(email) = lower(?)", [email]);
    return row?.id ?? null;
  }

  async function addClient(name, contact, email, phone, suburb, status, notes) {
    const inserted = await exec(
      db,
      `INSERT INTO clients (name, contact_name, email, phone, suburb, status, notes, lead_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, contact, email, phone, suburb, status, notes, await leadId(email), now]
    );
    return inserted.lastInsertRowid;
  }

  async function addSite(clientId, name, address, service, frequency, access) {
    const inserted = await exec(
      db,
      `INSERT INTO sites (client_id, name, address, service, frequency, access_notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clientId, name, address, service, frequency, access, now]
    );
    return inserted.lastInsertRowid;
  }

  async function addCrew(name, role, phone, status) {
    const inserted = await exec(
      db,
      "INSERT INTO crew (name, role, phone, status, created_at) VALUES (?, ?, ?, ?, ?)",
      [name, role, phone, status, now]
    );
    return inserted.lastInsertRowid;
  }

  const note = "Demonstration record for the CRM.";
  const peel = await addClient("Peel Protein Foods", "Angela Moss", "angela.moss@demo.invalid", "0419 300 672", "Mandurah", "Active", `${note} Monthly night clean of the processing room and amenities.`);
  const estuary = await addClient("Estuary Logistics", "Tom Reid", "tom.reid@demo.invalid", "0428 551 203", "Greenfields", "Active", `${note} Aisle clean between the day and night shifts.`);
  const workshop = await addClient("Workshop Street Offices", "Chris Lang", "chris.lang@demo.invalid", "0402 448 915", "Mandurah", "Onboarding", `${note} Quote sent. Waiting on the facilities manager.`);

  const processing = await addSite(peel, "Processing room", "Gordon Road, Mandurah", "Food manufacturing cleaning", "Nightly", "Production finishes at 10pm. The crew starts once the line is clear.");
  const amenities = await addSite(peel, "Staff amenities", "Gordon Road, Mandurah", "Food manufacturing cleaning", "Nightly", "Cleaned with the night crew.");
  const aisles = await addSite(estuary, "Warehouse aisles", "Pinjarra Road, Greenfields", "Industrial & warehouse cleaning", "Weekly", "Forklifts need to be parked before the crew goes in.");
  const office = await addSite(workshop, "Open-plan office", "Workshop Street, Mandurah", "Commercial & office cleaning", "Weekly", "Occupied through the day. Clean after 5:30pm.");

  const sam = await addCrew("Sam Pereira", "Supervisor", "0412 880 014", "On shift");
  const aisha = await addCrew("Aisha Khan", "Leading hand", "0413 662 441", "On shift");
  const joel = await addCrew("Joel Hart", "Cleaner", "0421 558 903", "Available");
  const mei = await addCrew("Mei Chen", "Cleaner", "0407 221 774", "Leave");

  const jobs = [
    [processing, sam, "Night clean", 0, "After production / night", "On site", "Crew is on the processing floor."],
    [aisles, aisha, "Aisle clean", 0, "Between shifts", "Scheduled", "Confirm the forklifts are parked."],
    [amenities, joel, "Amenities reset", 1, "After production / night", "Scheduled", ""],
    [office, aisha, "After-hours office clean", 2, "Business hours", "Scheduled", "Tentative until the quote is accepted."],
    [aisles, sam, "Aisle clean", -1, "Between shifts", "Done", "Completed between shifts."],
    [processing, aisha, "Night clean", 3, "After production / night", "Scheduled", ""],
    [aisles, joel, "Aisle clean", 5, "Between shifts", "Scheduled", ""],
    [processing, sam, "Night clean", -3, "After production / night", "Done", ""],
    [amenities, mei, "Amenities reset", -2, "After production / night", "Missed", "Crew member was on leave. Needs a rebook."],
  ];
  for (const job of jobs) {
    await exec(
      db,
      `INSERT INTO jobs (site_id, crew_id, title, scheduled_date, service_window, status, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [job[0], job[1], job[2], ymdFrom(job[3]), job[4], job[5], job[6], now]
    );
  }

  const coastal = await leadId("daniel.khoo@demo.invalid");
  const quotes = [
    [peel, await leadId("angela.moss@demo.invalid"), "Night clean contract", 4800000, "Accepted", ymdFrom(-10), "Accepted monthly night clean."],
    [estuary, await leadId("tom.reid@demo.invalid"), "Aisle program", 2760000, "Accepted", ymdFrom(-20), "Accepted between-shift aisle clean."],
    [workshop, await leadId("chris.lang@demo.invalid"), "Monthly office clean", 1475000, "Sent", ymdFrom(14), "Waiting on the facilities manager."],
    [null, coastal, "Ready-meal plant, first proposal", 3100000, "Draft", ymdFrom(21), "Draft from the site assessment. Not sent."],
  ];
  for (const quote of quotes) {
    await exec(
      db,
      `INSERT INTO quotes (client_id, lead_id, title, amount_cents, status, valid_until, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [...quote, now]
    );
  }

  const invoices = [
    [peel, "INV-1042", 400000, "Paid", ymdFrom(-30), ymdFrom(-16), "October night clean."],
    [peel, "INV-1048", 400000, "Sent", ymdFrom(-2), ymdFrom(12), "Current month."],
    [estuary, "INV-1036", 230000, "Paid", ymdFrom(-40), ymdFrom(-26), "Previous aisle program."],
    [estuary, "INV-1044", 230000, "Overdue", ymdFrom(-20), ymdFrom(-4), "Still outstanding."],
  ];
  for (const invoice of invoices) {
    await exec(
      db,
      `INSERT INTO invoices (client_id, number, amount_cents, status, issued_on, due_on, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [...invoice, now]
    );
  }
}
