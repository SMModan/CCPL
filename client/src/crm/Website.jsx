import { useEffect, useRef, useState } from "react";
import { api, publishSiteChange, replaceSlideImage, uploadGallery, uploadImage, uploadSlide } from "../api";
import { checkSlideFile, SLIDE_HINT, SLIDE_LIMITS } from "../slideRules";
import { blank, drop, emailOk, hasProblems } from "../validate";
import Drawer from "./Drawer";

const TABS = ["Details", "Homepage", "About", "Services", "Gallery", "Certificates", "Industry", "Guides", "Messages"];
const COMPANY_KEYS = ["legalName", "principal", "principalTitle", "email", "phone", "address", "location", "footer", "logoImage"];
const HOME_KEYS = [
  "heroKicker", "heroTitle", "heroText", "heroImage", "heroAlt",
  "promises",
  "servicesKicker", "servicesTitle",
  "walkKicker", "walkTitle", "walkText", "walkImage", "walkAlt", "approachLink",
  "afterKicker", "afterTitle", "afterImage", "afterAlt", "ticks",
  "askKicker", "askTitle", "askText",
  "promiseKicker", "promiseTitle", "promiseLink", "promiseImages",
  "reelText", "reelLink", "reelLabel", "heroWork", "heroOpen",
  "certKicker", "certTitle", "certLede", "certLink",
  "workKicker", "workTitle", "workLink",
  "industryKicker", "industryTitle", "industryLede", "industryMarkets", "industryWorkTitle", "industryWork",
  "galleryCategories",
];
const WORD_KEYS = [
  "navHome", "navServices", "navApproach", "navAbout", "navGallery", "navResources", "navContact", "navCta", "navTraining",
  "heroPrimary", "heroSecondary", "formButton",
  "appliesTitle", "scopeTitle", "needTitle", "serviceAskTitle", "serviceAskText",
  "footerServices", "footerCompany", "footerNotes", "footerApproach", "footerCapability",   "footerPrivacy", "footerTerms", "footerStaff",
  "footerAbout", "footerTraining", "footerGallery", "footerContact",
  "galleryAll", "galleryFilters", "backToTop",
  "menuAboutText", "menuGalleryText", "menuResourcesText",
  "missingServiceKicker", "missingServiceTitle", "missingServiceLink",
  "missingGuideKicker", "missingGuideTitle", "missingGuideLink",
  "formSending",
];
const MESSAGE_KEYS = [
  "galleryEmpty",
  "formContact", "formCompany", "formEmail", "formPhone", "formService", "formSelect",
  "formWindow", "formWindowEmpty", "formFacility", "formFacilityHint", "formNotes", "formFine", "extraServices",
  "thankKicker", "thankTitle", "thankWithRef", "thankWithoutRef", "thankEmail", "thankPhone", "thankKeep", "thankHome",
  "capServices", "capApproach", "capAccountTitle", "capContact", "capPdf",
];
export default function Website() {
  const [tab, setTab] = useState("Details");
  const [pack, setPack] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [detailErrors, setDetailErrors] = useState({});
  const timer = useRef(null);
  const packRef = useRef(null);
  packRef.current = pack;

  async function load() {
    const data = await api("/api/content/admin", { auth: true });
    setPack(data);
  }

  useEffect(() => {
    document.title = "Website content · CRM";
    load().catch((err) => setError(err.message));
  }, []);

  if (error && !pack) return <p className="note">{error}</p>;
  if (!pack) return <p>Loading website content…</p>;

  function updatePack(updater) {
    setPack(updater);
    schedule();
  }

  function setSetting(key, value) {
    updatePack((current) => ({ ...current, settings: { ...current.settings, [key]: value } }));
  }

  function schedule() {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const current = packRef.current;
      if (!current?.canEdit) return;
      persist(current).catch((err) => setError(err.message));
    }, 400);
  }

  async function persist(current) {
    const settings = {};
    for (const key of [...COMPANY_KEYS, ...HOME_KEYS, ...WORD_KEYS, ...MESSAGE_KEYS]) {
      if (current.settings[key] !== undefined) settings[key] = current.settings[key];
    }
    if (!Array.isArray(settings.promises) || !settings.promises.length) {
      settings.promises = [current.settings.promise1, current.settings.promise2, current.settings.promise3].filter(Boolean);
    }
    await api("/api/settings", { method: "PUT", auth: true, body: settings });
    await api("/api/steps", { method: "PUT", auth: true, body: { steps: current.steps } });
    for (const service of current.services) {
      await api(`/api/services/${service.id}`, { method: "PUT", auth: true, body: service });
    }
    for (const article of current.articles) {
      await api(`/api/articles/${article.id}`, { method: "PUT", auth: true, body: article });
    }
    publishSiteChange();
    setError("");
    setNotice("Saved. The website is updated.");
  }

  async function save(work, message) {
    clearTimeout(timer.current);
    setError("");
    setNotice("");
    try {
      await work();
      publishSiteChange();
      await load();
      setNotice(message);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="site-editor">
      <div className="crm-top">
        <div>
          <p className="eyebrow">Website</p>
          <h1>Website content</h1>
        </div>
      </div>
      <p className="muted">
        Words and photographs save on their own. A new service, photograph or guide can be added here and it appears on the website.
        Use {"{{legalName}}"}, {"{{email}}"}, {"{{principal}}"} and {"{{principalTitle}}"} where the company details should fill in.
      </p>
      {!pack.canEdit && <p className="note">You can read this. An administrator has to save changes.</p>}
      {notice && <p className="saved">{notice}</p>}
      {error && <p className="note">{error}</p>}
      <div className="editor-tabs">
        {TABS.map((item) => (
          <button key={item} type="button" className={item === tab ? "active" : ""} onClick={() => setTab(item)}>{item}</button>
        ))}
        {pack.canEdit && tab === "Services" && (
          <button className="solid-btn" type="button" onClick={() => save(() => api("/api/services", {
            method: "POST",
            auth: true,
            body: { name: "New service", short: "Short line", summary: "Describe the service.", applies: [], scope: [], need: [], published: false },
          }), "Service added. Fill it in and publish it when it is ready.")}>Add a service</button>
        )}
        {pack.canEdit && tab === "Guides" && (
          <button className="solid-btn" type="button" onClick={() => save(() => api("/api/articles", {
            method: "POST",
            auth: true,
            body: { title: "New guide", lede: "A short introduction.", raw: "Write the guide here.", published: false },
          }), "Guide added.")}>Add a guide</button>
        )}
      </div>

      {tab === "Details" && (
        <div className="stack">
          <section className="panel crm-form">
            <h2>Company</h2>
            <ImageField label="Logo" logo value={pack.settings.logoImage || "/logo.png"} onChange={(value) => setSetting("logoImage", value)} canEdit={pack.canEdit} />
            <div className="field-grid">
                <Field label="Legal name" required error={detailErrors.legalName} value={pack.settings.legalName} onChange={(value) => { setSetting("legalName", value); setDetailErrors((current) => drop(current, "legalName")); }} />
                <Field label="Public contact" value={pack.settings.principal} onChange={(value) => setSetting("principal", value)} />
                <Field label="Role" value={pack.settings.principalTitle} onChange={(value) => setSetting("principalTitle", value)} />
                <Field label="Email" required error={detailErrors.email} value={pack.settings.email} onChange={(value) => { setSetting("email", value); setDetailErrors((current) => drop(current, "email")); }} />
                <Field label="Phone" required error={detailErrors.phone} value={pack.settings.phone} onChange={(value) => { setSetting("phone", value); setDetailErrors((current) => drop(current, "phone")); }} />
                <Field label="Location line" value={pack.settings.location} onChange={(value) => setSetting("location", value)} />
                <Field wide label="Address" value={pack.settings.address} onChange={(value) => setSetting("address", value)} />
                <Field wide label="Footer" value={pack.settings.footer} onChange={(value) => setSetting("footer", value)} rows={4} />
              </div>
              {pack.canEdit && (
                <div className="form-actions">
                  <button className="solid-btn" type="button" onClick={() => {
                    const found = {};
                    if (blank(pack.settings.legalName)) found.legalName = "Enter the legal name.";
                    if (blank(pack.settings.email)) found.email = "Enter an email address.";
                    else if (!emailOk(pack.settings.email)) found.email = "That email address does not look right.";
                    if (blank(pack.settings.phone)) found.phone = "Enter a phone number.";
                    setDetailErrors(found);
                    if (hasProblems(found)) return;
                    save(() => api("/api/settings", {
                      method: "PUT",
                      auth: true,
                      body: pick(pack.settings, COMPANY_KEYS),
                    }), "Contact details saved.");
                  }}>Save details</button>
                </div>
              )}
          </section>

          <section className="panel crm-form copy-desk">
            <h2>Menu, buttons and footer</h2>
            <div className="lead-fields">
              <section>
                <h2>Menu</h2>
                <div className="field-grid thirds">
                  <Field label="Home" value={pack.settings.navHome} onChange={(value) => setSetting("navHome", value)} />
                  <Field label="Services" value={pack.settings.navServices} onChange={(value) => setSetting("navServices", value)} />
                  <Field label="Approach" value={pack.settings.navApproach} onChange={(value) => setSetting("navApproach", value)} />
                  <Field label="About" value={pack.settings.navAbout} onChange={(value) => setSetting("navAbout", value)} />
                  <Field label="Gallery" value={pack.settings.navGallery} onChange={(value) => setSetting("navGallery", value)} />
                  <Field label="Resources" value={pack.settings.navResources} onChange={(value) => setSetting("navResources", value)} />
                  <Field label="Training" value={pack.settings.navTraining} onChange={(value) => setSetting("navTraining", value)} />
                  <Field label="Contact" value={pack.settings.navContact} onChange={(value) => setSetting("navContact", value)} />
                  <Field label="Menu button" value={pack.settings.navCta} onChange={(value) => setSetting("navCta", value)} />
                </div>
              </section>
              <section>
                <h2>Buttons</h2>
                <div className="field-grid thirds">
                  <Field label="Homepage primary" value={pack.settings.heroPrimary} onChange={(value) => setSetting("heroPrimary", value)} />
                  <Field label="Homepage second" value={pack.settings.heroSecondary} onChange={(value) => setSetting("heroSecondary", value)} />
                  <Field label="Form button" value={pack.settings.formButton} onChange={(value) => setSetting("formButton", value)} />
                </div>
              </section>
              <section>
                <h2>Service page</h2>
                <div className="field-grid">
                  <Field label="Where it applies" value={pack.settings.appliesTitle} onChange={(value) => setSetting("appliesTitle", value)} />
                  <Field label="Scope" value={pack.settings.scopeTitle} onChange={(value) => setSetting("scopeTitle", value)} />
                  <Field label="What the site provides" value={pack.settings.needTitle} onChange={(value) => setSetting("needTitle", value)} />
                  <Field label="Form heading" value={pack.settings.serviceAskTitle} onChange={(value) => setSetting("serviceAskTitle", value)} />
                  <Field wide label="Form text" value={pack.settings.serviceAskText} onChange={(value) => setSetting("serviceAskText", value)} rows={3} />
                </div>
              </section>
              <section>
                <h2>Footer</h2>
                <div className="field-grid thirds">
                  <Field label="Services" value={pack.settings.footerServices} onChange={(value) => setSetting("footerServices", value)} />
                  <Field label="Company" value={pack.settings.footerCompany} onChange={(value) => setSetting("footerCompany", value)} />
                  <Field label="Approach" value={pack.settings.footerApproach} onChange={(value) => setSetting("footerApproach", value)} />
                  <Field label="Capability" value={pack.settings.footerCapability} onChange={(value) => setSetting("footerCapability", value)} />
                  <Field label="Notes" value={pack.settings.footerNotes} onChange={(value) => setSetting("footerNotes", value)} />
                  <Field label="Privacy" value={pack.settings.footerPrivacy} onChange={(value) => setSetting("footerPrivacy", value)} />
                  <Field label="Terms" value={pack.settings.footerTerms} onChange={(value) => setSetting("footerTerms", value)} />
                  <Field label="Staff sign in" value={pack.settings.footerStaff} onChange={(value) => setSetting("footerStaff", value)} />
                </div>
              </section>
              <section>
                <h2>Menu notes</h2>
                <div className="field-grid thirds">
                  <Field label="About" value={pack.settings.menuAboutText} onChange={(value) => setSetting("menuAboutText", value)} />
                  <Field label="Gallery" value={pack.settings.menuGalleryText} onChange={(value) => setSetting("menuGalleryText", value)} />
                  <Field label="Resources" value={pack.settings.menuResourcesText} onChange={(value) => setSetting("menuResourcesText", value)} />
                </div>
              </section>
              <div className="split-groups">
                <section>
                  <h2>Missing service</h2>
                  <div className="field-stack">
                    <Field label="Small line" value={pack.settings.missingServiceKicker} onChange={(value) => setSetting("missingServiceKicker", value)} />
                    <Field label="Title" value={pack.settings.missingServiceTitle} onChange={(value) => setSetting("missingServiceTitle", value)} />
                    <Field label="Link" value={pack.settings.missingServiceLink} onChange={(value) => setSetting("missingServiceLink", value)} />
                  </div>
                </section>
                <section>
                  <h2>Missing guide</h2>
                  <div className="field-stack">
                    <Field label="Small line" value={pack.settings.missingGuideKicker} onChange={(value) => setSetting("missingGuideKicker", value)} />
                    <Field label="Title" value={pack.settings.missingGuideTitle} onChange={(value) => setSetting("missingGuideTitle", value)} />
                    <Field label="Link" value={pack.settings.missingGuideLink} onChange={(value) => setSetting("missingGuideLink", value)} />
                  </div>
                </section>
              </div>
              <section>
                <h2>Enquiry form</h2>
                <div className="field-grid">
                  <Field label="Text while sending" value={pack.settings.formSending} onChange={(value) => setSetting("formSending", value)} />
                </div>
              </section>
            </div>
            {pack.canEdit && (
              <div className="form-actions">
                <button className="solid-btn" type="button" onClick={() => save(() => api("/api/settings", {
                  method: "PUT",
                  auth: true,
                  body: pick(pack.settings, WORD_KEYS),
                }), "Menu and buttons saved.")}>Save menu and buttons</button>
              </div>
            )}
          </section>
        </div>
      )}

      {tab === "Homepage" && (
        <HomepageEditor pack={pack} setPack={updatePack} setSetting={setSetting} save={save} />
      )}

      {tab === "About" && (
        <AboutEditor pack={pack} setPack={setPack} setSetting={setSetting} save={save} />
      )}

      {tab === "Services" && (
        <ServicesEditor pack={pack} setPack={updatePack} setPages={setPack} save={save} />
      )}
      {tab === "Gallery" && (
        <GalleryEditor pack={pack} setPages={setPack} save={save} setSetting={setSetting} />
      )}

      {tab === "Certificates" && (
        <CertificatesEditor pack={pack} setPages={setPack} save={save} />
      )}
      {tab === "Industry" && (
        <IndustryEditor pack={pack} setSetting={setSetting} save={save} />
      )}
      {tab === "Guides" && (
        <GuidesEditor pack={pack} setPack={updatePack} setPages={setPack} save={save} />
      )}
      {tab === "Messages" && (
        <MessagesEditor pack={pack} setSetting={setSetting} save={save} />
      )}
    </div>
  );
}

function MessagesEditor({ pack, setSetting, save }) {
  const extras = Array.isArray(pack.settings.extraServices) ? pack.settings.extraServices : [];
  return (
    <div className="stack">
      <section className="panel crm-form">
        <h2>Enquiry form</h2>
        <p className="muted">These words are the form on the homepage, the contact page and each service page.</p>
        <Field label="Contact name" value={pack.settings.formContact} onChange={(value) => setSetting("formContact", value)} />
        <Field label="Company" value={pack.settings.formCompany} onChange={(value) => setSetting("formCompany", value)} />
        <Field label="Email" value={pack.settings.formEmail} onChange={(value) => setSetting("formEmail", value)} />
        <Field label="Phone" value={pack.settings.formPhone} onChange={(value) => setSetting("formPhone", value)} />
        <Field label="Service" value={pack.settings.formService} onChange={(value) => setSetting("formService", value)} />
        <Field label="Empty service choice" value={pack.settings.formSelect} onChange={(value) => setSetting("formSelect", value)} />
        <Field label="Service window" value={pack.settings.formWindow} onChange={(value) => setSetting("formWindow", value)} />
        <Field label="Empty window choice" value={pack.settings.formWindowEmpty} onChange={(value) => setSetting("formWindowEmpty", value)} />
        <Field label="Facility details" value={pack.settings.formFacility} onChange={(value) => setSetting("formFacility", value)} />
        <Field label="Facility hint" value={pack.settings.formFacilityHint} onChange={(value) => setSetting("formFacilityHint", value)} />
        <Field label="Notes" value={pack.settings.formNotes} onChange={(value) => setSetting("formNotes", value)} />
        <Field label="Note under the button" value={pack.settings.formFine} onChange={(value) => setSetting("formFine", value)} rows={2} />
        <Field label="Extra service choices, one line each" value={extras.join("\n")} onChange={(value) => setSetting("extraServices", splitLines(value))} rows={3} />
      </section>
      <section className="panel crm-form">
        <h2>Thank-you page</h2>
        <p className="muted">{"{{ref}}"} is the enquiry number. {"{{email}}"} is the address on the form.</p>
        <Field label="Small line" value={pack.settings.thankKicker} onChange={(value) => setSetting("thankKicker", value)} />
        <Field label="Title" value={pack.settings.thankTitle} onChange={(value) => setSetting("thankTitle", value)} />
        <Field label="Line when there is a reference" value={pack.settings.thankWithRef} onChange={(value) => setSetting("thankWithRef", value)} />
        <Field label="Line when there is no reference" value={pack.settings.thankWithoutRef} onChange={(value) => setSetting("thankWithoutRef", value)} />
        <Field label="Reply line" value={pack.settings.thankEmail} onChange={(value) => setSetting("thankEmail", value)} rows={2} />
        <Field label="Line when there is no email" value={pack.settings.thankPhone} onChange={(value) => setSetting("thankPhone", value)} rows={2} />
        <Field label="Closing line" value={pack.settings.thankKeep} onChange={(value) => setSetting("thankKeep", value)} />
        <Field label="Home link" value={pack.settings.thankHome} onChange={(value) => setSetting("thankHome", value)} />
      </section>
      <section className="panel crm-form">
        <h2>Gallery</h2>
        <Field label="Empty gallery line" value={pack.settings.galleryEmpty} onChange={(value) => setSetting("galleryEmpty", value)} rows={2} />
        {pack.canEdit && (
          <button className="solid-btn" type="button" onClick={() => save(() => api("/api/settings", {
            method: "PUT",
            auth: true,
            body: pick(pack.settings, MESSAGE_KEYS),
          }), "Messages saved.")}>Save messages</button>
        )}
      </section>
    </div>
  );
}

function HomepageEditor({ pack, setPack, setSetting, save }) {
  const promises = pack.settings.promises?.length
    ? pack.settings.promises
    : [pack.settings.promise1, pack.settings.promise2, pack.settings.promise3].filter(Boolean);

  function setPromises(next) {
    setSetting("promises", next);
  }

  async function saveHome(message, extra) {
    const settings = { ...pick(pack.settings, HOME_KEYS), promises };
    await save(async () => {
      await api("/api/settings", { method: "PUT", auth: true, body: settings });
      await api("/api/steps", { method: "PUT", auth: true, body: { steps: pack.steps } });
      if (extra) await extra();
    }, message);
  }

  return (
    <div className="stack">
      <SliderEditor pack={pack} save={save} />
      <section className="panel editor-card">
        <ImageField label="Fallback photograph" value={pack.settings.heroImage} onChange={(value) => setSetting("heroImage", value)} canEdit={pack.canEdit} />
        <div className="crm-form">
          <h2>Top of the homepage</h2>
          <div className="field-grid">
            <Field label="Small line above the headline" value={pack.settings.heroKicker} onChange={(value) => setSetting("heroKicker", value)} />
            <Field label="What the photograph shows" value={pack.settings.heroAlt} onChange={(value) => setSetting("heroAlt", value)} />
            <Field wide label="Headline" value={pack.settings.heroTitle} onChange={(value) => setSetting("heroTitle", value)} />
            <Field wide label="Introduction" value={pack.settings.heroText} onChange={(value) => setSetting("heroText", value)} rows={3} />
          </div>
        </div>
      </section>

      <section className="panel crm-form">
        <h2>The three promises under the photograph</h2>
        {promises.map((item, index) => (
          <div className="promise-row" key={`${index}-${promises.length}`}>
            <input value={item} onChange={(event) => setPromises(promises.map((line, itemIndex) => itemIndex === index ? event.target.value : line))} />
            {pack.canEdit && <button className="ghost-btn dark" type="button" onClick={() => setPromises(promises.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>}
          </div>
        ))}
        {pack.canEdit && <button className="ghost-btn dark" type="button" onClick={() => setPromises([...promises, "New promise"])}>Add a promise</button>}
      </section>

      <section className="panel crm-form">
        <h2>Homepage sections</h2>
        <div className="lead-fields">
          <section>
            <h2>Services</h2>
            <div className="field-grid">
              <Field label="Small line" value={pack.settings.servicesKicker} onChange={(value) => setSetting("servicesKicker", value)} />
              <Field label="Heading" value={pack.settings.servicesTitle} onChange={(value) => setSetting("servicesTitle", value)} />
            </div>
            <p className="muted">The service cards and their photographs are edited on the Services tab.</p>
          </section>
          <section>
            <h2>Photograph strip</h2>
            <div className="field-grid">
              <Field label="Second homepage button" value={pack.settings.heroWork} onChange={(value) => setSetting("heroWork", value)} />
              <Field label="Photograph button" value={pack.settings.heroOpen} onChange={(value) => setSetting("heroOpen", value)} />
              <Field label="Strip text" value={pack.settings.reelText} onChange={(value) => setSetting("reelText", value)} />
              <Field label="Strip link" value={pack.settings.reelLink} onChange={(value) => setSetting("reelLink", value)} />
            </div>
          </section>
          <section>
            <h2>Promises</h2>
            <div className="field-grid">
              <Field label="Small line" value={pack.settings.promiseKicker} onChange={(value) => setSetting("promiseKicker", value)} />
              <Field label="Heading" value={pack.settings.promiseTitle} onChange={(value) => setSetting("promiseTitle", value)} />
              <Field label="Link" value={pack.settings.promiseLink} onChange={(value) => setSetting("promiseLink", value)} />
            </div>
          </section>
          <section>
            <h2>Certificates</h2>
            <div className="field-grid">
              <Field label="Small line" value={pack.settings.certKicker} onChange={(value) => setSetting("certKicker", value)} />
              <Field label="Heading" value={pack.settings.certTitle} onChange={(value) => setSetting("certTitle", value)} />
              <Field wide label="Text" value={pack.settings.certLede} onChange={(value) => setSetting("certLede", value)} rows={3} />
              <Field label="Link" value={pack.settings.certLink} onChange={(value) => setSetting("certLink", value)} />
            </div>
          </section>
          <section>
            <h2>Work</h2>
            <div className="field-grid">
              <Field label="Small line" value={pack.settings.workKicker} onChange={(value) => setSetting("workKicker", value)} />
              <Field label="Heading" value={pack.settings.workTitle} onChange={(value) => setSetting("workTitle", value)} />
              <Field label="Link" value={pack.settings.workLink} onChange={(value) => setSetting("workLink", value)} />
            </div>
          </section>
        </div>
      </section>

      <section className="panel editor-card">
        <ImageField label="Walk-through photograph" value={pack.settings.walkImage} onChange={(value) => setSetting("walkImage", value)} canEdit={pack.canEdit} />
        <div className="crm-form">
          <h2>How a job starts</h2>
          <div className="field-grid">
            <Field label="Small line" value={pack.settings.walkKicker} onChange={(value) => setSetting("walkKicker", value)} />
            <Field label="What the photograph shows" value={pack.settings.walkAlt} onChange={(value) => setSetting("walkAlt", value)} />
            <Field wide label="Heading" value={pack.settings.walkTitle} onChange={(value) => setSetting("walkTitle", value)} />
            <Field wide label="Text" value={pack.settings.walkText} onChange={(value) => setSetting("walkText", value)} rows={3} />
            <Field label="Link under the steps" value={pack.settings.approachLink} onChange={(value) => setSetting("approachLink", value)} />
          </div>
        </div>
      </section>

      <section className="panel crm-form">
        <h2>Steps</h2>
        <p className="muted">These steps appear on the homepage and the Approach page. Add or remove as many as you need.</p>
        {pack.steps.map((step, index) => (
          <div key={step.id} className="editor-block">
            <div className="field-grid step-line">
              <Field label="Number" value={step.n} onChange={(value) => setStep(setPack, index, "n", value)} />
              <Field label="Title" value={step.title} onChange={(value) => setStep(setPack, index, "title", value)} />
              <Field wide label="Text" value={step.text} onChange={(value) => setStep(setPack, index, "text", value)} rows={3} />
            </div>
            {pack.canEdit && (
              <button className="ghost-btn dark" type="button" onClick={() => saveHome("Step removed.", () => api(`/api/steps/${step.id}`, { method: "DELETE", auth: true }))}>Remove step</button>
            )}
          </div>
        ))}
        {pack.canEdit && <button className="ghost-btn dark" type="button" onClick={() => saveHome("Step added.", () => api("/api/steps", { method: "POST", auth: true, body: {} }))}>Add a step</button>}
      </section>

      <section className="panel editor-card">
        <ImageField label="Checklist photograph" value={pack.settings.afterImage} onChange={(value) => setSetting("afterImage", value)} canEdit={pack.canEdit} />
        <div className="crm-form">
          <h2>Checklist</h2>
          <div className="field-grid">
            <Field label="Small line" value={pack.settings.afterKicker} onChange={(value) => setSetting("afterKicker", value)} />
            <Field label="What the photograph shows" value={pack.settings.afterAlt} onChange={(value) => setSetting("afterAlt", value)} />
            <Field wide label="Heading" value={pack.settings.afterTitle} onChange={(value) => setSetting("afterTitle", value)} />
            <Field wide label="Checklist, one line each" value={(pack.settings.ticks || []).join("\n")} onChange={(value) => setSetting("ticks", value.split("\n"))} rows={5} />
          </div>
        </div>
      </section>

      <section className="panel crm-form">
        <h2>Enquiry at the bottom of the homepage</h2>
        <div className="field-grid">
          <Field label="Small line" value={pack.settings.askKicker} onChange={(value) => setSetting("askKicker", value)} />
          <Field label="Heading" value={pack.settings.askTitle} onChange={(value) => setSetting("askTitle", value)} />
          <Field wide label="Text" value={pack.settings.askText} onChange={(value) => setSetting("askText", value)} rows={3} />
        </div>
        {pack.canEdit && <button className="solid-btn" type="button" onClick={() => saveHome("Homepage saved.")}>Save homepage</button>}
      </section>
    </div>
  );
}

function SliderEditor({ pack, save }) {
  const [draft, setDraft] = useState({ caption: "", alt: "", file: null });
  const [errors, setErrors] = useState({});
  const [formKey, setFormKey] = useState(0);
  const [open, setOpen] = useState(false);
  const slides = pack.slides || [];

  async function move(item, direction) {
    const ordered = [...slides].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    const index = ordered.findIndex((slide) => slide.id === item.id);
    const other = ordered[index + direction];
    if (!other) return;
    await save(async () => {
      await api(`/api/slides/${item.id}`, { method: "PATCH", auth: true, body: { alt: item.alt, caption: item.caption, published: item.published, sortOrder: other.sortOrder } });
      await api(`/api/slides/${other.id}`, { method: "PATCH", auth: true, body: { alt: other.alt, caption: other.caption, published: other.published, sortOrder: item.sortOrder } });
    }, "Slider order saved.");
  }

  return (
    <section className="panel crm-form">
      <div className="ops-create-bar">
        <h2>Homepage slider</h2>
        {pack.canEdit && slides.length < SLIDE_LIMITS.maxCount && (
          <button className="solid-btn" type="button" onClick={() => setOpen(true)}>Add to the slider</button>
        )}
      </div>
      <p className="muted">{SLIDE_HINT}</p>
      <Drawer
        open={open}
        title="Add to the slider"
        onClose={() => setOpen(false)}
        footer={<button className="solid-btn" type="button" onClick={() => {
          const found = {};
          if (!draft.file) found.file = "Choose a photograph.";
          if (blank(draft.alt)) found.alt = "Describe what the photograph shows.";
          setErrors(found);
          if (hasProblems(found)) return;
          save(async () => {
            const problem = await checkSlideFile(draft.file);
            if (problem) throw new Error(problem);
            await uploadSlide(draft.file, { caption: draft.caption, alt: draft.alt.trim() });
            setDraft({ caption: "", alt: "", file: null });
            setErrors({});
            setFormKey((value) => value + 1);
            setOpen(false);
          }, "Slider photograph added.");
        }}>Add to the slider</button>}
      >
        <div className="crm-form" key={formKey}>
          <Field label="Short caption, optional" value={draft.caption} onChange={(value) => setDraft((current) => ({ ...current, caption: value }))} />
          <Field label="What the photograph shows" required error={errors.alt} value={draft.alt} onChange={(value) => { setDraft((current) => ({ ...current, alt: value })); setErrors((current) => drop(current, "alt")); }} />
          <label className={errors.file ? "is-invalid" : undefined}>
            <span>Photograph<em aria-hidden="true">*</em></span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setDraft((current) => ({ ...current, file: event.target.files?.[0] || null })); setErrors((current) => drop(current, "file")); }} />
            {errors.file && <small>{errors.file}</small>}
          </label>
        </div>
      </Drawer>
      <div className="slide-admin">
        {slides.map((item, index) => (
          <SlideCard
            key={item.id}
            item={item}
            canEdit={pack.canEdit}
            save={save}
            first={index === 0}
            last={index === slides.length - 1}
            onMove={move}
          />
        ))}
      </div>
      {slides.length === 0 && <p className="muted">No slider photographs yet. The homepage uses the fallback photograph until one is added.</p>}
    </section>
  );
}

function SlideCard({ item, canEdit, save, first, last, onMove }) {
  const [caption, setCaption] = useState(item.caption);
  const [alt, setAlt] = useState(item.alt);
  const [published, setPublished] = useState(item.published);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const saved = useRef({ caption: item.caption, alt: item.alt, published: item.published });

  useEffect(() => {
    if (
      caption === saved.current.caption
      && alt === saved.current.alt
      && published === saved.current.published
    ) return undefined;
    const timer = setTimeout(() => {
      api(`/api/slides/${item.id}`, {
        method: "PATCH",
        auth: true,
        body: { caption, alt, published, sortOrder: item.sortOrder },
      }).then(() => {
        saved.current = { caption, alt, published };
        publishSiteChange();
      }).catch((err) => setError(err.message));
    }, 400);
    return () => clearTimeout(timer);
  }, [caption, alt, published, item.id, item.sortOrder]);

  async function replace(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const problem = await checkSlideFile(file);
      if (problem) throw new Error(problem);
      await save(() => replaceSlideImage(item.id, file), "Slider photograph replaced.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="slide-card">
      <img src={item.src} alt={alt} />
      <div className="crm-form">
        <Field label="Caption" value={caption} onChange={setCaption} />
        <Field label="What the photograph shows" value={alt} onChange={setAlt} />
        <label className="check"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} /> Show on the website</label>
        {error && <p className="note">{error}</p>}
        {canEdit && (
          <div className="row-actions">
            <button className="ghost-btn dark" type="button" disabled={first} onClick={() => onMove(item, -1)}>Earlier</button>
            <button className="ghost-btn dark" type="button" disabled={last} onClick={() => onMove(item, 1)}>Later</button>
            <label className="file-btn">
              {busy ? "Checking…" : "Replace"}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={replace} hidden />
            </label>
            <button className="ghost-btn dark" type="button" onClick={() => save(() => api(`/api/slides/${item.id}`, { method: "DELETE", auth: true }), "Slider photograph removed.")}>Remove</button>
          </div>
        )}
      </div>
    </article>
  );
}

const COMPANY_PAGES = [
  { slug: "about", heading: "About", note: "This is the About page." },
  {
    slug: "approach",
    heading: "Approach",
    note: "The numbered steps are edited under Homepage. The first paragraph below is the heading under those steps. Each later paragraph is one point.",
    bodyLabel: "Heading, then one point in each paragraph.",
  },
  { slug: "contact", heading: "Contact", note: "These words sit beside the enquiry form. The name, phone, email and address come from Details." },
  { slug: "privacy", heading: "Privacy", note: "This is the privacy page." },
  { slug: "terms", heading: "Terms", note: "This is the terms page." },
];

function AboutEditor({ pack, setPack, setSetting, save }) {
  const [slug, setSlug] = useState("about");
  const page = COMPANY_PAGES.find((item) => item.slug === slug);
  return (
    <div className="stack">
      <div className="editor-tabs page-switch">
        {COMPANY_PAGES.map((item) => (
          <button key={item.slug} type="button" className={item.slug === slug ? "active" : ""} onClick={() => setSlug(item.slug)}>{item.heading}</button>
        ))}
        <button type="button" className={slug === "capability" ? "active" : ""} onClick={() => setSlug("capability")}>Capability</button>
      </div>
      {page && (
        <PageEditor key={page.slug} pack={pack} setPack={setPack} save={save} slug={page.slug} heading={page.heading} note={page.note} bodyLabel={page.bodyLabel} />
      )}
      {slug === "capability" && (
        <PageEditor
          pack={pack}
          setPack={setPack}
          save={save}
          slug="capability"
          heading="Capability statement"
          note="The first paragraph is the introduction. Later paragraphs sit under Accountability. The services and the steps come from those records."
          extra={(
            <>
              <Field label="Services heading" value={pack.settings.capServices} onChange={(value) => setSetting("capServices", value)} />
              <Field label="Approach heading" value={pack.settings.capApproach} onChange={(value) => setSetting("capApproach", value)} />
              <Field label="Accountability heading" value={pack.settings.capAccountTitle} onChange={(value) => setSetting("capAccountTitle", value)} />
              <Field label="Contact heading" value={pack.settings.capContact} onChange={(value) => setSetting("capContact", value)} />
              <Field label="PDF button" value={pack.settings.capPdf} onChange={(value) => setSetting("capPdf", value)} />
            </>
          )}
          onSave={(current) => save(async () => {
            await api(`/api/pages/${current.slug}`, { method: "PUT", auth: true, body: current });
            await api("/api/settings", {
              method: "PUT",
              auth: true,
              body: pick(pack.settings, ["capServices", "capApproach", "capAccountTitle", "capContact", "capPdf"]),
            });
          }, "Capability statement saved.")}
        />
      )}
    </div>
  );
}

function pageBySlug(pack, slug) {
  return pack.pages?.find((page) => page.slug === slug) || {
    slug, kicker: "", title: "", lede: "", image: "", imageAlt: "", body: "",
  };
}

function PageEditor({ pack, setPack, save, slug, heading, note, showImage = true, showBody = true, bodyLabel, extra, onSave }) {
  const [titleError, setTitleError] = useState("");
  const page = pageBySlug(pack, slug);

  function update(key, value) {
    setPack((current) => ({
      ...current,
      pages: (current.pages || []).map((item) => item.slug === slug ? { ...item, [key]: value } : item),
    }));
  }

  return (
    <section className="panel editor-card">
      {showImage && (
        <ImageField label="Photograph" value={page.image} onChange={(value) => update("image", value)} canEdit={pack.canEdit} />
      )}
      <div className="crm-form">
        <h2>{heading}</h2>
        <p className="muted">/{slug}</p>
        {note && <p className="muted">{note}</p>}
        <div className="field-grid">
          <Field label="Small line" value={page.kicker} onChange={(value) => update("kicker", value)} />
          <Field label="Title" required error={titleError} value={page.title} onChange={(value) => { update("title", value); setTitleError(""); }} />
          {showImage && <Field label="What the photograph shows" value={page.imageAlt} onChange={(value) => update("imageAlt", value)} />}
          <Field wide label="Introduction" value={page.lede} onChange={(value) => update("lede", value)} rows={3} />
          {showBody && (
            <Field wide label={bodyLabel || "Body. Leave a blank line between paragraphs."} value={page.body} onChange={(value) => update("body", value)} rows={8} />
          )}
          {extra}
        </div>
        {pack.canEdit && (
          <button className="solid-btn" type="button" onClick={() => {
            if (blank(page.title)) {
              setTitleError("Enter a title.");
              return;
            }
            if (onSave) onSave(page);
            else save(() => api(`/api/pages/${slug}`, {
              method: "PUT",
              auth: true,
              body: page,
            }), `${heading} saved.`);
          }}>Save {heading.toLowerCase()}</button>
        )}
      </div>
    </section>
  );
}

function ServicesEditor({ pack, setPack, setPages, save }) {
  const [errors, setErrors] = useState({});

  function update(index, key, value) {
    setPack((current) => {
      const services = current.services.map((service, item) => item === index ? { ...service, [key]: value } : service);
      return { ...current, services };
    });
  }

  return (
    <div className="stack">
      <PageEditor
        pack={pack}
        setPack={setPages}
        save={save}
        slug="services"
        heading="Services page"
        note="This is the heading on the services page. Each service is edited below."
        showBody={false}
      />
      {pack.services.map((service, index) => (
        <section key={service.id} className="panel service-card">
          <div className="editor-card">
          <ImageField label="Photograph" value={service.image} onChange={(value) => update(index, "image", value)} canEdit={pack.canEdit} />
          <div className="crm-form">
          <h2>{service.name || "Service"}</h2>
          <Field label="Name" required error={errors[service.id]?.name} value={service.name} onChange={(value) => { update(index, "name", value); setErrors((current) => ({ ...current, [service.id]: drop(current[service.id] || {}, "name") })); }} />
          <Field label="Link name" required error={errors[service.id]?.slug} value={service.slug} onChange={(value) => { update(index, "slug", value); setErrors((current) => ({ ...current, [service.id]: drop(current[service.id] || {}, "slug") })); }} />
          <Field wide label="Short line" value={service.short} onChange={(value) => update(index, "short", value)} />
          <Field label="Summary" value={service.summary} onChange={(value) => update(index, "summary", value)} rows={3} />
          </div>
          </div>
          <div className="crm-form list-row">
          <div className="line-lists">
            <LineOptions label="Where it applies" lines={service.applies} canEdit={pack.canEdit} onChange={(value) => update(index, "applies", value)} />
            <LineOptions label="What a scope names" lines={service.scope} canEdit={pack.canEdit} onChange={(value) => update(index, "scope", value)} />
            <LineOptions label="What the site needs to provide" lines={service.need} canEdit={pack.canEdit} onChange={(value) => update(index, "need", value)} />
          </div>
          <label className="check"><input type="checkbox" checked={service.published} onChange={(event) => update(index, "published", event.target.checked)} /> Published</label>
          {pack.canEdit && (
            <div className="row-actions">
              <button className="solid-btn" type="button" onClick={() => {
                const found = {};
                if (blank(service.name)) found.name = "Enter the service name.";
                if (blank(service.slug)) found.slug = "Enter the link name.";
                setErrors((current) => ({ ...current, [service.id]: found }));
                if (hasProblems(found)) return;
                save(() => api(`/api/services/${service.id}`, {
                  method: "PUT",
                  auth: true,
                  body: service,
                }), "Service saved.");
              }}>Save service</button>
              <button className="ghost-btn dark" type="button" onClick={() => save(() => api(`/api/services/${service.id}`, {
                method: "DELETE",
                auth: true,
              }), "Service removed.")}>Remove</button>
            </div>
          )}
          </div>
        </section>
      ))}
    </div>
  );
}

function IndustryEditor({ pack, setSetting, save }) {
  const settings = pack.settings || {};
  const markets = Array.isArray(settings.industryMarkets) ? settings.industryMarkets : [];
  const notes = Array.isArray(settings.industryMarketNotes) ? settings.industryMarketNotes : [];
  const work = Array.isArray(settings.industryWork) ? settings.industryWork : [];
  const [errors, setErrors] = useState({});

  function saveIndustry() {
    const found = {};
    if (blank(settings.industryKicker)) found.kicker = "Enter the label.";
    if (blank(settings.industryTitle)) found.title = "Enter the heading.";
    if (!markets.some((item) => String(item).trim())) found.markets = "Enter at least one market.";
    setErrors(found);
    if (hasProblems(found)) return;
    save(() => api("/api/settings", {
      method: "PUT",
      auth: true,
      body: {
        industryKicker: settings.industryKicker.trim(),
        industryTitle: settings.industryTitle.trim(),
        industryLede: (settings.industryLede || "").trim(),
        industryMarkets: markets,
        industryMarketNotes: notes,
        industryWorkTitle: (settings.industryWorkTitle || "").trim(),
        industryWork: work,
        industryAlsoTitle: (settings.industryAlsoTitle || "").trim(),
        industryAlso: (settings.industryAlso || "").trim(),
      },
    }), "Industry section saved.");
  }

  return (
    <div className="stack">
      <section className="panel crm-form">
        <h2>Industry we work with</h2>
        <p className="muted">Shown on the homepage and the markets page. Icons follow the wording. Keep client and partner names off this section.</p>
        <Field label="Label" required error={errors.kicker} value={settings.industryKicker || ""} onChange={(value) => { setSetting("industryKicker", value); setErrors((current) => drop(current, "kicker")); }} />
        <Field label="Heading" required error={errors.title} value={settings.industryTitle || ""} onChange={(value) => { setSetting("industryTitle", value); setErrors((current) => drop(current, "title")); }} />
        <Field label="Introduction" value={settings.industryLede || ""} onChange={(value) => setSetting("industryLede", value)} rows={4} />
        <Field label="Markets, one line each" required error={errors.markets} value={markets.join("\n")} onChange={(value) => { setSetting("industryMarkets", splitLines(value)); setErrors((current) => drop(current, "markets")); }} rows={5} />
        <Field label="A short line under each market, in the same order" value={notes.join("\n")} onChange={(value) => setSetting("industryMarketNotes", splitLines(value))} rows={5} />
        <Field label="Work heading" value={settings.industryWorkTitle || ""} onChange={(value) => setSetting("industryWorkTitle", value)} />
        <Field label="What the clean covers, one line each" value={work.join("\n")} onChange={(value) => setSetting("industryWork", splitLines(value))} rows={8} />
        <Field label="Related plants heading" value={settings.industryAlsoTitle || ""} onChange={(value) => setSetting("industryAlsoTitle", value)} />
        <Field label="Related plants" value={settings.industryAlso || ""} onChange={(value) => setSetting("industryAlso", value)} rows={3} />
        {pack.canEdit && (
          <div className="row-actions">
            <button className="solid-btn" type="button" onClick={saveIndustry}>Save industry</button>
          </div>
        )}
      </section>
    </div>
  );
}

function CertificatesEditor({ pack, setPages, save }) {
  const [draft, setDraft] = useState({ title: "", issuer: "", person: "", date: "", detail: "", file: "", image: "" });
  const [errors, setErrors] = useState({});
  const [open, setOpen] = useState(false);
  const items = pack.certificates || [];

  return (
    <div className="stack">
      <PageEditor
        pack={pack}
        setPack={setPages}
        save={save}
        slug="training"
        heading="Training page"
        note="This is the heading on the training page. The certificates below are what the page lists."
        showImage={false}
        showBody={false}
      />
      {pack.canEdit && (
        <button className="solid-btn" type="button" onClick={() => setOpen(true)}>Add a certificate</button>
      )}
      <Drawer
        open={open}
        wide
        title="Add a certificate"
        onClose={() => setOpen(false)}
        footer={<button className="solid-btn" type="button" onClick={() => {
          const found = {};
          if (blank(draft.title)) found.title = "Enter the certificate title.";
          if (!draft.image) found.image = "Add a certificate image.";
          setErrors(found);
          if (hasProblems(found)) return;
          save(async () => {
            await api("/api/certificates", { method: "POST", auth: true, body: draft });
            setDraft({ title: "", issuer: "", person: "", date: "", detail: "", file: "", image: "" });
            setErrors({});
            setOpen(false);
          }, "Certificate added.");
        }}>Add certificate</button>}
      >
        <div className="crm-form">
          <ImageField label="Certificate image" value={draft.image} onChange={(value) => setDraft((current) => ({ ...current, image: value }))} canEdit={pack.canEdit} />
          <div className="field-grid">
            <Field label="Title" required error={errors.title} value={draft.title} onChange={(value) => { setDraft((current) => ({ ...current, title: value })); setErrors((current) => drop(current, "title")); }} />
            <Field label="Issuer" value={draft.issuer} onChange={(value) => setDraft((current) => ({ ...current, issuer: value }))} />
            <Field label="Person" value={draft.person} onChange={(value) => setDraft((current) => ({ ...current, person: value }))} />
            <Field label="Date" value={draft.date} onChange={(value) => setDraft((current) => ({ ...current, date: value }))} />
            <Field wide label="Detail" value={draft.detail} onChange={(value) => setDraft((current) => ({ ...current, detail: value }))} rows={2} />
            <Field wide label="PDF address, if there is one" value={draft.file} onChange={(value) => setDraft((current) => ({ ...current, file: value }))} />
          </div>
          {errors.image && <p className="note">{errors.image}</p>}
        </div>
      </Drawer>
      {items.map((item) => (
        <CertificateCard key={item.id} item={item} canEdit={pack.canEdit} save={save} />
      ))}
    </div>
  );
}

function CertificateCard({ item, canEdit, save }) {
  const [form, setForm] = useState(item);
  const [errors, setErrors] = useState({});
  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => drop(current, key));
  }
  return (
    <section className="panel editor-card">
      <ImageField label={form.title || "Certificate"} value={form.image} onChange={(value) => set("image", value)} canEdit={canEdit} />
      <div className="crm-form">
        <div className="field-grid">
          <Field label="Title" required error={errors.title} value={form.title} onChange={(value) => set("title", value)} />
          <Field label="Issuer" value={form.issuer} onChange={(value) => set("issuer", value)} />
          <Field label="Person" value={form.person} onChange={(value) => set("person", value)} />
          <Field label="Date" value={form.date} onChange={(value) => set("date", value)} />
          <Field wide label="Detail" value={form.detail} onChange={(value) => set("detail", value)} rows={2} />
          <Field wide label="File" value={form.file} onChange={(value) => set("file", value)} />
        </div>
        <label className="check"><input type="checkbox" checked={form.published} onChange={(event) => set("published", event.target.checked)} /> Published</label>
        {canEdit && (
          <div className="row-actions">
            {errors.image && <p className="note">{errors.image}</p>}
            <button className="solid-btn" type="button" onClick={() => {
              const found = {};
              if (blank(form.title)) found.title = "Enter the certificate title.";
              if (!form.image) found.image = "Add a certificate image.";
              setErrors(found);
              if (hasProblems(found)) return;
              save(() => api(`/api/certificates/${item.id}`, {
                method: "PATCH",
                auth: true,
                body: form,
              }), "Certificate saved.");
            }}>Save</button>
            <button className="ghost-btn dark" type="button" onClick={() => save(() => api(`/api/certificates/${item.id}`, {
              method: "DELETE",
              auth: true,
            }), "Certificate removed.")}>Remove</button>
          </div>
        )}
      </div>
    </section>
  );
}

function nextGroupId(categories) {
  const used = new Set(categories.map((item) => item.id));
  let number = categories.length + 1;
  let id = `group-${number}`;
  while (used.has(id)) {
    number += 1;
    id = `group-${number}`;
  }
  return id;
}

function GalleryEditor({ pack, setPages, save, setSetting }) {
  const [draft, setDraft] = useState({ caption: "", alt: "", category: "", file: null });
  const [errors, setErrors] = useState({});
  const [formKey, setFormKey] = useState(0);
  const [open, setOpen] = useState(false);
  const categories = pack.settings.galleryCategories || [];

  function setCategories(next) {
    setSetting("galleryCategories", next);
  }

  return (
    <div className="stack">
      <PageEditor
        pack={pack}
        setPack={setPages}
        save={save}
        slug="gallery"
        heading="Gallery page"
        note="This is the heading on the gallery page. The photographs are below."
        showImage={false}
        showBody={false}
      />
      <section className="panel crm-form">
        <h2>Photograph groups</h2>
        <p className="muted">These names are the filters on the gallery and the cards on the homepage. The id has to match the group stored on each photograph.</p>
        {categories.map((item, index) => (
          <div className="editor-block" key={index}>
            <Field label="Id" value={item.id} onChange={(value) => setCategories(categories.map((row, rowIndex) => rowIndex === index ? { ...row, id: value } : row))} />
            <Field label="Name" value={item.title} onChange={(value) => setCategories(categories.map((row, rowIndex) => rowIndex === index ? { ...row, title: value } : row))} />
            <Field label="Text" value={item.text} onChange={(value) => setCategories(categories.map((row, rowIndex) => rowIndex === index ? { ...row, text: value } : row))} rows={2} />
            {pack.canEdit && (
              <div className="row-actions">
                <button className="ghost-btn dark" type="button" onClick={() => setCategories(categories.filter((_, rowIndex) => rowIndex !== index))}>Remove</button>
              </div>
            )}
          </div>
        ))}
        {pack.canEdit && (
          <div className="row-actions">
            <button className="ghost-btn dark" type="button" onClick={() => setCategories([...categories, { id: nextGroupId(categories), title: "New group", text: "" }])}>Add a group</button>
            <button className="solid-btn" type="button" onClick={() => setOpen(true)}>Add a photograph</button>
          </div>
        )}
      </section>
      <Drawer
        open={open}
        title="Add a photograph"
        onClose={() => setOpen(false)}
        footer={<button className="solid-btn" type="button" onClick={() => {
          const found = {};
          if (blank(draft.caption)) found.caption = "Enter a caption.";
          if (!draft.file) found.file = "Choose an image.";
          setErrors(found);
          if (hasProblems(found)) return;
          save(async () => {
            await uploadGallery(draft.file, { caption: draft.caption.trim(), alt: draft.alt || draft.caption.trim(), category: draft.category });
            setDraft({ caption: "", alt: "", category: "", file: null });
            setErrors({});
            setFormKey((value) => value + 1);
            setOpen(false);
          }, "Photograph added to the gallery.");
        }}>Add to gallery</button>}
      >
        <div className="crm-form" key={formKey}>
          <Field label="Caption" required error={errors.caption} value={draft.caption} onChange={(value) => { setDraft((current) => ({ ...current, caption: value })); setErrors((current) => drop(current, "caption")); }} />
          <Field label="Description for someone who cannot see the image" value={draft.alt} onChange={(value) => setDraft((current) => ({ ...current, alt: value }))} />
          <label>
            Group
            <select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}>
              <option value="">No group</option>
              {categories.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </label>
          <label className={errors.file ? "is-invalid" : undefined}>
            <span>Image<em aria-hidden="true">*</em></span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setDraft((current) => ({ ...current, file: event.target.files?.[0] || null })); setErrors((current) => drop(current, "file")); }} />
            {errors.file && <small>{errors.file}</small>}
          </label>
        </div>
      </Drawer>
      <div className="gallery-admin">
        {pack.gallery.map((item) => (
          <GalleryCard key={item.id} item={item} categories={categories} canEdit={pack.canEdit} save={save} />
        ))}
      </div>
    </div>
  );
}

function GalleryCard({ item, categories = [], canEdit, save }) {
  const [caption, setCaption] = useState(item.caption);
  const [alt, setAlt] = useState(item.alt);
  const [category, setCategory] = useState(item.category || "");
  const [published, setPublished] = useState(item.published);
  const [sortOrder, setSortOrder] = useState(String(item.sortOrder));
  const [src, setSrc] = useState(item.src);
  const [busy, setBusy] = useState(false);
  const skip = useRef(true);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    const timer = setTimeout(() => {
      api(`/api/gallery/${item.id}`, {
        method: "PATCH",
        auth: true,
        body: { caption, alt, category, published, sortOrder: Number(sortOrder) || 0, src },
      }).then(() => publishSiteChange()).catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [caption, alt, category, published, sortOrder, src, item.id]);

  async function replace(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const data = await uploadImage(file);
      setSrc(data.src);
      await save(() => api(`/api/gallery/${item.id}`, {
        method: "PATCH",
        auth: true,
        body: { caption, alt, category, published, sortOrder: Number(sortOrder) || 0, src: data.src },
      }), "Photograph replaced.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="panel">
      <img src={src} alt={alt} />
      <div className="crm-form">
        {canEdit && (
          <label className="file-btn">
            {busy ? "Uploading…" : "Replace photograph"}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={replace} hidden />
          </label>
        )}
        <Field label="Caption" value={caption} onChange={setCaption} />
        <Field label="Description" value={alt} onChange={setAlt} />
        <label>
          Group
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">No group</option>
            {categories.map((group) => <option key={group.id} value={group.id}>{group.title}</option>)}
          </select>
        </label>
        <Field label="Order" value={sortOrder} onChange={setSortOrder} />
        <label className="check"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} /> Published</label>
        {canEdit && (
          <div className="row-actions">
            <button className="solid-btn" type="button" onClick={() => save(() => api(`/api/gallery/${item.id}`, {
              method: "PATCH",
              auth: true,
              body: { caption, alt, category, published, sortOrder: Number(sortOrder) || 0, src },
            }), "Photograph saved.")}>Save</button>
            <button className="ghost-btn dark" type="button" onClick={() => save(() => api(`/api/gallery/${item.id}`, {
              method: "DELETE",
              auth: true,
            }), "Photograph removed.")}>Remove</button>
          </div>
        )}
      </div>
    </article>
  );
}

function GuidesEditor({ pack, setPack, setPages, save }) {
  const [errors, setErrors] = useState({});

  function update(index, key, value) {
    setPack((current) => ({
      ...current,
      articles: current.articles.map((article, item) => item === index ? { ...article, [key]: value } : article),
    }));
  }

  return (
    <div className="stack">
      <PageEditor
        pack={pack}
        setPack={setPages}
        save={save}
        slug="resources"
        heading="Guides page"
        note="This is the heading on the guides page. Each guide is edited below."
        showBody={false}
      />
      {pack.articles.map((article, index) => (
        <section key={article.id} className="panel editor-card">
          <ImageField label="Photograph" value={article.image} onChange={(value) => update(index, "image", value)} canEdit={pack.canEdit} />
          <div className="crm-form">
          <h2>{article.title || "Guide"}</h2>
          <div className="field-grid">
            <Field label="Title" required error={errors[article.id]?.title} value={article.title} onChange={(value) => { update(index, "title", value); setErrors((current) => ({ ...current, [article.id]: drop(current[article.id] || {}, "title") })); }} />
            <Field label="Web address" required error={errors[article.id]?.slug} value={article.slug} onChange={(value) => { update(index, "slug", value); setErrors((current) => ({ ...current, [article.id]: drop(current[article.id] || {}, "slug") })); }} />
            <Field label="Kicker" value={article.kicker} onChange={(value) => update(index, "kicker", value)} />
            <Field label="Reading time" value={article.minutes} onChange={(value) => update(index, "minutes", value)} />
            <Field wide label="Introduction" value={article.lede} onChange={(value) => update(index, "lede", value)} rows={3} />
            <Field wide label="Body. Leave a blank line between paragraphs." value={article.raw} onChange={(value) => update(index, "raw", value)} rows={8} />
          </div>
          <label className="check"><input type="checkbox" checked={article.published} onChange={(event) => update(index, "published", event.target.checked)} /> Published</label>
          {pack.canEdit && (
            <div className="row-actions">
              <button className="solid-btn" type="button" onClick={() => {
                const found = {};
                if (blank(article.title)) found.title = "Enter a title.";
                if (blank(article.slug)) found.slug = "Enter the web address.";
                setErrors((current) => ({ ...current, [article.id]: found }));
                if (hasProblems(found)) return;
                save(() => api(`/api/articles/${article.id}`, {
                  method: "PUT",
                  auth: true,
                  body: article,
                }), "Guide saved.");
              }}>Save guide</button>
              <button className="ghost-btn dark" type="button" onClick={() => save(() => api(`/api/articles/${article.id}`, {
                method: "DELETE",
                auth: true,
              }), "Guide removed.")}>Remove</button>
            </div>
          )}
          </div>
        </section>
      ))}
    </div>
  );
}

function LineOptions({ label, lines, onChange, canEdit }) {
  const items = Array.isArray(lines) && lines.length ? lines : [""];
  const focusNext = useRef(false);
  const last = useRef(null);

  useEffect(() => {
    if (!focusNext.current || !last.current) return;
    last.current.focus();
    focusNext.current = false;
  }, [items.length]);

  function change(index, value) {
    onChange(items.map((line, item) => item === index ? value : line));
  }

  function remove(index) {
    const next = items.filter((_, item) => item !== index);
    onChange(next.length ? next : [""]);
  }

  function add() {
    focusNext.current = true;
    onChange([...items, ""]);
  }

  return (
    <div className="line-options">
      <span>{label}</span>
      {items.map((line, index) => (
        <div className="promise-row" key={`${index}-${items.length}`}>
          <input
            ref={index === items.length - 1 ? last : undefined}
            value={line}
            onChange={(event) => change(index, event.target.value)}
          />
          {canEdit && items.length > 1 && (
            <button className="ghost-btn dark" type="button" onClick={() => remove(index)}>Remove</button>
          )}
        </div>
      ))}
      {canEdit && <button className="ghost-btn dark" type="button" onClick={add}>Add</button>}
    </div>
  );
}

function Field({ label, value, onChange, rows, wide, error, required }) {
  return (
    <label className={`${wide ? "wide " : ""}${error ? "is-invalid" : ""}`}>
      <span>{label}{required && <em aria-hidden="true">*</em>}</span>
      {rows ? (
        <textarea rows={rows} value={value || ""} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value || ""} onChange={(event) => onChange(event.target.value)} />
      )}
      {error && <small>{error}</small>}
    </label>
  );
}

function ImageField({ label, value, onChange, canEdit, logo = false }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const data = await uploadImage(file);
      onChange(data.src);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={logo ? "image-field logo" : "image-field"}>
      <span>{label}</span>
      <div className="image-frame">
        {value ? <img src={value} alt="" /> : <p>No photograph yet</p>}
      </div>
      {canEdit && (
        <label className="file-btn">
          {busy ? "Uploading…" : value ? "Replace photograph" : "Add photograph"}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} hidden />
        </label>
      )}
      {error && <p className="note">{error}</p>}
    </div>
  );
}

function pick(source, keys) {
  const body = {};
  for (const key of keys) body[key] = source[key];
  return body;
}

function splitLines(value) {
  return value.split("\n");
}

function setStep(setPack, index, key, value) {
  setPack((current) => ({
    ...current,
    steps: current.steps.map((step, item) => item === index ? { ...step, [key]: value } : step),
  }));
}
