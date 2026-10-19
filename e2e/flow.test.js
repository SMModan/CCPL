import { once } from "node:events";
import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../server/src/index.js";
import { openDatabase } from "../server/src/db.js";
import { closeDatabase } from "../server/src/pgdb.js";

const db = await openDatabase(":memory:");
const app = buildApp(db);
const server = app.listen(0);
await once(server, "listening");
const base = `http://127.0.0.1:${server.address().port}`;

async function json(path, { method = "GET", body, token } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  return { status: response.status, data, text };
}

test("website enquiry becomes a tracked lead", async () => {
  const company = `E2E Cold Store ${Date.now()}`;
  const created = await json("/api/enquiries", {
    method: "POST",
    body: {
      contactName: "Pat Nguyen",
      companyName: company,
      email: "pat@example.com",
      phone: "0400000000",
      facilityDetails: "Chiller and packing room",
      service: "Food manufacturing cleaning",
      serviceWindow: "After production / night",
      message: "Need a walk-through next week.",
    },
  });
  assert.equal(created.status, 201);
  assert.match(created.data.reference, /^CC-\d{4}$/);

  const admin = await json("/api/auth/login", {
    method: "POST",
    body: { email: "david.simpson@comprehensivecleaning.local", password: "Assessment-2026" },
  });
  assert.equal(admin.status, 200);
  const token = admin.data.token;

  const found = await json(`/api/leads?q=${encodeURIComponent(company)}`, { token });
  assert.equal(found.status, 200);
  assert.equal(found.data.leads.length, 1);
  const lead = found.data.leads[0];
  assert.equal(lead.stage, "New");
  assert.equal(lead.source, "Website");
  assert.equal(lead.nextAction, "Call and acknowledge the enquiry");
  assert.ok(lead.followUpDate);

  const detail = await json(`/api/leads/${lead.id}`, { token });
  assert.equal(detail.data.messages[0].status, "queued");
  assert.match(detail.data.messages[0].subject, new RegExp(lead.reference));
  assert.ok(detail.data.activities.some((item) => item.type === "created"));

  const moved = await json(`/api/leads/${lead.id}`, {
    method: "PATCH",
    token,
    body: { stage: "Site Assessment", value: 12000, nextAction: "Walk the chiller" },
  });
  assert.equal(moved.status, 200);
  assert.equal(moved.data.lead.stage, "Site Assessment");
  assert.equal(moved.data.lead.value, 12000);

  const csv = await fetch(base + "/api/leads/export.csv", { headers: { Authorization: `Bearer ${token}` } });
  const sheet = await csv.text();
  assert.equal(csv.status, 200);
  assert.match(sheet, new RegExp(company));
  assert.match(sheet, /Site Assessment/);

  const sales = await json("/api/auth/login", {
    method: "POST",
    body: { email: "operations@comprehensivecleaning.local", password: "Pipeline-2026" },
  });
  const seen = await json(`/api/leads/${lead.id}`, { token: sales.data.token });
  assert.equal(seen.status, 200);
  const denied = await json("/api/users", {
    method: "POST",
    token: sales.data.token,
    body: { name: "New Person", email: "new@example.com", password: "long-enough", role: "sales" },
  });
  assert.equal(denied.status, 403);

  const closed = await json("/api/leads", { token: "" });
  assert.equal(closed.status, 401);
});

test("website content is served from the CRM", async () => {
  const content = await json("/api/content");
  assert.equal(content.status, 200);
  assert.equal(content.data.company.email, "compclean@outlook.com");
  assert.equal(content.data.company.phone, "+61 407 389 985");
  assert.ok(content.data.gallery.length >= 1);
  assert.ok(content.data.services.some((service) => service.name === "Food manufacturing cleaning"));

  const locked = await json("/api/settings", { method: "PUT", body: { phone: "0400000000" } });
  assert.equal(locked.status, 401);

  const admin = await json("/api/auth/login", {
    method: "POST",
    body: { email: "david.simpson@comprehensivecleaning.local", password: "Assessment-2026" },
  });
  const saved = await json("/api/settings", {
    method: "PUT",
    token: admin.data.token,
    body: { heroKicker: "Updated from the CRM" },
  });
  assert.equal(saved.status, 200);
  assert.equal(saved.data.home.heroKicker, "Updated from the CRM");

  const sales = await json("/api/auth/login", {
    method: "POST",
    body: { email: "operations@comprehensivecleaning.local", password: "Pipeline-2026" },
  });
  const denied = await json("/api/settings", {
    method: "PUT",
    token: sales.data.token,
    body: { phone: "0400000000" },
  });
  assert.equal(denied.status, 403);
});

test("enquiry requires a way to reply", async () => {
  const response = await json("/api/enquiries", {
    method: "POST",
    body: { contactName: "No Contact", service: "Commercial & office cleaning" },
  });
  assert.equal(response.status, 400);
});

test("a won lead opens a client, site, and job", async () => {
  const admin = await json("/api/auth/login", {
    method: "POST",
    body: { email: "david.simpson@comprehensivecleaning.local", password: "Assessment-2026" },
  });
  const token = admin.data.token;
  const company = `E2E Plant ${Date.now()}`;
  const created = await json("/api/leads", {
    method: "POST",
    token,
    body: {
      contactName: "Ada North",
      companyName: company,
      email: `ada.${Date.now()}@example.com`,
      phone: "0400111222",
      facilityDetails: "Chiller hall",
      service: "Food manufacturing cleaning",
      serviceWindow: "After production / night",
      source: "Phone",
      value: 9000,
      followUpDate: "2026-10-20",
      nextAction: "Confirm the start date",
      notes: "Won in the operations test.",
      stage: "Qualified",
    },
  });
  assert.equal(created.status, 201);

  const won = await json(`/api/leads/${created.data.id}`, { method: "PATCH", token, body: { stage: "Won" } });
  assert.equal(won.status, 200);

  const detail = await json(`/api/leads/${created.data.id}`, { token });
  assert.equal(detail.data.client.name, company);
  const account = await json(`/api/clients/${detail.data.client.id}`, { token });
  assert.equal(account.status, 200);
  assert.equal(account.data.client.status, "Onboarding");
  assert.equal(account.data.sites[0].frequency, "Nightly");

  const job = await json("/api/jobs", {
    method: "POST",
    token,
    body: { siteId: account.data.sites[0].id, title: "E2E night clean", scheduledDate: "2026-10-20", status: "Scheduled" },
  });
  assert.equal(job.status, 201);
  assert.equal(job.data.clientName, company);

  const summary = await json("/api/ops/summary", { token });
  assert.equal(summary.status, 200);
  assert.ok(summary.data.clients >= 1);
  assert.ok(summary.data.sites >= 1);

  const locked = await json("/api/clients");
  assert.equal(locked.status, 401);

  const sales = await json("/api/auth/login", {
    method: "POST",
    body: { email: "operations@comprehensivecleaning.local", password: "Pipeline-2026" },
  });
  const denied = await json(`/api/clients/${detail.data.client.id}`, { method: "DELETE", token: sales.data.token });
  assert.equal(denied.status, 403);
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await closeDatabase(db);
});
