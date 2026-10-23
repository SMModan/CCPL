import { useEffect, useLayoutEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { api } from "../api";
import { crmHref, extraPages, telHref } from "../site";

export function Arrow() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Shell() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [toTop, setToTop] = useState(false);
  const [content, setContent] = useState(null);
  const [contentError, setContentError] = useState("");

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    setOpen(false);
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

  return (
    <div className="site">
      <a className="skip" href="#content">Skip to content</a>
      <header className="bar">
        <div className="bar-meta">
          <div className="wrap">
            <span>{company?.location}</span>
            <span>
              {company?.phone && <a href={telHref(company.phone)}>{company.phone}</a>}
              {company?.email && <a className="bar-mail" href={`mailto:${company.email}`}>{company.email}</a>}
            </span>
          </div>
        </div>
        <div className="wrap bar-inner">
          <Link to="/" className="brand" aria-label="Comprehensive Cleaning home">
            <img src={logo} alt="Comprehensive Cleaning" />
          </Link>
          <button className="nav-toggle" type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? "Close" : "Menu"}
          </button>
          <nav className={open ? "open" : ""}>
            <NavLink end to="/">{labels?.navHome || "Home"}</NavLink>
            <NavLink to="/services">{labels?.navServices || "Services"}</NavLink>
            <NavLink to="/gallery">{labels?.navGallery || "Gallery"}</NavLink>
            <NavLink to="/about">{labels?.navAbout || "About"}</NavLink>
            <NavLink to="/approach">{labels?.navApproach || "Approach"}</NavLink>
            <NavLink to="/training">{labels?.navTraining || "Training"}</NavLink>
            <NavLink to="/resources">{labels?.navResources || "Resources"}</NavLink>
            <NavLink className="nav-cta nav-cta-mobile" to="/contact">{labels?.navCta || "Get in touch"}</NavLink>
          </nav>
          <NavLink className="nav-cta bar-cta" to="/contact">{labels?.navCta || "Get in touch"}</NavLink>
        </div>
      </header>
      <main id="content">
        {contentError && <p className="boot">{contentError}</p>}
        {!content && !contentError && <p className="boot">Loading the site…</p>}
        {content && <Outlet context={{ content, base: "" }} />}
      </main>
      <footer className="foot">
        <div className="wrap foot-grid">
          <div>
            <img src={logo} alt="" />
            <p>{company?.footer || company?.legalName}</p>
          </div>
          <div>
            <strong>{labels?.footerServices || "Services"}</strong>
            {services.map((service) => <Link key={service.slug} to={`/services/${service.slug}`}>{service.name}</Link>)}
          </div>
          <div>
            <strong>{labels?.footerCompany || "Company"}</strong>
            <Link to="/about">{labels?.footerAbout || "About"}</Link>
            <Link to="/approach">{labels?.navApproach || "Approach"}</Link>
            <Link to="/training">{labels?.footerTraining || "Training"}</Link>
            <Link to="/gallery">{labels?.footerGallery || "Gallery"}</Link>
            <Link to="/capability">{labels?.footerCapability || "Capability"}</Link>
            {extraPages(content).map((page) => <Link key={page.slug} to={`/${page.slug}`}>{page.title}</Link>)}
          </div>
          <div>
            <strong>{labels?.footerContact || "Contact"}</strong>
            {company?.phone && <a href={telHref(company.phone)}>{company.phone}</a>}
            {company?.email && <a href={`mailto:${company.email}`}>{company.email}</a>}
            {company?.address && <p>{company.address}</p>}
            <Link to="/privacy">{labels?.footerPrivacy || "Privacy"}</Link>
            <Link to="/terms">{labels?.footerTerms || "Terms"}</Link>
            <a href={crmHref()}>{labels?.footerStaff || "Staff sign in"}</a>
          </div>
        </div>
        <div className="wrap foot-base">© {new Date().getFullYear()} {company?.legalName || "Comprehensive Cleaning Pty Ltd"}</div>
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
