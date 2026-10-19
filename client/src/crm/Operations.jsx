import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SERVICES, WINDOWS } from "../../../shared/pipeline.js";
import {
  CLIENT_STATUSES,
  CREW_ROLES,
  CREW_STATUSES,
  INVOICE_STATUSES,
  JOB_STATUSES,
  QUOTE_STATUSES,
  SITE_FREQUENCIES,
} from "../../../shared/operations.js";
import { api } from "../api";
import { blank, emailOk, hasProblems, moneyOk } from "../validate";
import { AuthContext } from "./auth";
import { InvoiceActions, InvoiceSheet, useIssuer } from "./InvoiceSheet";
import { crmPath } from "./paths";
import Drawer from "./Drawer";

const TONE = {
  Active: "ok",
  Onboarding: "wait",
  Paused: "muted",
  Scheduled: "wait",
  "On site": "ok",
  Done: "ok",
  Missed: "bad",
  Draft: "muted",
  Sent: "wait",
  Accepted: "ok",
  Declined: "bad",
  Paid: "ok",
  Overdue: "bad",
  "On shift": "ok",
  Available: "wait",
  Leave: "muted",
};

export function money(value) {
  if (value == null || value === "") return "—";
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(Number(value));
}

function toneClass(status) {
  return `stage-pill ${TONE[status] || "wait"}`;
}

function dateKey(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
}

function weekDates(offset = 0) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const day = today.getDay();
  const mondayOffset = (day === 0 ? -6 : 1 - day) + offset * 7;
  const start = new Date(today);
  start.setDate(today.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return dateKey(date);
  });
}

function dayName(value) {
  const date = new Date(`${value}T12:00:00`);
  return {
    name: date.toLocaleDateString("en-AU", { weekday: "short" }),
    label: date.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
  };
}

function useCollection(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let gone = false;
    api(path, { auth: true })
      .then((payload) => {
        if (!gone) setData(payload);
      })
      .catch((err) => {
        if (!gone) setError(err.message);
      });
    return () => {
      gone = true;
    };
  }, [path, tick]);
  return { data, error, setError, reload: () => setTick((value) => value + 1) };
}

async function saveStatus(path, body, reload, setError) {
  try {
    await api(path, { method: "PATCH", auth: true, body });
    reload();
  } catch (err) {
    setError(err.message);
  }
}

function PageHead({ eyebrow, title, note, children }) {
  useEffect(() => {
    document.title = `${title} · CRM`;
  }, [title]);
  return (
    <div className="crm-top">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {note && <p className="page-note">{note}</p>}
      </div>
      {children && <div className="editor-links">{children}</div>}
    </div>
  );
}

function CreateForm({ open, title, onClose, onSubmit, error, children }) {
  return (
    <Drawer
      open={open}
      wide
      title={title}
      onClose={onClose}
      footer={(
        <>
          {error && <p className="note">{error}</p>}
          <button className="solid-btn" type="submit" form="create-drawer-form">Save</button>
        </>
      )}
    >
      <form id="create-drawer-form" className="crm-form" noValidate onSubmit={onSubmit}>
        <div className="field-grid">{children}</div>
      </form>
    </Drawer>
  );
}

function Field({ label, children, wide, error, required }) {
  return (
    <label className={`${wide ? "wide " : ""}${error ? "is-invalid" : ""}`}>
      <span>{label}{required && <em aria-hidden="true">*</em>}</span>
      {children}
      {error && <small>{error}</small>}
    </label>
  );
}

function StatusSelect({ value, options, label, onChange }) {
  return (
    <select className="status-select" aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((item) => <option key={item}>{item}</option>)}
    </select>
  );
}

export function Clients() {
  const { data, error, setError, reload } = useCollection("/api/clients");
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ name: "", contactName: "", email: "", phone: "", suburb: "", status: "Onboarding", notes: "" });
  const [q, setQ] = useState("");
  const clients = data?.clients || [];
  const shown = clients.filter((client) => {
    const haystack = `${client.name} ${client.contactName} ${client.suburb} ${client.status}`.toLowerCase();
    return haystack.includes(q.trim().toLowerCase());
  });

  function edit(next) {
    setForm((current) => ({ ...current, ...next }));
    setErrors((current) => {
      const copy = { ...current };
      Object.keys(next).forEach((key) => delete copy[key]);
      return copy;
    });
  }

  async function onSubmit(event) {
    event.preventDefault();
    const found = {};
    if (blank(form.name)) found.name = "Enter the account name.";
    if (!blank(form.email) && !emailOk(form.email)) found.email = "That email address does not look right.";
    setErrors(found);
    if (hasProblems(found)) return;
    setError("");
    try {
      const created = await api("/api/clients", { method: "POST", auth: true, body: form });
      setOpen(false);
      setForm({ name: "", contactName: "", email: "", phone: "", suburb: "", status: "Onboarding", notes: "" });
      reload();
      return created;
    } catch (err) {
      setError(err.message);
    }
    return null;
  }

  return (
    <>
      <PageHead eyebrow="Operations" title="Clients" note="Accounts the crews clean for. A won lead opens one of these.">
        <button className="solid-btn" type="button" onClick={() => setOpen(true)}>New client</button>
      </PageHead>
      <div className="filters">
        <input placeholder="Search account, contact, or suburb" value={q} onChange={(event) => setQ(event.target.value)} />
      </div>
      <CreateForm open={open} title="New client" error={hasProblems(errors) ? "" : error} onClose={() => { setOpen(false); setErrors({}); }} onSubmit={onSubmit}>
        <Field label="Account" required error={errors.name}><input value={form.name} onChange={(event) => edit({ name: event.target.value })} /></Field>
        <Field label="Contact"><input value={form.contactName} onChange={(event) => edit({ contactName: event.target.value })} /></Field>
        <Field label="Email" error={errors.email}><input value={form.email} onChange={(event) => edit({ email: event.target.value })} /></Field>
        <Field label="Phone"><input value={form.phone} onChange={(event) => edit({ phone: event.target.value })} /></Field>
        <Field label="Suburb"><input value={form.suburb} onChange={(event) => setForm({ ...form, suburb: event.target.value })} /></Field>
        <Field label="Status">
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            {CLIENT_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Notes" wide><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
      </CreateForm>
      {!open && error && <p className="note">{error}</p>}
      {!data && !error && <p>Loading clients…</p>}
      {data && (
        <div className="table-wrap">
          <table className="desk">
            <thead>
              <tr><th>Account</th><th>Contact</th><th>Suburb</th><th>Sites</th><th>Status</th></tr>
            </thead>
            <tbody>
              {shown.length === 0 && <tr className="empty-row"><td colSpan={5}>No clients yet.</td></tr>}
              {shown.map((client) => (
                <tr key={client.id}>
                  <td><Link to={crmPath(`clients/${client.id}`)}>{client.name}</Link></td>
                  <td>{client.contactName || "—"}<div className="muted">{client.phone || client.email}</div></td>
                  <td>{client.suburb || "—"}</td>
                  <td>{client.siteCount || 0}</td>
                  <td>
                    <StatusSelect
                      value={client.status}
                      options={CLIENT_STATUSES}
                      label={`Status for ${client.name}`}
                      onChange={(status) => saveStatus(`/api/clients/${client.id}`, { status }, reload, setError)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = AuthContext.current;
  const [pack, setPack] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [siteErrors, setSiteErrors] = useState({});
  const [siteOpen, setSiteOpen] = useState(false);
  const [site, setSite] = useState({ name: "", address: "", service: SERVICES[0], frequency: "Weekly", accessNotes: "" });
  const [openInvoice, setOpenInvoice] = useState(null);
  const [pdfError, setPdfError] = useState("");
  const company = useIssuer();

  async function load() {
    const detail = await api(`/api/clients/${id}`, { auth: true });
    setPack(detail);
    setForm(detail.client);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [id]);

  if (error && !form) return <p className="note">{error}</p>;
  if (!form || !pack) return <p>Loading client…</p>;

  async function save(event) {
    event.preventDefault();
    const found = {};
    if (blank(form.name)) found.name = "Enter the account name.";
    if (!blank(form.email) && !emailOk(form.email)) found.email = "That email address does not look right.";
    setFieldErrors(found);
    if (hasProblems(found)) return;
    setError("");
    try {
      await api(`/api/clients/${id}`, {
        method: "PATCH",
        auth: true,
        body: {
          name: form.name,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone,
          suburb: form.suburb,
          status: form.status,
          notes: form.notes,
        },
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addSite(event) {
    event.preventDefault();
    const found = {};
    if (blank(site.name)) found.name = "Enter the site name.";
    setSiteErrors(found);
    if (hasProblems(found)) return;
    setError("");
    try {
      await api("/api/sites", { method: "POST", auth: true, body: { ...site, clientId: Number(id) } });
      setSiteOpen(false);
      setSite({ name: "", address: "", service: SERVICES[0], frequency: "Weekly", accessNotes: "" });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove() {
    try {
      await api(`/api/clients/${id}`, { method: "DELETE", auth: true });
      navigate(crmPath("clients"));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <PageHead eyebrow="Client" title={form.name}>
        {form.leadId && <Link className="ghost-btn dark" to={crmPath(`leads/${form.leadId}`)}>Open lead</Link>}
      </PageHead>
      <div className="detail">
        <form className="crm-form panel" noValidate onSubmit={save}>
          <div className="field-grid">
            <Field label="Account" required error={fieldErrors.name}><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
            <Field label="Status">
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                {CLIENT_STATUSES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Contact"><input value={form.contactName} onChange={(event) => setForm({ ...form, contactName: event.target.value })} /></Field>
            <Field label="Suburb"><input value={form.suburb} onChange={(event) => setForm({ ...form, suburb: event.target.value })} /></Field>
            <Field label="Email" error={fieldErrors.email}><input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
            <Field label="Phone"><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
            <Field label="Notes" wide><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
          </div>
          {error && <p className="note">{error}</p>}
          <div className="form-actions">
            <button className="solid-btn" type="submit">Save account</button>
            {auth.user?.role === "admin" && <button className="ghost-btn dark" type="button" onClick={remove}>Delete account</button>}
          </div>
        </form>
        <div className="ops-side">
          <section className="panel">
            <div className="ops-create-bar">
              <h2>Sites</h2>
              <button className="ghost-btn dark" type="button" onClick={() => setSiteOpen(true)}>Add site</button>
            </div>
            <CreateForm open={siteOpen} title="Add site" error={hasProblems(siteErrors) ? "" : error} onClose={() => { setSiteOpen(false); setSiteErrors({}); }} onSubmit={addSite}>
              <Field label="Site name" required error={siteErrors.name}><input value={site.name} onChange={(event) => setSite({ ...site, name: event.target.value })} /></Field>
              <Field label="Address"><input value={site.address} onChange={(event) => setSite({ ...site, address: event.target.value })} /></Field>
              <Field label="Service">
                <select value={site.service} onChange={(event) => setSite({ ...site, service: event.target.value })}>
                  {SERVICES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Frequency">
                <select value={site.frequency} onChange={(event) => setSite({ ...site, frequency: event.target.value })}>
                  {SITE_FREQUENCIES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Access" wide><textarea value={site.accessNotes} onChange={(event) => setSite({ ...site, accessNotes: event.target.value })} /></Field>
            </CreateForm>
            <ul className="stack-list">
              {pack.sites.length === 0 && <li>No sites yet.</li>}
              {pack.sites.map((item) => (
                <li key={item.id}>
                  <strong>{item.name}</strong>
                  <span className="muted">{item.frequency || "Frequency not set"} · {item.service || "Service not set"}</span>
                  {item.address && <span className="muted">{item.address}</span>}
                  {item.accessNotes && <span>{item.accessNotes}</span>}
                </li>
              ))}
            </ul>
          </section>
          <section className="panel">
            <h2>Jobs</h2>
            <ul className="stack-list">
              {pack.jobs.length === 0 && <li>No jobs booked.</li>}
              {pack.jobs.slice(0, 8).map((job) => (
                <li key={job.id}>
                  <strong>{job.title}</strong>
                  <span className="muted">{job.scheduledDate} · {job.siteName} · {job.crewName || "Unassigned"}</span>
                  <span className={toneClass(job.status)}>{job.status}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="panel">
            <h2>Quotes and invoices</h2>
            <ul className="stack-list">
              {pack.quotes.length === 0 && pack.invoices.length === 0 && <li>Nothing billed yet.</li>}
              {pack.quotes.map((quote) => (
                <li key={`q-${quote.id}`}>
                  <strong>{quote.reference} · {quote.title}</strong>
                  <span className="muted">{money(quote.amount)}</span>
                  <span className={toneClass(quote.status)}>{quote.status}</span>
                </li>
              ))}
              {pack.invoices.map((invoice) => (
                <li key={`i-${invoice.id}`} className="invoice-mini">
                  <div>
                    <strong>{invoice.number}</strong>
                    <span className="muted">{money(invoice.amount)} · due {invoice.dueOn || "—"}</span>
                    <span className={toneClass(invoice.status)}>{invoice.status}</span>
                  </div>
                  <InvoiceActions invoice={invoice} client={form} company={company} onOpen={setOpenInvoice} onError={setPdfError} />
                </li>
              ))}
            </ul>
            {pdfError && <p className="note">{pdfError}</p>}
          </section>
        </div>
      </div>
      {openInvoice && (
        <InvoiceSheet invoice={openInvoice} client={form} company={company} onClose={() => setOpenInvoice(null)} />
      )}
    </>
  );
}

export function Sites() {
  const sites = useCollection("/api/sites");
  const clients = useCollection("/api/clients");
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ clientId: "", name: "", address: "", service: SERVICES[0], frequency: "Weekly", accessNotes: "" });
  const rows = sites.data?.sites || [];

  async function onSubmit(event) {
    event.preventDefault();
    const found = {};
    if (!form.clientId) found.clientId = "Choose an account.";
    if (blank(form.name)) found.name = "Enter the site name.";
    setErrors(found);
    if (hasProblems(found)) return;
    sites.setError("");
    try {
      await api("/api/sites", { method: "POST", auth: true, body: { ...form, clientId: Number(form.clientId) } });
      setOpen(false);
      setForm({ clientId: "", name: "", address: "", service: SERVICES[0], frequency: "Weekly", accessNotes: "" });
      sites.reload();
      clients.reload();
    } catch (err) {
      sites.setError(err.message);
    }
  }

  return (
    <>
      <PageHead eyebrow="Operations" title="Sites" note="The rooms, plants, and floors a crew actually walks into.">
        <button className="solid-btn" type="button" onClick={() => setOpen(true)}>New site</button>
      </PageHead>
      <CreateForm open={open} title="New site" error={hasProblems(errors) ? "" : sites.error} onClose={() => { setOpen(false); setErrors({}); }} onSubmit={onSubmit}>
        <Field label="Account" required error={errors.clientId}>
          <select value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>
            <option value="">Choose an account</option>
            {(clients.data?.clients || []).map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </Field>
        <Field label="Site" required error={errors.name}><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
        <Field label="Address" wide><input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field>
        <Field label="Service">
          <select value={form.service} onChange={(event) => setForm({ ...form, service: event.target.value })}>
            {SERVICES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Frequency">
          <select value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value })}>
            {SITE_FREQUENCIES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Access" wide><textarea value={form.accessNotes} onChange={(event) => setForm({ ...form, accessNotes: event.target.value })} /></Field>
      </CreateForm>
      {!open && sites.error && <p className="note">{sites.error}</p>}
      {!sites.data && !sites.error && <p>Loading sites…</p>}
      {sites.data && (
        <div className="table-wrap">
          <table className="desk">
            <thead>
              <tr><th>Site</th><th>Account</th><th>Service</th><th>Frequency</th><th>Access</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr className="empty-row"><td colSpan={5}>No sites yet.</td></tr>}
              {rows.map((site) => (
                <tr key={site.id}>
                  <td><strong>{site.name}</strong><div className="muted">{site.address}</div></td>
                  <td><Link to={crmPath(`clients/${site.clientId}`)}>{site.clientName}</Link></td>
                  <td>{site.service || "—"}</td>
                  <td>{site.frequency || "—"}</td>
                  <td>{site.accessNotes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function Jobs() {
  const jobs = useCollection("/api/jobs");
  const sites = useCollection("/api/sites");
  const crew = useCollection("/api/crew");
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({ siteId: "", crewId: "", title: "", scheduledDate: dateKey(), window: WINDOWS[0], status: "Scheduled", notes: "" });
  const rows = (jobs.data?.jobs || []).filter((job) => !status || job.status === status);

  async function onSubmit(event) {
    event.preventDefault();
    const found = {};
    if (!form.siteId) found.siteId = "Choose a site.";
    if (blank(form.title)) found.title = "Enter a job title.";
    if (blank(form.scheduledDate)) found.scheduledDate = "Choose the date of the clean.";
    setErrors(found);
    if (hasProblems(found)) return;
    jobs.setError("");
    try {
      await api("/api/jobs", {
        method: "POST",
        auth: true,
        body: { ...form, siteId: Number(form.siteId), crewId: form.crewId ? Number(form.crewId) : null },
      });
      setOpen(false);
      jobs.reload();
    } catch (err) {
      jobs.setError(err.message);
    }
  }

  return (
    <>
      <PageHead eyebrow="Operations" title="Jobs" note="Each visit a crew is booked to do.">
        <Link className="ghost-btn dark" to={crmPath("schedule")}>Week view</Link>
        <button className="solid-btn" type="button" onClick={() => setOpen(true)}>New job</button>
      </PageHead>
      <div className="filters">
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {JOB_STATUSES.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <CreateForm open={open} title="New job" error={hasProblems(errors) ? "" : jobs.error} onClose={() => { setOpen(false); setErrors({}); }} onSubmit={onSubmit}>
        <Field label="Site" required error={errors.siteId}>
          <select value={form.siteId} onChange={(event) => setForm({ ...form, siteId: event.target.value })}>
            <option value="">Choose a site</option>
            {(sites.data?.sites || []).map((site) => <option key={site.id} value={site.id}>{site.clientName} · {site.name}</option>)}
          </select>
        </Field>
        <Field label="Crew">
          <select value={form.crewId} onChange={(event) => setForm({ ...form, crewId: event.target.value })}>
            <option value="">Unassigned</option>
            {(crew.data?.crew || []).map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
        </Field>
        <Field label="Title" required error={errors.title}><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field>
        <Field label="Date" required error={errors.scheduledDate}><input type="date" value={form.scheduledDate} onChange={(event) => setForm({ ...form, scheduledDate: event.target.value })} /></Field>
        <Field label="Window">
          <select value={form.window} onChange={(event) => setForm({ ...form, window: event.target.value })}>
            {WINDOWS.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            {JOB_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Notes" wide><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
      </CreateForm>
      {!open && jobs.error && <p className="note">{jobs.error}</p>}
      {!jobs.data && !jobs.error && <p>Loading jobs…</p>}
      {jobs.data && (
        <div className="table-wrap">
          <table className="desk">
            <thead>
              <tr><th>Date</th><th>Job</th><th>Site</th><th>Crew</th><th>Window</th><th>Status</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr className="empty-row"><td colSpan={6}>No jobs booked.</td></tr>}
              {rows.map((job) => (
                <tr key={job.id}>
                  <td>{job.scheduledDate}</td>
                  <td><strong>{job.title}</strong>{job.notes && <div className="muted">{job.notes}</div>}</td>
                  <td><Link to={crmPath(`clients/${job.clientId}`)}>{job.clientName}</Link><div className="muted">{job.siteName}</div></td>
                  <td>{job.crewName || "—"}</td>
                  <td>{job.window || "—"}</td>
                  <td>
                    <StatusSelect
                      value={job.status}
                      options={JOB_STATUSES}
                      label={`Status for ${job.title}`}
                      onChange={(next) => saveStatus(`/api/jobs/${job.id}`, { status: next }, jobs.reload, jobs.setError)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function Schedule() {
  const { data, error, setError, reload } = useCollection("/api/jobs");
  const [offset, setOffset] = useState(0);
  const days = useMemo(() => weekDates(offset), [offset]);
  const today = dateKey();
  const jobs = data?.jobs || [];

  return (
    <>
      <PageHead eyebrow="Operations" title="Schedule" note="Monday to Sunday. Change a status here when the crew arrives or finishes." />
      <div className="week-toolbar">
        <button className="ghost-btn dark" type="button" onClick={() => setOffset((value) => value - 1)}>Previous</button>
        <button className="ghost-btn dark" type="button" onClick={() => setOffset(0)}>This week</button>
        <button className="ghost-btn dark" type="button" onClick={() => setOffset((value) => value + 1)}>Next</button>
        <Link className="solid-btn" to={crmPath("jobs")}>All jobs</Link>
      </div>
      {error && <p className="note">{error}</p>}
      {!data && !error && <p>Loading the week…</p>}
      {data && (
        <div className="week-scroll">
          <div className="week-board">
            {days.map((day) => {
              const meta = dayName(day);
              const cards = jobs.filter((job) => job.scheduledDate === day);
              return (
                <section key={day} className={`week-day${day === today ? " is-today" : ""}`}>
                  <header>
                    <strong>{meta.name}</strong>
                    <span>{meta.label}</span>
                  </header>
                  {cards.length === 0 && <p className="column-empty">Clear</p>}
                  {cards.map((job) => (
                    <article key={job.id} className="job-chip">
                      <b>{job.title}</b>
                      <span>{job.clientName}</span>
                      <span>{job.siteName}{job.crewName ? ` · ${job.crewName}` : ""}</span>
                      <StatusSelect
                        value={job.status}
                        options={JOB_STATUSES}
                        label={`Status for ${job.title} on ${day}`}
                        onChange={(status) => saveStatus(`/api/jobs/${job.id}`, { status }, reload, setError)}
                      />
                    </article>
                  ))}
                </section>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

export function Quotes() {
  const quotes = useCollection("/api/quotes");
  const clients = useCollection("/api/clients");
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ clientId: "", title: "", amount: "", status: "Draft", validUntil: "", notes: "" });
  const rows = quotes.data?.quotes || [];

  async function onSubmit(event) {
    event.preventDefault();
    const found = {};
    if (blank(form.title)) found.title = "Enter a quote title.";
    if (!moneyOk(form.amount)) found.amount = "Enter the quote amount.";
    setErrors(found);
    if (hasProblems(found)) return;
    quotes.setError("");
    try {
      await api("/api/quotes", {
        method: "POST",
        auth: true,
        body: {
          ...form,
          amount: Number(form.amount),
          clientId: form.clientId ? Number(form.clientId) : null,
          validUntil: form.validUntil || null,
        },
      });
      setOpen(false);
      setForm({ clientId: "", title: "", amount: "", status: "Draft", validUntil: "", notes: "" });
      quotes.reload();
    } catch (err) {
      quotes.setError(err.message);
    }
  }

  return (
    <>
      <PageHead eyebrow="Commercial" title="Quotes" note="Proposals in draft, out for a decision, or already accepted.">
        <button className="solid-btn" type="button" onClick={() => setOpen(true)}>New quote</button>
      </PageHead>
      <CreateForm open={open} title="New quote" error={hasProblems(errors) ? "" : quotes.error} onClose={() => { setOpen(false); setErrors({}); }} onSubmit={onSubmit}>
        <Field label="Title" required error={errors.title}><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field>
        <Field label="Amount AUD" required error={errors.amount}><input type="number" min="0" step="1" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></Field>
        <Field label="Account">
          <select value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>
            <option value="">No account yet</option>
            {(clients.data?.clients || []).map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            {QUOTE_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Valid until"><input type="date" value={form.validUntil} onChange={(event) => setForm({ ...form, validUntil: event.target.value })} /></Field>
        <Field label="Notes" wide><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
      </CreateForm>
      {!open && quotes.error && <p className="note">{quotes.error}</p>}
      {!quotes.data && !quotes.error && <p>Loading quotes…</p>}
      {quotes.data && (
        <div className="table-wrap">
          <table className="desk">
            <thead>
              <tr><th>Quote</th><th>Title</th><th>Account</th><th>Amount</th><th>Valid until</th><th>Status</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr className="empty-row"><td colSpan={6}>No quotes yet.</td></tr>}
              {rows.map((quote) => (
                <tr key={quote.id}>
                  <td><strong>{quote.reference}</strong></td>
                  <td>{quote.title}{quote.notes && <div className="muted">{quote.notes}</div>}</td>
                  <td>{quote.clientId ? <Link to={crmPath(`clients/${quote.clientId}`)}>{quote.clientName}</Link> : quote.leadName || "—"}</td>
                  <td>{money(quote.amount)}</td>
                  <td>{quote.validUntil || "—"}</td>
                  <td>
                    <StatusSelect
                      value={quote.status}
                      options={QUOTE_STATUSES}
                      label={`Status for ${quote.reference}`}
                      onChange={(status) => saveStatus(`/api/quotes/${quote.id}`, { status }, quotes.reload, quotes.setError)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function Invoices() {
  const invoices = useCollection("/api/invoices");
  const clients = useCollection("/api/clients");
  const company = useIssuer();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [active, setActive] = useState(null);
  const [pdfError, setPdfError] = useState("");
  const [form, setForm] = useState({ clientId: "", amount: "", status: "Sent", issuedOn: dateKey(), dueOn: "", notes: "" });
  const rows = invoices.data?.invoices || [];
  const people = clients.data?.clients || [];
  const outstanding = rows.filter((invoice) => invoice.status !== "Paid").reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  const activeClient = people.find((client) => client.id === active?.clientId);

  async function onSubmit(event) {
    event.preventDefault();
    const found = {};
    if (!form.clientId) found.clientId = "Choose an account.";
    if (!moneyOk(form.amount)) found.amount = "Enter the invoice amount.";
    setErrors(found);
    if (hasProblems(found)) return;
    invoices.setError("");
    try {
      await api("/api/invoices", {
        method: "POST",
        auth: true,
        body: {
          clientId: Number(form.clientId),
          amount: Number(form.amount),
          status: form.status,
          issuedOn: form.issuedOn || null,
          dueOn: form.dueOn || null,
          notes: form.notes,
        },
      });
      setOpen(false);
      setForm({ clientId: "", amount: "", status: "Sent", issuedOn: dateKey(), dueOn: "", notes: "" });
      invoices.reload();
    } catch (err) {
      invoices.setError(err.message);
    }
  }

  return (
    <>
      <PageHead eyebrow="Commercial" title="Invoices" note={invoices.data ? `${money(outstanding)} still open across draft, sent, and overdue invoices.` : "Draft, sent, and overdue invoices."}>
        <button className="solid-btn" type="button" onClick={() => setOpen(true)}>New invoice</button>
      </PageHead>
      <CreateForm open={open} title="New invoice" error={hasProblems(errors) ? "" : invoices.error} onClose={() => { setOpen(false); setErrors({}); }} onSubmit={onSubmit}>
        <Field label="Account" required error={errors.clientId}>
          <select value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>
            <option value="">Choose an account</option>
            {(clients.data?.clients || []).map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </Field>
        <Field label="Amount AUD" required error={errors.amount}><input type="number" min="0" step="1" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></Field>
        <Field label="Status">
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            {INVOICE_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Issued"><input type="date" value={form.issuedOn} onChange={(event) => setForm({ ...form, issuedOn: event.target.value })} /></Field>
        <Field label="Due"><input type="date" value={form.dueOn} onChange={(event) => setForm({ ...form, dueOn: event.target.value })} /></Field>
        <Field label="Notes" wide><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
      </CreateForm>
      {!open && invoices.error && <p className="note">{invoices.error}</p>}
      {!invoices.data && !invoices.error && <p>Loading invoices…</p>}
      {invoices.data && (
        <div className="table-wrap">
          <table className="desk">
            <thead>
              <tr><th>Number</th><th>Account</th><th>Amount</th><th>Issued</th><th>Due</th><th>Status</th><th aria-label="Actions" /></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr className="empty-row"><td colSpan={7}>No invoices yet.</td></tr>}
              {rows.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <button type="button" className="text-link" onClick={() => setActive(invoice)}>{invoice.number}</button>
                    {invoice.notes && <div className="muted">{invoice.notes}</div>}
                  </td>
                  <td><Link to={crmPath(`clients/${invoice.clientId}`)}>{invoice.clientName}</Link></td>
                  <td>{money(invoice.amount)}</td>
                  <td>{invoice.issuedOn || "—"}</td>
                  <td>{invoice.dueOn || "—"}</td>
                  <td>
                    <StatusSelect
                      value={invoice.status}
                      options={INVOICE_STATUSES}
                      label={`Status for ${invoice.number}`}
                      onChange={(status) => saveStatus(`/api/invoices/${invoice.id}`, { status }, invoices.reload, invoices.setError)}
                    />
                  </td>
                  <td>
                    <InvoiceActions
                      invoice={invoice}
                      client={people.find((client) => client.id === invoice.clientId)}
                      company={company}
                      onOpen={setActive}
                      onError={setPdfError}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pdfError && <p className="note">{pdfError}</p>}
      {active && (
        <InvoiceSheet
          invoice={active}
          client={activeClient}
          company={company}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}

export function Crew() {
  const { data, error, setError, reload } = useCollection("/api/crew");
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ name: "", role: "Cleaner", phone: "", status: "Available" });
  const people = data?.crew || [];
  const onShift = people.filter((person) => person.status === "On shift").length;

  async function onSubmit(event) {
    event.preventDefault();
    const found = {};
    if (blank(form.name)) found.name = "Enter a name.";
    setErrors(found);
    if (hasProblems(found)) return;
    setError("");
    try {
      await api("/api/crew", { method: "POST", auth: true, body: form });
      setOpen(false);
      setForm({ name: "", role: "Cleaner", phone: "", status: "Available" });
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <PageHead eyebrow="Operations" title="Crew" note={data ? `${onShift} on shift. This is the cleaning crew, separate from CRM sign-in.` : "The cleaning crew, separate from CRM sign-in."}>
        <button className="solid-btn" type="button" onClick={() => setOpen(true)}>Add crew</button>
      </PageHead>
      <CreateForm open={open} title="New crew member" error={hasProblems(errors) ? "" : error} onClose={() => { setOpen(false); setErrors({}); }} onSubmit={onSubmit}>
        <Field label="Name" required error={errors.name}><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
        <Field label="Role">
          <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
            {CREW_ROLES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Phone"><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
        <Field label="Status">
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            {CREW_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
      </CreateForm>
      {!open && error && <p className="note">{error}</p>}
      {!data && !error && <p>Loading crew…</p>}
      {data && (
        <div className="crew-grid">
          {people.length === 0 && <p>No crew yet.</p>}
          {people.map((person) => (
            <article key={person.id} className="panel crew-card">
              <div className="who-id">
                <span className="avatar" aria-hidden="true">{person.name.slice(0, 1)}</span>
                <div>
                  <strong>{person.name}</strong>
                  <em>{person.role}</em>
                </div>
              </div>
              <p className="muted">{person.phone || "No phone"}</p>
              <StatusSelect
                value={person.status}
                options={CREW_STATUSES}
                label={`Status for ${person.name}`}
                onChange={(status) => saveStatus(`/api/crew/${person.id}`, { status }, reload, setError)}
              />
            </article>
          ))}
        </div>
      )}
    </>
  );
}
