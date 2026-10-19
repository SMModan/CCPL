import { useEffect, useLayoutEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { api } from "../api";
import { crmHref, extraPages, telHref } from "../site";
import "./raw.css";

function themePath(path) {
  if (!path || path === "/") return "/option2";
  return `/option2${path.startsWith("/") ? path : `/${path}`}`;
}

export function Arrow() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Pin() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function Phone() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path d="M7 3h3l1.5 4-2 1.5a12 12 0 0 0 6 6L17 13l4 1.5V18a2 2 0 0 1-2.2 2A16 16 0 0 1 4 7.2 2 2 0 0 1 6 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function Mail() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export default function Shell() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState("");
  const [toTop, setToTop] = useState(false);
  const [content, setContent] = useState(null);
  const [contentError, setContentError] = useState("");

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    setOpen(false);
    setMenu("");
  }, [pathname]);

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = document.querySelectorAll("[data-reveal]");
    if (reduce) {
      nodes.forEach((node) => node.classList.add("is-in"));
      return undefined;
    }
    const seen = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          seen.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01 });
    nodes.forEach((node) => seen.observe(node));
    return () => seen.disconnect();
  }, [content, pathname]);

  useEffect(() => {
    document.body.classList.toggle("nav-lock", open);
    return () => document.body.classList.remove("nav-lock");
  }, [open]);

  useEffect(() => {
    function onScroll() {
      setToTop(window.scrollY > 480);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let gone = false;
    function load() {
      api("/api/content")
        .then((data) => { if (!gone) { setContent(data); setContentError(""); } })
        .catch((error) => { if (!gone) setContentError(error.message); });
    }
    load();
    function onStorage(event) { if (event.key === "cc-site-updated") load(); }
    function onVisible() { if (document.visibilityState === "visible") load(); }
    window.addEventListener("storage", onStorage);
    window.addEventListener("cc-site-updated", load);
    window.addEventListener("focus", load);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      gone = true;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cc-site-updated", load);
      window.removeEventListener("focus", load);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  const company = content?.company;
  const labels = content?.labels;
  const logo = company?.logo || "/logo.png";
  const services = content?.services || [];
  const extras = content ? extraPages(content) : [];

  function toggleMenu(name) {
    setMenu((current) => (current === name ? "" : name));
  }

  return (
    <div className="site theme-option2">
      <a className="skip" href="#content">Skip to content</a>
      <header className="bar">
        <div className="bar-meta">
          <div className="wrap meta-row">
            <span className="meta-bits">
              {company?.location && <span><Pin />{company.location}</span>}
              {company?.phone && <a href={telHref(company.phone)}><Phone />{company.phone}</a>}
              {company?.email && <a href={`mailto:${company.email}`}><Mail />{company.email}</a>}
            </span>
            {company?.address && <span className="meta-address">{company.address}</span>}
          </div>
        </div>
        <div className="wrap bar-inner">
          <Link to={themePath("/")} className="brand" aria-label="Comprehensive Cleaning home">
            <img src={logo} alt="Comprehensive Cleaning" />
          </Link>
          <button className="nav-toggle" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            <span />
            <span />
            <span />
            <span className="sr">{open ? "Close" : "Menu"}</span>
          </button>
          <nav className={open ? "open" : ""}>
            <NavLink end to={themePath("/")}>{labels?.navHome || "Home"}</NavLink>
            <div className={`menu${menu === "about" ? " is-open" : ""}`}>
              <NavLink to={themePath("/about")}>{labels?.navAbout || "About"}</NavLink>
              <button type="button" className="menu-more" aria-expanded={menu === "about"} aria-label="About pages" onClick={() => toggleMenu("about")}>
                <span aria-hidden="true" />
              </button>
              <div className="menu-panel">
                <NavLink to={themePath("/about")}>{labels?.footerAbout || "About"}</NavLink>
                <NavLink to={themePath("/approach")}>{labels?.navApproach || "Approach"}</NavLink>
                <NavLink to={themePath("/training")}>{labels?.navTraining || "Training"}</NavLink>
                <NavLink to={themePath("/capability")}>{labels?.footerCapability || "Capability"}</NavLink>
                <NavLink to={themePath("/partners")}>{labels?.partnersTitle || "Partners"}</NavLink>
                {extras.map((page) => <NavLink key={page.slug} to={themePath(`/${page.slug}`)}>{page.title}</NavLink>)}
              </div>
            </div>
            <div className={`menu${menu === "services" ? " is-open" : ""}`}>
              <NavLink to={themePath("/services")}>{labels?.navServices || "Services"}</NavLink>
              <button type="button" className="menu-more" aria-expanded={menu === "services"} aria-label="Service pages" onClick={() => toggleMenu("services")}>
                <span aria-hidden="true" />
              </button>
              <div className="menu-panel">
                <NavLink to={themePath("/services")}>All services</NavLink>
                {services.map((service) => <NavLink key={service.slug} to={themePath(`/services/${service.slug}`)}>{service.name}</NavLink>)}
              </div>
            </div>
            <NavLink to={themePath("/gallery")}>{labels?.navGallery || "Gallery"}</NavLink>
            <NavLink to={themePath("/resources")}>{labels?.navResources || "Resources"}</NavLink>
            <NavLink className="nav-cta" to={themePath("/contact")}>{labels?.navCta || "Get in touch"}</NavLink>
          </nav>
        </div>
      </header>
      <main id="content">
        {contentError && <p className="boot">{contentError}</p>}
        {!content && !contentError && <p className="boot">Loading the site…</p>}
        {content && <Outlet context={{ content, base: "/option2", design: "option2" }} />}
      </main>
      <footer className="foot">
        <div className="wrap foot-grid">
          <div>
            <img src={logo} alt="" />
            <p>{company?.footer || company?.legalName}</p>
          </div>
          <div>
            <strong>{labels?.footerServices || "Services"}</strong>
            {services.map((service) => <Link key={service.slug} to={themePath(`/services/${service.slug}`)}>{service.name}</Link>)}
          </div>
          <div>
            <strong>{labels?.footerCompany || "Company"}</strong>
            <Link to={themePath("/about")}>{labels?.footerAbout || "About"}</Link>
            <Link to={themePath("/approach")}>{labels?.navApproach || "Approach"}</Link>
            <Link to={themePath("/training")}>{labels?.footerTraining || "Training"}</Link>
            <Link to={themePath("/gallery")}>{labels?.footerGallery || "Gallery"}</Link>
            <Link to={themePath("/resources")}>{labels?.navResources || "Resources"}</Link>
            <Link to={themePath("/capability")}>{labels?.footerCapability || "Capability"}</Link>
            <Link to={themePath("/partners")}>{labels?.partnersTitle || "Partners"}</Link>
            {extras.map((page) => <Link key={page.slug} to={themePath(`/${page.slug}`)}>{page.title}</Link>)}
          </div>
          <div>
            <strong>{labels?.footerContact || "Contact"}</strong>
            {company?.phone && <a href={telHref(company.phone)}>{company.phone}</a>}
            {company?.email && <a href={`mailto:${company.email}`}>{company.email}</a>}
            {company?.address && <p>{company.address}</p>}
            {company?.location && <p>{company.location}</p>}
            <Link to={themePath("/contact")}>{labels?.navContact || "Contact"}</Link>
            <Link to={themePath("/privacy")}>{labels?.footerPrivacy || "Privacy"}</Link>
            <Link to={themePath("/terms")}>{labels?.footerTerms || "Terms"}</Link>
            <a href={crmHref()}>{labels?.footerStaff || "Staff sign in"}</a>
            <Link to="/">Layout option 1</Link>
          </div>
        </div>
        <div className="foot-base">
          <div className="wrap">© {new Date().getFullYear()} {company?.legalName || "Comprehensive Cleaning Pty Ltd"}</div>
        </div>
      </footer>
      <button
        type="button"
        className={`to-top${toTop ? " is-on" : ""}`}
        aria-label={labels?.backToTop || "Back to top"}
        onClick={() => {
          const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
        }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
