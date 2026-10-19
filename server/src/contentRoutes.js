import multer from "multer";
import { exec, many, one, saveMedia } from "./pgdb.js";
import { assertSlideImage, SLIDE_LIMITS } from "./slideRules.js";

const SETTING_KEYS = new Set([
  "legalName",
  "location",
  "principal",
  "principalTitle",
  "email",
  "phone",
  "address",
  "footer",
  "heroKicker",
  "heroTitle",
  "heroText",
  "heroImage",
  "heroAlt",
  "promise1",
  "promise2",
  "promise3",
  "walkImage",
  "walkAlt",
  "walkKicker",
  "walkTitle",
  "walkText",
  "afterImage",
  "afterAlt",
  "afterKicker",
  "afterTitle",
  "ticks",
  "promises",
  "servicesKicker",
  "servicesTitle",
  "approachLink",
  "askKicker",
  "askTitle",
  "askText",
  "navHome",
  "navServices",
  "navApproach",
  "navAbout",
  "navGallery",
  "navResources",
  "navContact",
  "navCta",
  "heroPrimary",
  "heroSecondary",
  "formButton",
  "appliesTitle",
  "scopeTitle",
  "needTitle",
  "serviceAskTitle",
  "serviceAskText",
  "footerServices",
  "footerCompany",
  "footerNotes",
  "footerApproach",
  "footerCapability",
  "footerPrivacy",
  "footerTerms",
  "footerStaff",
  "logoImage",
  "partnersTitle",
  "menuAboutText",
  "menuGalleryText",
  "menuResourcesText",
  "missingServiceKicker",
  "missingServiceTitle",
  "missingServiceLink",
  "missingGuideKicker",
  "missingGuideTitle",
  "missingGuideLink",
  "formSending",
  "galleryEmpty",
  "formContact",
  "formCompany",
  "formEmail",
  "formPhone",
  "formService",
  "formSelect",
  "formWindow",
  "formWindowEmpty",
  "formFacility",
  "formFacilityHint",
  "formNotes",
  "formFine",
  "extraServices",
  "thankKicker",
  "thankTitle",
  "thankWithRef",
  "thankWithoutRef",
  "thankEmail",
  "thankPhone",
  "thankKeep",
  "thankHome",
  "capServices",
  "capApproach",
  "capAccountTitle",
  "capContact",
  "capPdf",
  "navTraining",
  "heroWork",
  "heroOpen",
  "reelText",
  "reelLink",
  "reelLabel",
  "promiseKicker",
  "promiseTitle",
  "promiseLink",
  "certKicker",
  "certTitle",
  "certLede",
  "certPageLede",
  "certLink",
  "workKicker",
  "workTitle",
  "workLink",
  "galleryAll",
  "galleryFilters",
  "backToTop",
  "footerAbout",
  "footerTraining",
  "footerGallery",
  "footerContact",
  "galleryCategories",
  "promiseImages",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
      callback(new Error("Use a JPG, PNG, or WebP image."));
      return;
    }
    callback(null, true);
  },
});

function line(value, max) {
  if (value == null) return "";
  return String(value).replace(/\s+/g, " ").trim().slice(0, max);
}

function block(value, max) {
  if (value == null) return "";
  return String(value).replace(/\r\n/g, "\n").trim().slice(0, max);
}

function paragraphs(value) {
  return block(value, 8000)
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseList(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

function asList(value) {
  const items = Array.isArray(value) ? value : String(value || "").split("\n");
  return JSON.stringify(items.map((item) => line(item, 240)).filter(Boolean));
}

const FIXED_PAGES = new Set([
  "about",
  "approach",
  "contact",
  "services",
  "gallery",
  "resources",
  "privacy",
  "terms",
  "capability",
  "training",
]);

const RESERVED_PAGES = new Set([
  ...FIXED_PAGES,
  "thank-you",
  "home",
  "crm",
  "api",
]);

function slugify(value) {
  return line(value, 80)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseCategories(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        id: line(item?.id, 40).toLowerCase().replace(/[^a-z0-9-]/g, ""),
        title: line(item?.title, 80),
        text: line(item?.text, 240),
      }))
      .filter((item) => item.id && item.title);
  } catch {
    return [];
  }
}

function parsePromiseImages(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({ src: line(item?.src, 240), position: line(item?.position, 40) || "center" }))
      .filter((item) => item.src);
  } catch {
    return [];
  }
}

async function readSettings(db) {
  const settings = {};
  for (const row of await many(db, "SELECT key, value FROM settings")) {
    if (row.key === "ticks" || row.key === "promises" || row.key === "extraServices") settings[row.key] = parseList(row.value);
    else if (row.key === "galleryCategories") settings[row.key] = parseCategories(row.value);
    else if (row.key === "promiseImages") settings[row.key] = parsePromiseImages(row.value);
    else settings[row.key] = row.value;
  }
  return settings;
}

function storeSetting(key, value) {
  if (key === "ticks" || key === "promises" || key === "extraServices") return asList(value);
  if (key === "galleryCategories") return JSON.stringify(parseCategories(JSON.stringify(value)));
  if (key === "promiseImages") return JSON.stringify(parsePromiseImages(JSON.stringify(value)));
  return block(value, key === "footer" || key.endsWith("Text") || key === "thankEmail" || key === "thankPhone" ? 2000 : 500);
}

function serviceOut(row, manage) {
  const service = {
    slug: row.slug,
    name: row.name,
    short: row.short,
    summary: row.summary,
    image: row.image,
    applies: parseList(row.applies),
    scope: parseList(row.scope),
    need: parseList(row.need),
  };
  if (manage) {
    service.id = row.id;
    service.published = Boolean(row.published);
    service.sortOrder = row.sort_order;
  }
  return service;
}

function pageOut(row, manage) {
  const page = {
    slug: row.slug,
    kicker: row.kicker,
    title: row.title,
    lede: row.lede,
    image: row.image || "",
    imageAlt: row.image_alt || "",
    paragraphs: paragraphs(row.body),
  };
  if (manage) page.body = row.body || "";
  return page;
}

function articleOut(row, manage) {
  const article = {
    slug: row.slug,
    title: row.title,
    kicker: row.kicker,
    minutes: row.minutes,
    lede: row.lede,
    body: paragraphs(row.body),
    image: row.image || "",
  };
  if (manage) {
    article.id = row.id;
    article.published = Boolean(row.published);
    article.sortOrder = row.sort_order;
    article.raw = row.body || "";
  }
  return article;
}

export async function publicContent(db) {
  const settings = await readSettings(db);
  const services = (await many(db, "SELECT * FROM services WHERE published = 1 ORDER BY sort_order, id")).map((row) =>
    serviceOut(row, false)
  );
  const pages = {};
  for (const row of await many(db, "SELECT * FROM pages")) pages[row.slug] = pageOut(row, false);
  const steps = await many(db, "SELECT n, title, text FROM steps ORDER BY sort_order, id");
  const articles = (await many(db, "SELECT * FROM articles WHERE published = 1 ORDER BY sort_order, id")).map((row) =>
    articleOut(row, false)
  );
  const gallery = await many(db, "SELECT id, src, alt, caption, category FROM gallery WHERE published = 1 ORDER BY sort_order, id");
  const certificates = (await many(db, "SELECT * FROM certificates WHERE published = 1 ORDER BY sort_order, id")).map(certificateOut);
  const slides = await many(db, "SELECT src, alt, caption FROM slides WHERE published = 1 ORDER BY sort_order, id");
  const partners = await many(db, "SELECT name, src, url FROM partners WHERE published = 1 ORDER BY sort_order, id");
  return {
    company: {
      legalName: settings.legalName || "",
      location: settings.location || "",
      principal: settings.principal || "",
      principalTitle: settings.principalTitle || "",
      email: settings.email || "",
      phone: settings.phone || "",
      address: settings.address || "",
      footer: settings.footer || "",
      logo: settings.logoImage || "/logo.png",
    },
    home: {
      heroKicker: settings.heroKicker || "",
      heroTitle: settings.heroTitle || "",
      heroText: settings.heroText || "",
      heroImage: settings.heroImage || "",
      heroAlt: settings.heroAlt || "",
      promises: Array.isArray(settings.promises) && settings.promises.length
        ? settings.promises
        : [settings.promise1, settings.promise2, settings.promise3].filter(Boolean),
      walkImage: settings.walkImage || "",
      walkAlt: settings.walkAlt || "",
      walkKicker: settings.walkKicker || "",
      walkTitle: settings.walkTitle || "",
      walkText: settings.walkText || "",
      afterImage: settings.afterImage || "",
      afterAlt: settings.afterAlt || "",
      afterKicker: settings.afterKicker || "",
      afterTitle: settings.afterTitle || "",
      ticks: Array.isArray(settings.ticks) ? settings.ticks : [],
      servicesKicker: settings.servicesKicker || "Services",
      servicesTitle: settings.servicesTitle || "",
      approachLink: settings.approachLink || "Read how a job is run",
      askKicker: settings.askKicker || "Contact",
      askTitle: settings.askTitle || "Request a site assessment",
      askText: settings.askText || "",
      promiseKicker: settings.promiseKicker || "On every job",
      promiseTitle: settings.promiseTitle || "Agreed first. Then the crew starts.",
      promiseLink: settings.promiseLink || "How a job is run",
      promiseImages: Array.isArray(settings.promiseImages) ? settings.promiseImages : [],
      reelText: settings.reelText || "From the plants, the equipment, and the staff rooms.",
      reelLink: settings.reelLink || "All photographs",
      reelLabel: settings.reelLabel || "Photographs from the work",
      heroWork: settings.heroWork || "See the work",
      heroOpen: settings.heroOpen || "Open the gallery",
      certKicker: settings.certKicker || "Training",
      certTitle: settings.certTitle || "Certificates held by the crew.",
      certLede: settings.certLede || "",
      certLink: settings.certLink || "All certificates",
      workKicker: settings.workKicker || "On site",
      workTitle: settings.workTitle || "The work, by the kind of area.",
      workLink: settings.workLink || "Open the gallery",
    },
    labels: {
      navHome: settings.navHome || "Home",
      navServices: settings.navServices || "Services",
      navApproach: settings.navApproach || "Approach",
      navAbout: settings.navAbout || "About",
      navGallery: settings.navGallery || "Gallery",
      navResources: settings.navResources || "Resources",
      navContact: settings.navContact || "Contact",
      navCta: settings.navCta || "Request a site assessment",
      heroPrimary: settings.heroPrimary || "Request a site assessment",
      heroSecondary: settings.heroSecondary || "See the services",
      formButton: settings.formButton || "Request a site assessment",
      appliesTitle: settings.appliesTitle || "Where it applies",
      scopeTitle: settings.scopeTitle || "What a scope usually names",
      needTitle: settings.needTitle || "What we need from the site",
      serviceAskTitle: settings.serviceAskTitle || "Ask for this service",
      serviceAskText: settings.serviceAskText || "The form opens a lead. A person follows it up. Nothing is quoted from the form alone.",
      footerServices: settings.footerServices || "Services",
      footerCompany: settings.footerCompany || "Company",
      footerNotes: settings.footerNotes || "Notes",
      footerApproach: settings.footerApproach || "Our approach",
      footerCapability: settings.footerCapability || "Capability statement",
      footerPrivacy: settings.footerPrivacy || "Privacy",
      footerTerms: settings.footerTerms || "Terms",
      footerStaff: settings.footerStaff || "Staff sign in",
      menuAboutText: settings.menuAboutText || "The company",
      menuGalleryText: settings.menuGalleryText || "Photographs from the work",
      menuResourcesText: settings.menuResourcesText || "Notes for briefing a clean",
      missingServiceKicker: settings.missingServiceKicker || "Services",
      missingServiceTitle: settings.missingServiceTitle || "That service is not listed",
      missingServiceLink: settings.missingServiceLink || "Back to services",
      missingGuideKicker: settings.missingGuideKicker || "Resources",
      missingGuideTitle: settings.missingGuideTitle || "That note is not on the site",
      missingGuideLink: settings.missingGuideLink || "Back to resources",
      formSending: settings.formSending || "Sending",
      galleryEmpty: settings.galleryEmpty || "Photographs will appear here once they are published in the CRM.",
      formContact: settings.formContact || "Contact name",
      formCompany: settings.formCompany || "Company",
      formEmail: settings.formEmail || "Email",
      formPhone: settings.formPhone || "Phone",
      formService: settings.formService || "Service",
      formSelect: settings.formSelect || "Select a service",
      formWindow: settings.formWindow || "Preferred service window",
      formWindowEmpty: settings.formWindowEmpty || "Not sure yet",
      formFacility: settings.formFacility || "Facility details",
      formFacilityHint: settings.formFacilityHint || "Site type, suburb or city, and anything the crew would need to know.",
      formNotes: settings.formNotes || "Notes",
      formFine: settings.formFine || "Add an email or a phone number so the enquiry can be returned.",
      extraServices: Array.isArray(settings.extraServices) && settings.extraServices.length
        ? settings.extraServices
        : ["More than one of these", "Not sure yet"],
      thankKicker: settings.thankKicker || "Enquiry received",
      thankTitle: settings.thankTitle || "The site assessment request is in.",
      thankWithRef: settings.thankWithRef || "Your reference is {{ref}}.",
      thankWithoutRef: settings.thankWithoutRef || "We have the enquiry.",
      thankEmail: settings.thankEmail || "A reply will come to {{email}} once someone has read the facility notes.",
      thankPhone: settings.thankPhone || "Someone will use the phone number on the form to make contact.",
      thankKeep: settings.thankKeep || "Keep the reference if you need to follow the enquiry up.",
      thankHome: settings.thankHome || "Back to the home page",
      capServices: settings.capServices || "Services",
      capApproach: settings.capApproach || "Approach",
      capAccountTitle: settings.capAccountTitle || "Accountability",
      capContact: settings.capContact || "Contact",
      capPdf: settings.capPdf || "Save as PDF",
      partnersTitle: settings.partnersTitle || "Partners",
      navTraining: settings.navTraining || "Training",
      galleryAll: settings.galleryAll || "All",
      galleryFilters: settings.galleryFilters || "Photograph categories",
      backToTop: settings.backToTop || "Back to top",
      footerAbout: settings.footerAbout || "About",
      footerTraining: settings.footerTraining || "Training",
      footerGallery: settings.footerGallery || "Gallery",
      footerContact: settings.footerContact || "Contact",
    },
    services,
    pages,
    steps,
    articles,
    gallery,
    categories: Array.isArray(settings.galleryCategories) ? settings.galleryCategories : [],
    certificates,
    slides,
    partners,
  };
}

async function adminContent(db, user) {
  const pages = (await many(db, "SELECT * FROM pages ORDER BY slug")).map((row) => pageOut(row, true));
  return {
    canEdit: user.role === "admin",
    settings: await readSettings(db),
    services: (await many(db, "SELECT * FROM services ORDER BY sort_order, id")).map((row) => serviceOut(row, true)),
    pages,
    steps: await many(db, "SELECT id, n, title, text, sort_order FROM steps ORDER BY sort_order, id"),
    articles: (await many(db, "SELECT * FROM articles ORDER BY sort_order, id")).map((row) => articleOut(row, true)),
    gallery: (await many(db, "SELECT id, src, alt, caption, category, sort_order, published FROM gallery ORDER BY sort_order, id")).map((row) => ({
      id: row.id,
      src: row.src,
      alt: row.alt,
      caption: row.caption,
      category: row.category || "",
      sortOrder: row.sort_order,
      published: Boolean(row.published),
    })),
    certificates: (await many(db, "SELECT * FROM certificates ORDER BY sort_order, id")).map(certificateOut),
    slides: (await many(db, "SELECT id, src, alt, caption, sort_order, published FROM slides ORDER BY sort_order, id")).map(slideOut),
    partners: (await many(db, "SELECT id, name, src, url, sort_order, published FROM partners ORDER BY sort_order, id")).map(partnerOut),
  };
}

function partnerOut(row) {
  return {
    id: row.id,
    name: row.name,
    src: row.src,
    url: row.url || "",
    sortOrder: row.sort_order,
    published: Boolean(row.published),
  };
}

function certificateOut(row) {
  return {
    id: row.id,
    title: row.title,
    issuer: row.issuer,
    person: row.person,
    date: row.issued,
    detail: row.detail || "",
    image: row.image || "",
    images: row.image ? [row.image] : [],
    file: row.file || "",
    sortOrder: row.sort_order,
    published: Boolean(row.published),
  };
}

function slideOut(row) {
  return {
    id: row.id,
    src: row.src,
    alt: row.alt,
    caption: row.caption,
    sortOrder: row.sort_order,
    published: Boolean(row.published),
  };
}

function receiveFile(req, res, next) {
  upload.single("image")(req, res, (error) => {
    if (error) return res.status(400).json({ error: error.message || "That image could not be saved." });
    next();
  });
}

async function deleteMediaIfUnused(db, src) {
  const match = String(src || "").match(/^\/api\/media\/(\d+)$/);
  if (!match) return;
  const used = await one(
    db,
    `SELECT
      (SELECT COUNT(*) FROM gallery WHERE src = ?) +
      (SELECT COUNT(*) FROM certificates WHERE image = ? OR file = ?) +
      (SELECT COUNT(*) FROM slides WHERE src = ?) +
      (SELECT COUNT(*) FROM services WHERE image = ?) +
      (SELECT COUNT(*) FROM pages WHERE image = ?) +
      (SELECT COUNT(*) FROM articles WHERE image = ?) +
      (SELECT COUNT(*) FROM partners WHERE src = ?) +
      (SELECT COUNT(*) FROM settings WHERE value = ?) AS n`,
    [src, src, src, src, src, src, src, src, src]
  );
  if (!Number(used?.n)) await exec(db, "DELETE FROM media WHERE id = ?", [Number(match[1])]);
}

export function registerContent(app, db, { requireUser, requireAdmin }) {
  app.get("/api/media/:id", async (req, res) => {
    const row = await one(db, "SELECT mime, data FROM media WHERE id = ?", [Number(req.params.id)]);
    if (!row) return res.status(404).end();
    res.setHeader("Content-Type", row.mime || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(row.data);
  });

  app.get("/api/content", async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await publicContent(db));
  });

  app.get("/api/content/admin", requireUser, async (req, res) => {
    res.json(await adminContent(db, req.user));
  });

  app.put("/api/settings", requireUser, requireAdmin, async (req, res) => {
    const body = req.body || {};
    for (const [key, value] of Object.entries(body)) {
      if (!SETTING_KEYS.has(key)) continue;
      const stored = storeSetting(key, value);
      await exec(
        db,
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [key, stored]
      );
    }
    res.json(await publicContent(db));
  });

  app.post("/api/uploads", requireUser, requireAdmin, receiveFile, async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Choose an image to upload." });
    const src = await saveMedia(db, {
      mime: req.file.mimetype,
      filename: req.file.originalname || "upload.jpg",
      data: req.file.buffer,
    });
    res.status(201).json({ src });
  });

  app.post("/api/services", requireUser, requireAdmin, async (req, res) => {
    const name = line(req.body?.name, 80);
    const slug = slugify(req.body?.slug || name);
    if (!name || !slug) return res.status(400).json({ error: "A service needs a name." });
    const order = (await one(db, "SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM services")).n;
    try {
      const result = await exec(
        db,
        `INSERT INTO services (slug, name, short, summary, image, applies, scope, need, sort_order, published)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          slug,
          name,
          line(req.body?.short, 180),
          block(req.body?.summary, 800),
          line(req.body?.image, 240),
          asList(req.body?.applies),
          asList(req.body?.scope),
          asList(req.body?.need),
          order,
          req.body?.published === false ? 0 : 1,
        ]
      );
      res.status(201).json({ id: Number(result.lastInsertRowid) });
    } catch (error) {
      if (String(error.message).includes("UNIQUE")) return res.status(400).json({ error: "That web address is already used." });
      throw error;
    }
  });

  app.put("/api/services/:id", requireUser, requireAdmin, async (req, res) => {
    const existing = await one(db, "SELECT id FROM services WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "That service is not in the CRM." });
    const name = line(req.body?.name, 80);
    const slug = slugify(req.body?.slug || name);
    if (!name || !slug) return res.status(400).json({ error: "A service needs a name." });
    try {
      await exec(
        db,
        `UPDATE services
         SET slug = ?, name = ?, short = ?, summary = ?, image = ?, applies = ?, scope = ?, need = ?, sort_order = ?, published = ?
         WHERE id = ?`,
        [
          slug,
          name,
          line(req.body?.short, 180),
          block(req.body?.summary, 800),
          line(req.body?.image, 240),
          asList(req.body?.applies),
          asList(req.body?.scope),
          asList(req.body?.need),
          Number(req.body?.sortOrder) || 0,
          req.body?.published === false ? 0 : 1,
          existing.id,
        ]
      );
      res.json({ ok: true });
    } catch (error) {
      if (String(error.message).includes("UNIQUE")) return res.status(400).json({ error: "That web address is already used." });
      throw error;
    }
  });

  app.delete("/api/services/:id", requireUser, requireAdmin, async (req, res) => {
    const existing = await one(db, "SELECT image FROM services WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "That service is not in the CRM." });
    await exec(db, "DELETE FROM services WHERE id = ?", [Number(req.params.id)]);
    await deleteMediaIfUnused(db, existing.image);
    res.json({ ok: true });
  });

  app.post("/api/pages", requireUser, requireAdmin, async (req, res) => {
    const title = line(req.body?.title, 180);
    const slug = slugify(req.body?.slug || title);
    if (!title || !slug) return res.status(400).json({ error: "A page needs a title." });
    if (RESERVED_PAGES.has(slug)) return res.status(400).json({ error: "That address is already used by the website." });
    try {
      await exec(
        db,
        "INSERT INTO pages (slug, kicker, title, lede, image, image_alt, body) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          slug,
          line(req.body?.kicker, 40),
          title,
          block(req.body?.lede, 500),
          line(req.body?.image, 240),
          line(req.body?.imageAlt, 180),
          block(req.body?.body, 8000),
        ]
      );
      res.status(201).json({ slug });
    } catch (error) {
      if (String(error.message).includes("UNIQUE") || String(error.message).includes("duplicate")) {
        return res.status(400).json({ error: "That web address is already used." });
      }
      throw error;
    }
  });

  app.delete("/api/pages/:slug", requireUser, requireAdmin, async (req, res) => {
    if (FIXED_PAGES.has(req.params.slug)) return res.status(400).json({ error: "That page stays on the website. Edit it instead of removing it." });
    const existing = await one(db, "SELECT image FROM pages WHERE slug = ?", [req.params.slug]);
    if (!existing) return res.status(404).json({ error: "That page is not in the CRM." });
    await exec(db, "DELETE FROM pages WHERE slug = ?", [req.params.slug]);
    await deleteMediaIfUnused(db, existing.image);
    res.json({ ok: true });
  });

  app.put("/api/pages/:slug", requireUser, requireAdmin, async (req, res) => {
    const existing = await one(db, "SELECT slug FROM pages WHERE slug = ?", [req.params.slug]);
    if (!existing) return res.status(404).json({ error: "That page is not in the CRM." });
    await exec(db, "UPDATE pages SET kicker = ?, title = ?, lede = ?, image = ?, image_alt = ?, body = ? WHERE slug = ?", [
      line(req.body?.kicker, 40),
      line(req.body?.title, 180),
      block(req.body?.lede, 500),
      line(req.body?.image, 240),
      line(req.body?.imageAlt, 180),
      block(req.body?.body, 8000),
      existing.slug,
    ]);
    res.json({ ok: true });
  });

  app.post("/api/steps", requireUser, requireAdmin, async (req, res) => {
    const order = (await one(db, "SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM steps")).n;
    const result = await exec(db, "INSERT INTO steps (n, title, text, sort_order) VALUES (?, ?, ?, ?)", [
      line(req.body?.n, 8) || String(order + 1).padStart(2, "0"),
      line(req.body?.title, 80) || "New step",
      block(req.body?.text, 800) || "Describe this step.",
      order,
    ]);
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  });

  app.delete("/api/steps/:id", requireUser, requireAdmin, async (req, res) => {
    const result = await exec(db, "DELETE FROM steps WHERE id = ?", [Number(req.params.id)]);
    if (!result.changes) return res.status(404).json({ error: "That step is not in the CRM." });
    res.json({ ok: true });
  });

  app.put("/api/steps", requireUser, requireAdmin, async (req, res) => {
    const steps = Array.isArray(req.body?.steps) ? req.body.steps : [];
    for (const [index, step] of steps.entries()) {
      await exec(db, "UPDATE steps SET n = ?, title = ?, text = ?, sort_order = ? WHERE id = ?", [
        line(step.n, 8),
        line(step.title, 80),
        block(step.text, 800),
        index,
        Number(step.id),
      ]);
    }
    res.json({ ok: true });
  });

  app.post("/api/articles", requireUser, requireAdmin, async (req, res) => {
    const title = line(req.body?.title, 160);
    const slug = slugify(req.body?.slug || title);
    if (!title || !slug) return res.status(400).json({ error: "A guide needs a title." });
    const order = (await one(db, "SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM articles")).n;
    try {
      const result = await exec(
        db,
        `INSERT INTO articles (slug, title, kicker, minutes, lede, body, image, published, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          slug,
          title,
          line(req.body?.kicker, 40) || "Guide",
          line(req.body?.minutes, 20),
          block(req.body?.lede, 400),
          block(req.body?.raw ?? req.body?.body, 8000),
          line(req.body?.image, 240),
          req.body?.published === false ? 0 : 1,
          order,
        ]
      );
      res.status(201).json({ id: Number(result.lastInsertRowid) });
    } catch (error) {
      if (String(error.message).includes("UNIQUE")) return res.status(400).json({ error: "That web address is already used." });
      throw error;
    }
  });

  app.put("/api/articles/:id", requireUser, requireAdmin, async (req, res) => {
    const existing = await one(db, "SELECT id FROM articles WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "That guide is not in the CRM." });
    const title = line(req.body?.title, 160);
    const slug = slugify(req.body?.slug || title);
    if (!title || !slug) return res.status(400).json({ error: "A guide needs a title." });
    try {
      await exec(
        db,
        `UPDATE articles
         SET slug = ?, title = ?, kicker = ?, minutes = ?, lede = ?, body = ?, image = ?, published = ?, sort_order = ?
         WHERE id = ?`,
        [
          slug,
          title,
          line(req.body?.kicker, 40),
          line(req.body?.minutes, 20),
          block(req.body?.lede, 400),
          block(req.body?.raw ?? req.body?.body, 8000),
          line(req.body?.image, 240),
          req.body?.published === false ? 0 : 1,
          Number(req.body?.sortOrder) || 0,
          existing.id,
        ]
      );
      res.json({ ok: true });
    } catch (error) {
      if (String(error.message).includes("UNIQUE")) return res.status(400).json({ error: "That web address is already used." });
      throw error;
    }
  });

  app.delete("/api/articles/:id", requireUser, requireAdmin, async (req, res) => {
    const existing = await one(db, "SELECT image FROM articles WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "That guide is not in the CRM." });
    await exec(db, "DELETE FROM articles WHERE id = ?", [Number(req.params.id)]);
    await deleteMediaIfUnused(db, existing.image);
    res.json({ ok: true });
  });

  app.post("/api/slides", requireUser, requireAdmin, receiveFile, async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Choose an image to upload." });
    const count = Number((await one(db, "SELECT COUNT(*) AS n FROM slides")).n);
    if (count >= SLIDE_LIMITS.maxCount) {
      return res.status(400).json({ error: `The slider can hold ${SLIDE_LIMITS.maxCount} photographs. Remove one before adding another.` });
    }
    try {
      assertSlideImage(req.file.buffer, req.file.mimetype);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    const alt = line(req.body?.alt, 180);
    if (!alt) return res.status(400).json({ error: "Describe what the photograph shows." });
    const order = (await one(db, "SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM slides")).n;
    const src = await saveMedia(db, {
      mime: req.file.mimetype,
      filename: req.file.originalname || "slide.jpg",
      data: req.file.buffer,
    });
    const result = await exec(db, "INSERT INTO slides (src, alt, caption, sort_order, published) VALUES (?, ?, ?, ?, 1)", [
      src,
      alt,
      line(req.body?.caption, 80),
      order,
    ]);
    res.status(201).json({ id: Number(result.lastInsertRowid), src });
  });

  app.post("/api/slides/:id/image", requireUser, requireAdmin, receiveFile, async (req, res) => {
    const existing = await one(db, "SELECT * FROM slides WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "That slider photograph is not in the CRM." });
    if (!req.file) return res.status(400).json({ error: "Choose an image to upload." });
    try {
      assertSlideImage(req.file.buffer, req.file.mimetype);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    const src = await saveMedia(db, {
      mime: req.file.mimetype,
      filename: req.file.originalname || "slide.jpg",
      data: req.file.buffer,
    });
    await exec(db, "UPDATE slides SET src = ? WHERE id = ?", [src, existing.id]);
    await deleteMediaIfUnused(db, existing.src);
    res.json({ src });
  });

  app.patch("/api/slides/:id", requireUser, requireAdmin, async (req, res) => {
    const existing = await one(db, "SELECT * FROM slides WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "That slider photograph is not in the CRM." });
    const alt = line(req.body?.alt ?? existing.alt, 180);
    if (!alt) return res.status(400).json({ error: "Describe what the photograph shows." });
    await exec(db, "UPDATE slides SET alt = ?, caption = ?, sort_order = ?, published = ? WHERE id = ?", [
      alt,
      line(req.body?.caption ?? existing.caption, 80),
      req.body?.sortOrder == null ? existing.sort_order : Number(req.body.sortOrder) || 0,
      req.body?.published == null ? existing.published : req.body.published ? 1 : 0,
      existing.id,
    ]);
    res.json({ ok: true });
  });

  app.delete("/api/slides/:id", requireUser, requireAdmin, async (req, res) => {
    const existing = await one(db, "SELECT * FROM slides WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "That slider photograph is not in the CRM." });
    await exec(db, "DELETE FROM slides WHERE id = ?", [existing.id]);
    await deleteMediaIfUnused(db, existing.src);
    res.json({ ok: true });
  });

  app.post("/api/gallery", requireUser, requireAdmin, receiveFile, async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Choose an image to upload." });
    const order = (await one(db, "SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM gallery")).n;
    const caption = line(req.body?.caption, 180) || "Untitled photograph";
    const src = await saveMedia(db, {
      mime: req.file.mimetype,
      filename: req.file.originalname || "gallery.jpg",
      data: req.file.buffer,
    });
    const result = await exec(db, "INSERT INTO gallery (src, alt, caption, category, sort_order, published) VALUES (?, ?, ?, ?, ?, ?)", [
      src,
      line(req.body?.alt, 180) || caption,
      caption,
      line(req.body?.category, 40).toLowerCase(),
      order,
      req.body?.published === "0" ? 0 : 1,
    ]);
    res.status(201).json({ id: Number(result.lastInsertRowid), src });
  });

  app.patch("/api/gallery/:id", requireUser, requireAdmin, async (req, res) => {
    const existing = await one(db, "SELECT * FROM gallery WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "That photograph is not in the gallery." });
    await exec(db, "UPDATE gallery SET src = ?, alt = ?, caption = ?, category = ?, sort_order = ?, published = ? WHERE id = ?", [
      line(req.body?.src || existing.src, 240),
      line(req.body?.alt ?? existing.alt, 180),
      line(req.body?.caption ?? existing.caption, 180),
      line(req.body?.category ?? existing.category, 40).toLowerCase(),
      req.body?.sortOrder == null ? existing.sort_order : Number(req.body.sortOrder) || 0,
      req.body?.published == null ? existing.published : req.body.published ? 1 : 0,
      existing.id,
    ]);
    res.json({ ok: true });
  });

  app.post("/api/partners", requireUser, requireAdmin, receiveFile, async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Choose a logo to upload." });
    const name = line(req.body?.name, 80);
    if (!name) return res.status(400).json({ error: "A partner needs a name." });
    const url = line(req.body?.url, 240);
    if (url && !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: "The website needs to start with https://." });
    }
    const order = (await one(db, "SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM partners")).n;
    const src = await saveMedia(db, {
      mime: req.file.mimetype,
      filename: req.file.originalname || "partner.png",
      data: req.file.buffer,
    });
    const result = await exec(db, "INSERT INTO partners (name, src, url, sort_order, published) VALUES (?, ?, ?, ?, 1)", [
      name,
      src,
      url,
      order,
    ]);
    res.status(201).json({ id: Number(result.lastInsertRowid), src });
  });

  app.patch("/api/partners/:id", requireUser, requireAdmin, async (req, res) => {
    const existing = await one(db, "SELECT * FROM partners WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "That partner is not in the CRM." });
    const name = line(req.body?.name ?? existing.name, 80);
    if (!name) return res.status(400).json({ error: "A partner needs a name." });
    const url = line(req.body?.url ?? existing.url, 240);
    if (url && !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: "The website needs to start with https://." });
    }
    await exec(db, "UPDATE partners SET name = ?, url = ?, sort_order = ?, published = ? WHERE id = ?", [
      name,
      url,
      req.body?.sortOrder == null ? existing.sort_order : Number(req.body.sortOrder) || 0,
      req.body?.published == null ? existing.published : req.body.published ? 1 : 0,
      existing.id,
    ]);
    res.json({ ok: true });
  });

  app.delete("/api/partners/:id", requireUser, requireAdmin, async (req, res) => {
    const existing = await one(db, "SELECT * FROM partners WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "That partner is not in the CRM." });
    await exec(db, "DELETE FROM partners WHERE id = ?", [existing.id]);
    await deleteMediaIfUnused(db, existing.src);
    res.json({ ok: true });
  });

  app.delete("/api/gallery/:id", requireUser, requireAdmin, async (req, res) => {
    const existing = await one(db, "SELECT * FROM gallery WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "That photograph is not in the gallery." });
    await exec(db, "DELETE FROM gallery WHERE id = ?", [existing.id]);
    await deleteMediaIfUnused(db, existing.src);
    res.json({ ok: true });
  });

  app.post("/api/certificates", requireUser, requireAdmin, async (req, res) => {
    const title = line(req.body?.title, 160);
    const image = line(req.body?.image, 240);
    if (!title || !image) return res.status(400).json({ error: "A certificate needs a title and an image." });
    const order = (await one(db, "SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM certificates")).n;
    const result = await exec(
      db,
      "INSERT INTO certificates (title, issuer, person, issued, detail, image, file, sort_order, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        title,
        line(req.body?.issuer, 160),
        line(req.body?.person, 160),
        line(req.body?.date, 80),
        block(req.body?.detail, 500),
        image,
        line(req.body?.file, 240),
        order,
        req.body?.published === false ? 0 : 1,
      ]
    );
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  });

  app.patch("/api/certificates/:id", requireUser, requireAdmin, async (req, res) => {
    const existing = await one(db, "SELECT * FROM certificates WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "That certificate is not in the CRM." });
    const title = line(req.body?.title ?? existing.title, 160);
    const image = line(req.body?.image ?? existing.image, 240);
    if (!title || !image) return res.status(400).json({ error: "A certificate needs a title and an image." });
    await exec(
      db,
      "UPDATE certificates SET title = ?, issuer = ?, person = ?, issued = ?, detail = ?, image = ?, file = ?, sort_order = ?, published = ? WHERE id = ?",
      [
        title,
        line(req.body?.issuer ?? existing.issuer, 160),
        line(req.body?.person ?? existing.person, 160),
        line(req.body?.date ?? existing.issued, 80),
        block(req.body?.detail ?? existing.detail, 500),
        image,
        line(req.body?.file ?? existing.file, 240),
        req.body?.sortOrder == null ? existing.sort_order : Number(req.body.sortOrder) || 0,
        req.body?.published == null ? existing.published : req.body.published ? 1 : 0,
        existing.id,
      ]
    );
    res.json({ ok: true });
  });

  app.delete("/api/certificates/:id", requireUser, requireAdmin, async (req, res) => {
    const existing = await one(db, "SELECT * FROM certificates WHERE id = ?", [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: "That certificate is not in the CRM." });
    await exec(db, "DELETE FROM certificates WHERE id = ?", [existing.id]);
    await deleteMediaIfUnused(db, existing.image);
    res.json({ ok: true });
  });
}

export async function publishedServiceNames(db) {
  return (await many(db, "SELECT name FROM services WHERE published = 1")).map((row) => row.name);
}
