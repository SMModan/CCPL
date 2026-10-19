import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { STAGES, SERVICES, WINDOWS, SOURCES, CLOSED_STAGES } from "../../../shared/pipeline.js";
import { api, downloadCsv, getToken, setToken } from "../api";
import Logo from "../components/Logo";
import { AuthContext } from "./auth";
import { ClientDetail, Clients, Crew, Invoices, Jobs, Quotes, Schedule, Sites, money } from "./Operations";
import { Desk, crmPath } from "./paths";
import { blank, drop, emailOk, hasProblems } from "../validate";
import Drawer from "./Drawer";
import Website from "./Website";
import "./crm.css";

function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  async function refresh() {
    if (!getToken()) {
      setUser(null);
      setReady(true);
      return;
    }
    try {
      const data = await api("/api/auth/me", { auth: true });
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return { user, ready, refresh, setUser };
}

export default function CrmApp({ variant = "classic", base = "/crm" }) {
  Desk.base = base;
  Desk.variant = variant;
  const auth = useAuth();
  AuthContext.current = auth;
  if (!auth.ready) return <main className="crm-main">Loading the CRM…</main>;
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={<Shell />}>
        <Route index element={<Dashboard />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="leads" element={<Leads />} />
        <Route path="leads/new" element={<Navigate to={`${crmPath("leads")}?new=1`} replace />} />
        <Route path="leads/:id" element={<LeadDetail />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="sites" element={<Sites />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="crew" element={<Crew />} />
        <Route path="quotes" element={<Quotes />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="website" element={<Website />} />
        <Route path="content" element={<ContentDesk />} />
      </Route>
    </Routes>
  );
}

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

function Shell() {
  const auth = AuthContext.current;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => { setNavOpen(false); }, [pathname]);
  if (!auth.user) return <Navigate to={crmPath("login")} replace />;

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST", auth: true });
    } catch {
      /* session already gone */
    }
    setToken("");
    auth.setUser(null);
    navigate(crmPath("login"));
  }

  return (
    <div className={`crm${navOpen ? " is-open" : ""}`}>
      <header className="mx-top">
        <div className="mx-brand">
          <button className="mx-burger" type="button" aria-label={navOpen ? "Close menu" : "Open menu"} onClick={() => setNavOpen((open) => !open)}>
            <span /><span /><span />
          </button>
          <Brand />
        </div>
        <div className="mx-top-fill" />
        <Who user={auth.user} onLogout={logout} />
      </header>
      {navOpen && <button className="mx-scrim" type="button" aria-label="Close menu" onClick={() => setNavOpen(false)} />}
      <aside className="crm-side">
        <DeskNav />
      </aside>
      <div className="crm-main">
        <Crumb />
        <div className="crm-body">
          <Outlet />
        </div>
        <footer className="mx-foot">Comprehensive Cleaning · CRM</footer>
      </div>
    </div>
  );
}

function Crumb() {
  const { pathname } = useLocation();
  const base = Desk.base || "/crm";
  const rest = pathname === base ? "" : pathname.startsWith(`${base}/`) ? pathname.slice(base.length + 1) : "";
  const pages = {
    "": ["Dashboard", "Home"],
    pipeline: ["Pipeline", "Leads"],
    leads: ["Leads", "Leads"],
    schedule: ["Schedule", "Operations"],
    jobs: ["Jobs", "Operations"],
    sites: ["Sites", "Operations"],
    clients: ["Clients", "Operations"],
    crew: ["Crew", "Operations"],
    quotes: ["Quotes", "Commercial"],
    invoices: ["Invoices", "Commercial"],
    website: ["Content", "Website"],
    content: ["Launch drafts", "Website"],
  };
  let title = "Dashboard";
  let group = "Home";
  if (pages[rest]) [title, group] = pages[rest];
  else if (/^leads\/\d+$/.test(rest)) { title = "Lead"; group = "Leads"; }
  else if (/^clients\/\d+$/.test(rest)) { title = "Client"; group = "Operations"; }
  const crumbs = [{ label: "Home", to: crmPath() }];
  if (group !== "Home" && group !== title) crumbs.push({ label: group });
  if (title !== "Home") crumbs.push({ label: title });
  return (
    <div className="mx-crumb">
      <h1>{title}</h1>
      <nav aria-label="Breadcrumb">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <span key={crumb.label} className="mx-crumb-item">
              {index > 0 && <span aria-hidden="true">/</span>}
              {crumb.to && !last ? <Link to={crumb.to}>{crumb.label}</Link> : <strong>{crumb.label}</strong>}
            </span>
          );
        })}
      </nav>
    </div>
  );
}

function NavIcon({ name }) {
  const mark = {
    dashboard: (
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.4" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.4" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.4" />
      </>
    ),
    pipeline: (
      <>
        <path d="M4 5h16" />
        <path d="M6.5 5v3.5a5.5 5.5 0 0 0 11 0V5" />
        <path d="M12 14v5" />
        <path d="M9.5 19h5" />
      </>
    ),
    leads: (
      <>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 19.2c.9-3.1 3.3-4.7 6.5-4.7s5.6 1.6 6.5 4.7" />
      </>
    ),
    schedule: (
      <>
        <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
        <path d="M3.5 9.5h17" />
        <path d="M8 3.5V6" />
        <path d="M16 3.5V6" />
      </>
    ),
    jobs: (
      <>
        <path d="M8.5 7V5.8A1.3 1.3 0 0 1 9.8 4.5h4.4A1.3 1.3 0 0 1 15.5 5.8V7" />
        <rect x="3.5" y="7" width="17" height="12.5" rx="2" />
        <path d="M3.5 12h17" />
      </>
    ),
    sites: (
      <>
        <path d="M12 21s6.2-5 6.2-9.6a6.2 6.2 0 1 0-12.4 0C5.8 16 12 21 12 21z" />
        <circle cx="12" cy="11.2" r="2.1" />
      </>
    ),
    clients: (
      <>
        <path d="M4 20.5V7.2A1.2 1.2 0 0 1 5.2 6H11v14.5" />
        <path d="M11 9.5h7.8a1.2 1.2 0 0 1 1.2 1.2v9.8" />
        <path d="M4 20.5h16" />
        <path d="M7 9.2h1.6" />
        <path d="M7 12.4h1.6" />
        <path d="M7 15.6h1.6" />
        <path d="M14.2 13h1.6" />
        <path d="M14.2 16.2h1.6" />
      </>
    ),
    crew: (
      <>
        <circle cx="9" cy="8" r="2.5" />
        <circle cx="16.2" cy="9" r="2" />
        <path d="M3.8 18.8c.7-2.7 2.7-4.2 5.2-4.2s4.5 1.5 5.2 4.2" />
        <path d="M14.4 14.8c1.6-.3 3.1.6 4 2.8" />
      </>
    ),
    quotes: (
      <>
        <path d="M7 3.5h6.5L18.5 8.5V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5z" />
        <path d="M13.5 3.5V8.5h5" />
        <path d="M8.5 13h7" />
        <path d="M8.5 16.5h4.5" />
      </>
    ),
    invoices: (
      <>
        <path d="M7 3.5h10A1.5 1.5 0 0 1 18.5 5v15.2l-2-1.3-2.2 1.3-2.3-1.3-2.2 1.3-2.1-1.3L5.5 20.2V5A1.5 1.5 0 0 1 7 3.5z" />
        <path d="M8.5 8.5h7" />
        <path d="M8.5 12h7" />
        <path d="M8.5 15.5h4" />
      </>
    ),
    content: (
      <>
        <circle cx="12" cy="12" r="8.2" />
        <path d="M3.8 12h16.4" />
        <path d="M12 3.8c2.2 2.4 3.4 5.2 3.4 8.2s-1.2 5.8-3.4 8.2c-2.2-2.4-3.4-5.2-3.4-8.2s1.2-5.8 3.4-8.2z" />
      </>
    ),
    drafts: (
      <>
        <path d="M14 4H7.5A1.5 1.5 0 0 0 6 5.5v13A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V8z" />
        <path d="M14 4v4h4" />
        <path d="M9 13h6" />
        <path d="M9 16h4" />
      </>
    ),
  };
  return (
    <svg className="nav-ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {mark[name]}
    </svg>
  );
}

function DeskNav() {
  const { pathname } = useLocation();
  const onLeadList = pathname === crmPath("leads") || /^\/crm\/leads\/\d+$/.test(pathname);
  return (
    <nav>
      <p className="nav-label">Leads</p>
      <NavLink to={crmPath()} end><NavIcon name="dashboard" />Dashboard</NavLink>
      <NavLink to={crmPath("pipeline")}><NavIcon name="pipeline" />Pipeline</NavLink>
      <NavLink to={crmPath("leads")} className={onLeadList ? "active" : undefined} end><NavIcon name="leads" />Leads</NavLink>
      <p className="nav-label">Operations</p>
      <NavLink to={crmPath("schedule")}><NavIcon name="schedule" />Schedule</NavLink>
      <NavLink to={crmPath("jobs")}><NavIcon name="jobs" />Jobs</NavLink>
      <NavLink to={crmPath("sites")}><NavIcon name="sites" />Sites</NavLink>
      <NavLink to={crmPath("clients")}><NavIcon name="clients" />Clients</NavLink>
      <NavLink to={crmPath("crew")}><NavIcon name="crew" />Crew</NavLink>
      <p className="nav-label">Commercial</p>
      <NavLink to={crmPath("quotes")}><NavIcon name="quotes" />Quotes</NavLink>
      <NavLink to={crmPath("invoices")}><NavIcon name="invoices" />Invoices</NavLink>
      <p className="nav-label">Website</p>
      <NavLink to={crmPath("website")}><NavIcon name="content" />Content</NavLink>
      <NavLink to={crmPath("content")}><NavIcon name="drafts" />Launch drafts</NavLink>
    </nav>
  );
}

function Who({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const role = user.role === "admin" ? "Administrator" : "Sales";
  return (
    <div className="mx-who">
      <button className="mx-who-btn" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
        <span className="mx-who-name">{user.name}</span>
      </button>
      {open && (
        <div className="mx-drop">
          <strong>{user.name}</strong>
          <em>{role}</em>
          <button type="button" onClick={onLogout}>Sign out</button>
        </div>
      )}
    </div>
  );
}

function Login() {
  const auth = AuthContext.current;
  const navigate = useNavigate();
  const [email, setEmail] = useState("david.simpson@comprehensivecleaning.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.title = "Sign in · Comprehensive Cleaning CRM";
  }, []);

  if (auth.user) return <Navigate to={crmPath()} replace />;

  async function onSubmit(event) {
    event.preventDefault();
    const found = {};
    if (blank(email)) found.email = "Enter your email address.";
    else if (!emailOk(email)) found.email = "That email address does not look right.";
    if (blank(password)) found.password = "Enter your password.";
    setErrors(found);
    setError("");
    if (hasProblems(found)) return;
    try {
      const data = await api("/api/auth/login", { method: "POST", body: { email, password } });
      setToken(data.token);
      auth.setUser(data.user);
      navigate(crmPath());
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="crm-login">
      <div className="login-card">
        <Brand to="/" />
        <form noValidate onSubmit={onSubmit}>
          <p className="login-kicker">Staff</p>
          <h1>Sign in</h1>
          <p className="login-lead">Leads, jobs, invoices, and the website.</p>
          <label className={errors.email ? "is-invalid" : undefined}>
            <span>Email<em aria-hidden="true">*</em></span>
            <input value={email} onChange={(event) => { setEmail(event.target.value); setErrors((current) => drop(current, "email")); }} autoComplete="username" />
            {errors.email && <small>{errors.email}</small>}
          </label>
          <label className={errors.password ? "is-invalid" : undefined}>
            <span>Password<em aria-hidden="true">*</em></span>
            <input type="password" value={password} onChange={(event) => { setPassword(event.target.value); setErrors((current) => drop(current, "password")); }} autoComplete="current-password" />
            {errors.password && <small>{errors.password}</small>}
          </label>
          {error && <p className="note">{error}</p>}
          <button className="login-submit" type="submit">Sign in</button>
        </form>
        <div className="demo">
          <p>Demonstration access for this build. Choose an account to fill the form.</p>
          <button type="button" onClick={() => { setEmail("david.simpson@comprehensivecleaning.local"); setPassword("Assessment-2026"); }}>
            <strong>Administrator</strong>
            <span>david.simpson@comprehensivecleaning.local</span>
            <span>Assessment-2026</span>
          </button>
          <button type="button" onClick={() => { setEmail("operations@comprehensivecleaning.local"); setPassword("Pipeline-2026"); }}>
            <strong>Sales</strong>
            <span>operations@comprehensivecleaning.local</span>
            <span>Pipeline-2026</span>
          </button>
        </div>
      </div>
    </main>
  );
}

function Brand({ to }) {
  const [logo, setLogo] = useState("/logo.png");
  const [name, setName] = useState("Comprehensive Cleaning");

  useEffect(() => {
    let gone = false;
    function load() {
      api("/api/content")
        .then((data) => {
          if (gone) return;
          if (data.company?.logo) setLogo(data.company.logo);
          if (data.company?.legalName) setName(data.company.legalName);
        })
        .catch(() => {});
    }
    load();
    function onStorage(event) {
      if (event.key === "cc-site-updated") load();
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("cc-site-updated", load);
    return () => {
      gone = true;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cc-site-updated", load);
    };
  }, []);

  return (
    <Link to={to || crmPath()} className="crm-brand" aria-label={name}>
      <Logo src={logo} />
    </Link>
  );
}

function Dashboard() {
  const serviceNames = useServiceNames();
  const [data, setData] = useState(null);
  const [ops, setOps] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    document.title = "Dashboard · CRM";
    Promise.all([
      api("/api/dashboard", { auth: true }),
      api("/api/leads", { auth: true }),
    ])
      .then(([dash, list]) => setData({ ...dash, leads: list.leads || [] }))
      .catch((err) => setError(err.message));
    api("/api/ops/summary", { auth: true }).then(setOps).catch(() => {});
  }, []);
  if (error) return <p className="note">{error}</p>;
  if (!data) return <p>Loading dashboard…</p>;
  return (
    <>
        <div className="crm-top">
        <div>
          <p className="eyebrow">Today</p>
          <h1>Dashboard</h1>
        </div>
        <button className="solid-btn" type="button" onClick={() => downloadCsv().catch((err) => setError(err.message))}>Export CSV</button>
      </div>
      <section className="cards">
        <article style={{ "--accent": "#4fc3f7" }}><span>Open leads</span><strong>{data.open}</strong></article>
        <article style={{ "--accent": "#36bea6" }}><span>New</span><strong>{data.counts.New || 0}</strong></article>
        <article style={{ "--accent": "#7460ee" }}><span>Site assessments</span><strong>{data.counts["Site Assessment"] || 0}</strong></article>
        <article style={{ "--accent": "#f62d51" }}><span>Follow-ups due</span><strong>{data.due.length}</strong></article>
      </section>
      {ops && (
        <>
          <div className="section-label">
            <h2>Operations</h2>
            <Link to={crmPath("schedule")}>Open the week</Link>
          </div>
          <section className="cards">
            <article style={{ "--accent": "#2962FF" }}><span>Active clients</span><strong>{ops.activeClients}</strong></article>
            <article style={{ "--accent": "#4fc3f7" }}><span>Jobs this week</span><strong>{ops.jobsThisWeek}</strong></article>
            <article style={{ "--accent": "#fb8c00" }}><span>Quotes waiting</span><strong>{ops.openQuotes}</strong></article>
            <article style={{ "--accent": "#f62d51" }}><span>Invoices unpaid</span><strong>{ops.unpaidInvoices}</strong></article>
          </section>
          <div className="panels ops-panels">
            <section className="panel">
              <h2>Coming up</h2>
              <ul>
                {ops.upcoming.length === 0 && <li>No jobs booked ahead.</li>}
                {ops.upcoming.map((job) => (
                  <li key={job.id}>
                    <Link to={crmPath(`clients/${job.clientId}`)}>{job.clientName} · {job.title}</Link>
                    <div className="muted">{job.scheduledDate} · {job.siteName} · {job.crewName || "Unassigned"} · {job.status}</div>
                  </li>
                ))}
              </ul>
            </section>
            <section className="panel">
              <h2>Invoices waiting · {money(ops.unpaidTotal)}</h2>
              <ul>
                {ops.invoices.length === 0 && <li>Nothing outstanding.</li>}
                {ops.invoices.map((invoice) => (
                  <li key={invoice.id}>
                    <Link to={crmPath("invoices")}>{invoice.number} · {invoice.clientName}</Link>
                    <div className="muted">{money(invoice.amount)} · due {invoice.dueOn || "—"} · {invoice.status}</div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
      <div className="chart-grid">
        <section className="panel wide">
          <ChartHead title="Pipeline" note="Leads sitting in each stage" />
          <Columns
            rows={STAGES.map((stage) => ({
              label: stage,
              count: data.counts[stage] || 0,
              muted: CLOSED_STAGES.includes(stage),
            }))}
            label="Pipeline by stage"
          />
        </section>
        <section className="panel">
          <ChartHead title="Open and closed" note={`${data.leads.length} leads in total`} />
          <Ring
            center={data.leads.length}
            caption="leads"
            rows={[
              { label: "Open", count: data.open },
              { label: "Closed", count: Math.max(0, data.leads.length - data.open) },
            ]}
          />
        </section>
        <section className="panel">
          <ChartHead title="By source" note="Where the enquiry came from" />
          <Ring center={data.leads.length} caption="leads" rows={countBy(data.leads, "source", SOURCES)} />
        </section>
        <section className="panel">
          <ChartHead title="By service" note="Published services on the website" />
          <Bars rows={countBy(data.leads, "service", serviceNames)} label="Leads by service" />
        </section>
        <section className="panel">
          <ChartHead title="By cleaning window" note="When the site can take a crew" />
          <Bars rows={countBy(data.leads, "serviceWindow", WINDOWS)} label="Leads by cleaning window" />
        </section>
        <section className="panel wide">
          <ChartHead title="New leads" note="Created over the last eight weeks" />
          <WeekChart leads={data.leads} />
        </section>
      </div>
      <div className="panels">
        <section className="panel">
          <h2>Follow-ups due</h2>
          <ul>
            {data.due.length === 0 && <li>Nothing due today.</li>}
            {data.due.map((lead) => (
              <li key={lead.id}><Link to={crmPath(`leads/${lead.id}`)}>{lead.reference} · {lead.companyName || lead.contactName}</Link> <span className="muted">{lead.followUpDate} · {lead.nextAction}</span></li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <h2>Latest</h2>
          <ul>
            {data.recent.map((lead) => (
              <li key={lead.id}>
                <Link to={crmPath(`leads/${lead.id}`)}>{lead.reference} · {lead.contactName}</Link>
                {lead.source === "Sample" && <span className="badge"> Sample</span>}
                <div className="muted">{lead.stage} · {lead.service}</div>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <h2>Unread notifications</h2>
          <ul>
            {data.notifications.length === 0 && <li>None.</li>}
            {data.notifications.map((item) => (
              <li key={item.id}><Link to={crmPath(`leads/${item.lead_id}`)}>{item.title}</Link><div className="muted">{item.body}</div></li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function ChartHead({ title, note }) {
  return (
    <div className="chart-head">
      <h2>{title}</h2>
      {note && <p>{note}</p>}
    </div>
  );
}

function countBy(leads, key, labels) {
  const counts = Object.fromEntries(labels.map((label) => [label, 0]));
  let other = 0;
  for (const lead of leads) {
    const value = lead[key] || "";
    if (value in counts) counts[value] += 1;
    else if (value) other += 1;
  }
  const rows = labels.map((label) => ({ label, count: counts[label] }));
  if (other) rows.push({ label: "Other", count: other });
  return rows;
}

function weekCounts(leads) {
  const rows = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let index = 7; index >= 0; index -= 1) {
    const start = new Date(today);
    start.setDate(today.getDate() - index * 7);
    rows.push({
      start,
      label: start.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
      count: 0,
    });
  }
  for (const lead of leads) {
    const created = new Date(lead.createdAt);
    if (Number.isNaN(created.getTime()) || created < rows[0].start) continue;
    for (let index = rows.length - 1; index >= 0; index -= 1) {
      if (created >= rows[index].start) {
        rows[index].count += 1;
        break;
      }
    }
  }
  return rows;
}

const CHART_COLORS = ["#7460ee", "#2962FF", "#4fc3f7", "#36bea6", "#fb8c00", "#f62d51", "#414755", "#26c6da"];

function shortLabel(label) {
  return label
    .replace(" cleaning", "")
    .replace("More than one of these", "More than one")
    .replace("After production / night", "After production")
    .replace("One-off or periodic", "One-off");
}

function Bars({ rows, label }) {
  const active = rows.filter((row) => row.count > 0);
  if (!active.length) return <ChartEmpty text="No leads yet" />;
  const max = Math.max(...active.map((row) => row.count));
  return (
    <div className="bars" role="img" aria-label={label}>
      {active.map((row) => (
        <div className="bar-row" key={row.label}>
          <span>{shortLabel(row.label)}</span>
          <div className="bar-track">
            <i style={{ width: `${Math.max((row.count / max) * 100, 8)}%` }} />
          </div>
          <strong>{row.count}</strong>
        </div>
      ))}
    </div>
  );
}

function Columns({ rows, label }) {
  const width = 840;
  const height = 250;
  const pad = { l: 36, r: 10, t: 22, b: 52 };
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const max = Math.max(total === 0 ? 4 : 1, ...rows.map((row) => row.count));
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const slot = innerW / rows.length;
  const barW = Math.min(36, slot * 0.46);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="col-chart" role="img" aria-label={label}>
      {axisTicks(max).map((value) => {
        const y = pad.t + innerH - (value / max) * innerH;
        return (
          <g key={value}>
            <line className="line-grid" x1={pad.l} x2={width - pad.r} y1={y} y2={y} />
            <text className="line-label" x={pad.l - 8} y={y + 4} textAnchor="end">{value}</text>
          </g>
        );
      })}
      {rows.map((row, index) => {
        const heightPx = (row.count / max) * innerH;
        const x = pad.l + index * slot + (slot - barW) / 2;
        const y = pad.t + innerH - heightPx;
        return (
          <g key={row.label}>
            {row.count > 0 && (
              <>
                <rect x={x} y={y} width={barW} height={Math.max(heightPx, 4)} rx="2" fill={row.muted ? "#b7c0cc" : "#7460ee"} />
                <text className="col-count" x={x + barW / 2} y={y - 8} textAnchor="middle">{row.count}</text>
              </>
            )}
            <text className="line-label" x={x + barW / 2} y={height - 22} textAnchor="middle">{stageName(row.label)}</text>
          </g>
        );
      })}
      {total === 0 && (
        <text className="line-label" x={pad.l + innerW / 2} y={pad.t + innerH / 2} textAnchor="middle">No leads in the pipeline yet</text>
      )}
    </svg>
  );
}

function stageName(label) {
  return {
    "Site Assessment": "Assessment",
    "Proposal / Quote": "Proposal",
    "Not Suitable": "Unsuitable",
  }[label] || label;
}

function shortDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function ChartEmpty({ text }) {
  return (
    <div className="chart-empty">
      <span>{text}</span>
    </div>
  );
}

function Ring({ rows, center, caption }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const shown = rows.filter((row) => row.count > 0);
  if (!total) return <ChartEmpty text="No leads yet" />;
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const gap = shown.length > 1 ? 4 : 0;
  const usable = Math.max(circumference - gap * shown.length, 0);
  let offset = 0;
  return (
    <div className="ring-wrap" role="img" aria-label={shown.map((row) => `${row.label} ${row.count}`).join(", ")}>
      <svg viewBox="0 0 140 140" className="ring-svg">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#eef5f9" strokeWidth="16" />
        {shown.map((row, index) => {
          const length = (row.count / total) * usable;
          const circle = (
            <circle
              key={row.label}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth="16"
              strokeLinecap="butt"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 70 70)"
            />
          );
          offset += length + gap;
          return circle;
        })}
        <text x="70" y="66" textAnchor="middle" className="ring-num">{center}</text>
        <text x="70" y="84" textAnchor="middle" className="ring-cap">{caption}</text>
      </svg>
      <ul className="legend">
        {shown.map((row, index) => (
          <li key={row.label}>
            <i style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
            <span>{shortLabel(row.label)}</span>
            <strong>{row.count}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WeekChart({ leads }) {
  const rows = useMemo(() => weekCounts(leads), [leads]);
  if (rows.every((row) => row.count === 0)) {
    return <ChartEmpty text="No new leads in the last eight weeks" />;
  }
  const width = 760;
  const height = 252;
  const padL = 44;
  const padR = 36;
  const padT = 36;
  const padB = 40;
  const max = Math.max(1, ...rows.map((row) => row.count));
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const step = rows.length > 1 ? innerW / (rows.length - 1) : 0;
  const baseY = padT + innerH;
  const yFor = (count) => baseY - (count / max) * innerH;
  const points = rows.map((row, index) => ({
    ...row,
    x: padL + index * step,
    y: yFor(row.count),
  }));
  const line = smoothLine(points);
  const area = `${line} L${points[points.length - 1].x},${baseY} L${points[0].x},${baseY} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="line-chart" role="img" aria-label="New leads over the last eight weeks">
      <defs>
        <linearGradient id="week-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7460ee" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#7460ee" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {axisTicks(max).map((value) => {
        const y = yFor(value);
        return (
          <g key={value}>
            <line x1={padL} x2={width - padR} y1={y} y2={y} className={value === 0 ? "line-axis" : "line-grid"} />
            <text className="line-label" x={padL - 12} y={y + 4} textAnchor="end">{value}</text>
          </g>
        );
      })}
      <path d={area} className="line-area" />
      <path d={line} className="line-stroke" />
      {points.map((point, index) => {
        const label = valueLabel(point, index, points, baseY);
        return (
          <g key={point.label}>
            <text className="line-value" x={label.x} y={label.y} textAnchor={label.anchor}>{point.count}</text>
            <circle cx={point.x} cy={point.y} r="4.5" />
            <text className="line-label" x={point.x} y={height - 12} textAnchor="middle">{point.label}</text>
            <title>{`${point.label}: ${point.count} new ${point.count === 1 ? "lead" : "leads"}`}</title>
          </g>
        );
      })}
    </svg>
  );
}

function valueLabel(point, index, points, baseY) {
  const prev = points[index - 1];
  const next = points[index + 1];
  const valley = prev && next && prev.y + 8 < point.y && next.y + 8 < point.y && baseY - point.y > 32;
  if (valley) return { x: point.x, y: point.y + 18, anchor: "middle" };
  if (index === 0) return { x: point.x + 9, y: point.y - 14, anchor: "start" };
  const arrivingFromAbove = prev && prev.y < point.y - 12;
  const leavingDownward = !next || next.y > point.y - 4;
  if (arrivingFromAbove && leavingDownward) return { x: point.x + 10, y: point.y - 10, anchor: "start" };
  return { x: point.x, y: point.y - 16, anchor: "middle" };
}

function axisTicks(max) {
  const steps = max <= 4 ? max : 4;
  const values = [];
  for (let index = 0; index <= steps; index += 1) {
    const value = Math.round((max * index) / steps);
    if (!values.includes(value)) values.push(value);
  }
  return values;
}

function smoothLine(points) {
  if (!points.length) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  const n = points.length;
  const slope = [];
  for (let index = 0; index < n - 1; index += 1) {
    const run = points[index + 1].x - points[index].x;
    slope.push(run === 0 ? 0 : (points[index + 1].y - points[index].y) / run);
  }
  const tangent = slope.map((value, index) => {
    if (index === 0) return value;
    const previous = slope[index - 1];
    return previous * value <= 0 ? 0 : (previous + value) / 2;
  });
  tangent.push(slope[n - 2]);
  for (let index = 0; index < n - 1; index += 1) {
    if (Math.abs(slope[index]) < 1e-6) {
      tangent[index] = 0;
      tangent[index + 1] = 0;
      continue;
    }
    const a = tangent[index] / slope[index];
    const b = tangent[index + 1] / slope[index];
    const size = Math.hypot(a, b);
    if (size > 3) {
      const scale = 3 / size;
      tangent[index] = scale * a * slope[index];
      tangent[index + 1] = scale * b * slope[index];
    }
  }
  let path = `M${roundChart(points[0].x)},${roundChart(points[0].y)}`;
  for (let index = 0; index < n - 1; index += 1) {
    const run = (points[index + 1].x - points[index].x) * 0.18;
    const c1x = points[index].x + run;
    const c1y = points[index].y + tangent[index] * run;
    const c2x = points[index + 1].x - run;
    const c2y = points[index + 1].y - tangent[index + 1] * run;
    path += ` C${roundChart(c1x)},${roundChart(c1y)} ${roundChart(c2x)},${roundChart(c2y)} ${roundChart(points[index + 1].x)},${roundChart(points[index + 1].y)}`;
  }
  return path;
}

function roundChart(value) {
  return Math.round(value * 10) / 10;
}

function useLeads(params) {
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const key = JSON.stringify(params);
  useEffect(() => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([name, value]) => {
      if (value) query.set(name, value);
    });
    api(`/api/leads?${query.toString()}`, { auth: true })
      .then((data) => setLeads(data.leads))
      .catch((err) => setError(err.message));
  }, [key, tick]);
  return { leads, setLeads, error, reload: () => setTick((value) => value + 1) };
}

function Pipeline() {
  const { leads, setLeads, error } = useLeads({});
  const [note, setNote] = useState("");
  const [over, setOver] = useState("");
  const [tab, setTab] = useState("open");
  useEffect(() => { document.title = "Pipeline · CRM"; }, []);

  async function move(id, stage) {
    const previous = leads;
    setLeads(leads.map((lead) => (lead.id === id ? { ...lead, stage } : lead)));
    try {
      await api(`/api/leads/${id}`, { method: "PATCH", auth: true, body: { stage } });
    } catch (err) {
      setLeads(previous);
      setNote(err.message);
    }
  }

  function onDrop(event, stage) {
    event.preventDefault();
    const id = Number(event.dataTransfer.getData("text/plain"));
    if (id) move(id, stage);
  }

  const openStages = STAGES.filter((stage) => !CLOSED_STAGES.includes(stage));
  const openCount = leads.filter((lead) => !CLOSED_STAGES.includes(lead.stage)).length;
  const closedCount = leads.length - openCount;
  const stages = tab === "closed" ? CLOSED_STAGES : openStages;
  const columnProps = { leads, over, setOver, onDrop, move };

  return (
    <div className="pipeline-desk">
      <h1 className="sr-only">Pipeline</h1>
      <div className="pipeline-toolbar">
        <div className="board-tabs" role="tablist" aria-label="Pipeline">
          <button type="button" role="tab" aria-selected={tab === "open"} className={tab === "open" ? "active" : ""} onClick={() => setTab("open")}>
            Open <span>{openCount}</span>
          </button>
          <button type="button" role="tab" aria-selected={tab === "closed"} className={tab === "closed" ? "active" : ""} onClick={() => setTab("closed")}>
            Closed <span>{closedCount}</span>
          </button>
        </div>
        <Link className="solid-btn" to={`${crmPath("leads")}?new=1`}>New lead</Link>
      </div>
      <p className="board-note">
        {leads.length === 0
          ? "No leads yet. A new enquiry starts in New."
          : `${leads.length} ${leads.length === 1 ? "lead" : "leads"}. Drag a card into another stage.`}
      </p>
      {error && <p className="note">{error}</p>}
      {note && <p className="note">{note}</p>}
      <div className={`board ${tab === "closed" ? "closed" : "open"}`} role="tabpanel">
        {stages.map((stage) => <StageColumn key={stage} stage={stage} {...columnProps} />)}
      </div>
    </div>
  );
}

function StageColumn({ stage, leads, over, setOver, onDrop, move }) {
  const cards = leads.filter((lead) => lead.stage === stage);
  return (
    <section
      className={`column${over === stage ? " is-over" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setOver(stage);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOver("");
      }}
      onDrop={(event) => {
        setOver("");
        onDrop(event, stage);
      }}
    >
      <header>
        <h2 title={stage}>{stageName(stage)}</h2>
        <span className="count">{cards.length}</span>
      </header>
      <div className="column-scroll">
      {cards.length === 0 && <p className="column-empty">Empty</p>}
      {cards.map((lead) => (
        <article
          key={lead.id}
          className="lead-card"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", String(lead.id));
          }}
        >
          <span className="ref">{lead.reference}</span>
          <Link draggable={false} to={crmPath(`leads/${lead.id}`)}><strong>{lead.companyName || lead.contactName}</strong></Link>
          {lead.companyName && lead.contactName && <span>{lead.contactName}</span>}
          {lead.service && <span title={lead.service}>{shortLabel(lead.service)}</span>}
          {lead.followUpDate && <span>Due {shortDate(lead.followUpDate)}</span>}
          {lead.source === "Sample" && <span className="badge">Sample</span>}
          <select aria-label={`Move ${lead.reference}`} value={lead.stage} onChange={(event) => move(lead.id, event.target.value)}>
            {STAGES.map((item) => <option key={item} value={item}>{stageName(item)}</option>)}
          </select>
        </article>
      ))}
      </div>
    </section>
  );
}

function Leads() {
  const serviceNames = useServiceNames();
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("");
  const [service, setService] = useState("");
  const params = useMemo(() => ({ q, stage, service }), [q, stage, service]);
  const { leads, error, reload } = useLeads(params);
  const [message, setMessage] = useState("");
  const creating = searchParams.get("new") === "1";
  useEffect(() => { document.title = creating ? "New lead · CRM" : "Leads · CRM"; }, [creating]);

  function openNew() {
    const next = new URLSearchParams(searchParams);
    next.set("new", "1");
    setSearchParams(next);
  }

  const closeNew = useCallback(() => {
    setSearchParams((current) => {
      if (current.get("new") !== "1") return current;
      const next = new URLSearchParams(current);
      next.delete("new");
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  return (
    <>
      <div className="crm-top">
        <div>
          <p className="eyebrow">Leads</p>
          <h1>Leads</h1>
        </div>
        <div className="editor-links">
          <button className="ghost-btn dark" type="button" onClick={() => downloadCsv()}>Export CSV</button>
          <button className="solid-btn" type="button" onClick={openNew}>New lead</button>
        </div>
      </div>
      <div className="filters">
        <input placeholder="Search name, company, email, phone" value={q} onChange={(event) => setQ(event.target.value)} />
        <select value={stage} onChange={(event) => setStage(event.target.value)}>
          <option value="">All stages</option>
          {STAGES.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={service} onChange={(event) => setService(event.target.value)}>
          <option value="">All services</option>
          {serviceNames.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      {message && <p>{message}</p>}
      {error && <p className="note">{error}</p>}
      <div className="table-wrap">
        <table className="leads">
          <thead>
            <tr>
              <th>Ref</th><th>Contact</th><th>Company</th><th>Service</th><th>Stage</th><th>Follow-up</th><th>Source</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr className="empty-row"><td colSpan={7}>No leads yet.</td></tr>
            )}
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td><Link to={crmPath(`leads/${lead.id}`)}>{lead.reference}</Link></td>
                <td>{lead.contactName}</td>
                <td>{lead.companyName || "—"}</td>
                <td>{lead.service || "—"}</td>
                <td><span className={`stage-pill${lead.stage === "Won" ? " won" : ""}${CLOSED_STAGES.includes(lead.stage) && lead.stage !== "Won" ? " closed" : ""}`}>{stageName(lead.stage)}</span></td>
                <td>{lead.followUpDate || "—"}</td>
                <td>{lead.source || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <LeadDialog
        open={creating}
        onClose={closeNew}
        onSaved={(lead) => {
          setMessage(`Added ${lead.reference}.`);
          reload();
        }}
      />
    </>
  );
}

const EMPTY = {
  contactName: "",
  companyName: "",
  email: "",
  phone: "",
  facilityDetails: "",
  service: "",
  serviceWindow: "",
  source: "Phone",
  notes: "",
  value: "",
  nextAction: "",
  followUpDate: "",
  stage: "New",
  assignedTo: "",
};

function LeadDialog({ open, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return undefined;
    setForm(EMPTY);
    setError("");
    setErrors({});
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function onSubmit(event) {
    event.preventDefault();
    const found = leadErrors(form);
    setErrors(found);
    setError("");
    if (Object.keys(found).length) {
      requestAnimationFrame(() => {
        document.querySelector(".drawer .is-invalid")?.scrollIntoView({ block: "center" });
      });
      return;
    }
    try {
      const lead = await api("/api/leads", {
        method: "POST",
        auth: true,
        body: { ...form, value: form.value === "" ? null : Number(form.value), assignedTo: form.assignedTo || null },
      });
      onSaved(lead);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!open) return null;

  return (
    <Drawer
      open={open}
      wide
      title="New lead"
      onClose={onClose}
      footer={(
        <>
          {(error || Object.keys(errors).length > 0) && (
            <p className="note">{error || "Fill the highlighted fields."}</p>
          )}
          <button className="solid-btn" type="submit" form="new-lead-form">Save lead</button>
        </>
      )}
    >
      <form id="new-lead-form" className="crm-form" noValidate onSubmit={onSubmit}>
        <LeadFields form={form} set={set} errors={errors} markRequired />
      </form>
    </Drawer>
  );
}

function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = AuthContext.current;
  const [pack, setPack] = useState(null);
  const [form, setForm] = useState(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);

  async function load() {
    const [detail, people] = await Promise.all([
      api(`/api/leads/${id}`, { auth: true }),
      api("/api/users", { auth: true }),
    ]);
    setPack(detail);
    setUsers(people.users);
    setForm({
      ...detail.lead,
      value: detail.lead.value ?? "",
      assignedTo: detail.lead.assignedTo || "",
    });
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className="note">{error}</p>;
  if (!form || !pack) return <p>Loading lead…</p>;

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => drop(current, key));
  }

  async function save(event) {
    event.preventDefault();
    const found = leadErrors(form);
    setErrors(found);
    setError("");
    if (hasProblems(found)) return;
    try {
      await api(`/api/leads/${id}`, {
        method: "PATCH",
        auth: true,
        body: {
          contactName: form.contactName,
          companyName: form.companyName,
          email: form.email,
          phone: form.phone,
          facilityDetails: form.facilityDetails,
          service: form.service,
          serviceWindow: form.serviceWindow,
          source: form.source,
          notes: form.notes,
          nextAction: form.nextAction,
          followUpDate: form.followUpDate || null,
          stage: form.stage,
          assignedTo: form.assignedTo || null,
          value: form.value === "" ? null : Number(form.value),
        },
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addNote(event) {
    event.preventDefault();
    if (blank(note)) {
      setNoteError("Write a note before saving.");
      return;
    }
    setNoteError("");
    await api(`/api/leads/${id}/notes`, { method: "POST", auth: true, body: { body: note } });
    setNote("");
    await load();
  }

  async function remove() {
    await api(`/api/leads/${id}`, { method: "DELETE", auth: true });
    navigate(crmPath("leads"));
  }

  return (
    <>
      <div className="crm-top">
        <div>
          <p className="eyebrow">Lead</p>
          <h1>{form.reference}</h1>
        </div>
        <div className="editor-links">
          {pack.client && <Link className="ghost-btn dark" to={crmPath(`clients/${pack.client.id}`)}>{pack.client.name}</Link>}
          {form.source === "Sample" && <span className="badge">Sample record</span>}
        </div>
      </div>
      <div className="detail">
        <form className="crm-form panel" onSubmit={save}>
          <LeadFields form={form} set={set} users={users} errors={errors} markRequired />
          {error && <p className="note">{error}</p>}
          <div className="form-actions">
            <button className="solid-btn" type="submit">Save changes</button>
            {auth.user.role === "admin" && <button className="ghost-btn dark" type="button" onClick={remove}>Delete lead</button>}
          </div>
        </form>
        <div>
          <section className="panel">
            <h2>Activity</h2>
            <form onSubmit={addNote} className="crm-form" noValidate>
              <label className={noteError ? "is-invalid" : undefined}>
                <span>Add a note<em aria-hidden="true">*</em></span>
                <textarea value={note} onChange={(event) => { setNote(event.target.value); setNoteError(""); }} rows={3} />
                {noteError && <small>{noteError}</small>}
              </label>
              <button className="solid-btn" type="submit">Add note</button>
            </form>
            <div className="timeline">
              {pack.activities.map((item) => (
                <article key={item.id}>
                  <strong>{item.type}</strong>
                  <p>{item.body}</p>
                  <span className="muted">{item.user_name || "Website"} · {item.created_at.slice(0, 16).replace("T", " ")}</span>
                </article>
              ))}
            </div>
          </section>
          <section className="panel" style={{ marginTop: 12 }}>
            <h2>Email outbox</h2>
            {pack.messages.length === 0 && <p className="muted">No acknowledgement queued. Add an email address to prepare one.</p>}
            {pack.messages.map((message) => (
              <article key={message.id}>
                <strong>{message.subject}</strong>
                <p className="muted">To {message.to_email} · {message.status}. Sending waits on an email account.</p>
                <p>{message.body}</p>
              </article>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}

function leadErrors(form) {
  const errors = {};
  const text = (key, message) => {
    if (!String(form[key] || "").trim()) errors[key] = message;
  };
  text("contactName", "Enter the contact name.");
  text("companyName", "Enter the company.");
  if (!String(form.email || "").trim()) errors.email = "Enter an email address.";
  else if (!emailOk(form.email)) errors.email = "That email address does not look right.";
  text("phone", "Enter a phone number.");
  text("facilityDetails", "Describe the facility.");
  text("service", "Choose a service.");
  text("serviceWindow", "Choose when the crew can attend.");
  if (form.value === "" || form.value === null) errors.value = "Enter an estimated value.";
  else if (!Number.isFinite(Number(form.value)) || Number(form.value) < 0) errors.value = "Enter a value of zero or more.";
  text("followUpDate", "Choose a follow-up date.");
  text("nextAction", "Enter the next action.");
  text("notes", "Add a note about the opportunity.");
  return errors;
}

function LeadFields({ form, set, users = [], errors = {}, markRequired = false }) {
  const serviceNames = useServiceNames();
  function Field({ name, label, wide, required = true, children }) {
    return (
      <label className={`${wide ? "wide" : ""}${errors[name] ? " is-invalid" : ""}`}>
        <span>{label}{markRequired && required && <em aria-hidden="true">*</em>}</span>
        {children}
        {errors[name] && <small>{errors[name]}</small>}
      </label>
    );
  }
  return (
    <div className="lead-fields">
      <section>
        <h2>Contact</h2>
        <div className="field-grid">
          <Field name="contactName" label="Contact name"><input value={form.contactName} onChange={(event) => set("contactName", event.target.value)} /></Field>
          <Field name="companyName" label="Company"><input value={form.companyName} onChange={(event) => set("companyName", event.target.value)} /></Field>
          <Field name="email" label="Email"><input type="email" value={form.email} onChange={(event) => set("email", event.target.value)} /></Field>
          <Field name="phone" label="Phone"><input value={form.phone} onChange={(event) => set("phone", event.target.value)} /></Field>
          <Field name="facilityDetails" label="Facility" wide><textarea rows={3} value={form.facilityDetails} onChange={(event) => set("facilityDetails", event.target.value)} /></Field>
        </div>
      </section>
      <section>
        <h2>The job</h2>
        <div className="field-grid">
          <Field name="service" label="Service">
            <select value={form.service} onChange={(event) => set("service", event.target.value)}>
              <option value="">Select</option>
              {serviceNames.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field name="serviceWindow" label="Service window">
            <select value={form.serviceWindow} onChange={(event) => set("serviceWindow", event.target.value)}>
              <option value="">Select</option>
              {WINDOWS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field name="source" label="Source" required={false}>
            <select value={form.source} onChange={(event) => set("source", event.target.value)}>
              {SOURCES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field name="stage" label="Stage" required={false}>
            <select value={form.stage} onChange={(event) => set("stage", event.target.value)}>
              {STAGES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          {users.length > 0 && (
            <label>
              <span>Assigned to</span>
              <select value={form.assignedTo || ""} onChange={(event) => set("assignedTo", event.target.value)}>
                <option value="">Unassigned</option>
                {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </select>
            </label>
          )}
          <Field name="value" label="Estimated value (AUD)"><input type="number" min="0" step="0.01" value={form.value} onChange={(event) => set("value", event.target.value)} /></Field>
          <Field name="followUpDate" label="Follow-up date"><input type="date" value={form.followUpDate || ""} onChange={(event) => set("followUpDate", event.target.value)} /></Field>
          <Field name="nextAction" label="Next action" wide><input value={form.nextAction} onChange={(event) => set("nextAction", event.target.value)} /></Field>
          <Field name="notes" label="Opportunity notes" wide><textarea rows={4} value={form.notes} onChange={(event) => set("notes", event.target.value)} /></Field>
        </div>
      </section>
      {CLOSED_STAGES.includes(form.stage) && <p className="muted">This lead is closed.</p>}
    </div>
  );
}

function ContentDesk() {
  const [posts, setPosts] = useState([]);
  const [canEdit, setCanEdit] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", text: "" });

  useEffect(() => {
    document.title = "Launch drafts · CRM";
    api("/api/content/admin", { auth: true })
      .then((data) => {
        setCanEdit(data.canEdit);
        setPosts(Array.isArray(data.settings.launchPosts) ? data.settings.launchPosts : []);
      })
      .catch((err) => setError(err.message));
  }, []);

  function update(index, key, value) {
    setPosts((current) => current.map((post, item) => item === index ? { ...post, [key]: value } : post));
  }

  async function save(next, message) {
    const missing = next.some((post) => blank(post.title));
    if (missing) {
      setError("Every draft needs a title.");
      return;
    }
    setError("");
    try {
      await api("/api/settings", { method: "PUT", auth: true, body: { launchPosts: next } });
      setPosts(next);
      setNotice(message);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }

  return (
    <div className="content-desk">
      <div className="crm-top">
        <div>
          <p className="eyebrow">Website</p>
          <h1>Launch drafts</h1>
        </div>
      </div>
      <p className="muted">Drafts for the LinkedIn company page. Add or edit them here. They are not published to the website.</p>
      {notice && <p className="saved">{notice}</p>}
      {error && <p className="note">{error}</p>}
      {posts.map((post, index) => (
        <article key={`${index}-${posts.length}`}>
          <label>Title<input value={post.title} onChange={(event) => update(index, "title", event.target.value)} /></label>
          <label>Draft<textarea rows={4} value={post.text} onChange={(event) => update(index, "text", event.target.value)} /></label>
          {canEdit && (
            <div className="row-actions">
              <button className="solid-btn" type="button" onClick={() => save(posts, "Drafts saved.")}>Save</button>
              <button className="ghost-btn dark" type="button" onClick={() => save(posts.filter((_, item) => item !== index), "Draft removed.")}>Remove</button>
            </div>
          )}
        </article>
      ))}
      {canEdit && (
        <button className="solid-btn" type="button" onClick={() => { setDraft({ title: "", text: "" }); setOpen(true); }}>Add a draft</button>
      )}
      <Drawer
        open={open}
        title="Add a draft"
        onClose={() => setOpen(false)}
        footer={<button className="solid-btn" type="button" onClick={async () => {
          if (blank(draft.title)) {
            setError("Every draft needs a title.");
            return;
          }
          const saved = await save([...posts, { title: draft.title.trim(), text: draft.text }], "Draft added.");
          if (saved) setOpen(false);
        }}>Add draft</button>}
      >
        <div className="crm-form">
          <label>
            <span>Title<em aria-hidden="true">*</em></span>
            <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <label>
            <span>Draft</span>
            <textarea rows={6} value={draft.text} onChange={(event) => setDraft((current) => ({ ...current, text: event.target.value }))} />
          </label>
        </div>
      </Drawer>
    </div>
  );
}

function useServiceNames() {
  const [names, setNames] = useState(SERVICES);
  useEffect(() => {
    api("/api/content")
      .then((data) => {
        const fromSite = (data.services || []).map((service) => service.name).filter(Boolean);
        if (fromSite.length) setNames(fromSite);
      })
      .catch(() => {});
  }, []);
  return names;
}
