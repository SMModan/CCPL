import path from "node:path";
import { fileURLToPath } from "node:url";
import { exec, many, one, saveMediaFile } from "./pgdb.js";

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../client/public");

const settings = {
  legalName: "Comprehensive Cleaning Pty Ltd",
  location: "Perth, Western Australia",
  principal: "Hamilton Campbell",
  principalTitle: "Managing Director",
  email: "info@comprehensivecleaning.au",
  phone: "0400 791 933",
  address: "Perth, Western Australia",
  footer:
    "Comprehensive Cleaning Pty Ltd provides specialist cleaning services to food-processing plants, industrial sites, warehouses and commercial buildings. Based in Perth, Western Australia, the company brings 32 years of experience in food-processing environments.",
  heroKicker: "Perth · Food plants, warehouses, commercial buildings",
  heroTitle: "The scope of cleaning is agreed upon and finalized before any work begins.",
  heroText:
    "Comprehensive Cleaning begins with a full facility walkthrough to document scope—clearly defining what is included and excluded—before executing a tailored cleaning plan aligned to that defined scope. We serve food manufacturing facilities, industrial sites, warehouses, and office environments.",
  heroImage: "/uploads/rfp/p6-Im1.jpg",
  heroAlt: "Foam being washed across the floor of a processing room",
  promise1: "A written scope is agreed before the first shift commences.",
  promise2: "Work is scheduled to align with the production window.",
  promise3: "A dedicated supervisor is accountable for the job.",
  walkImage: "/uploads/rfp/p11-Im2.jpg",
  walkAlt: "Two crew members in aprons after a wash-down",
  walkKicker: "Site assessment",
  walkTitle: "A walk of the building, not a tour of a brochure.",
  walkText:
    "We begin by assessing the areas involved, the access requirements, and the time available for the crew to complete the work. Pricing is then based directly on that defined scope.",
  afterImage: "/photos/steel-detail.jpg",
  afterAlt: "Water on clean stainless steel beside a blue cloth",
  afterKicker: "After the assessment",
  afterTitle: "What you should have in hand before a price.",
  servicesKicker: "Services",
  servicesTitle: "Three types of site. One consistent approach to scoping the work.",
  approachLink: "Read how a job is run",
  askKicker: "Contact",
  askTitle: "Request a Site Assessment",
  askText: "Provide details of your facility and the service required. Your enquiry will be reviewed personally, and we will respond directly. Please note that submitting this form does not generate an automatic quote.",
  navHome: "Home",
  navServices: "Services",
  navApproach: "Approach",
  navAbout: "About",
  navGallery: "Gallery",
  navResources: "Resources",
  navContact: "Contact",
  navCta: "Request a site assessment",
  heroPrimary: "Request a site assessment",
  heroSecondary: "See the services",
  formButton: "Request a site assessment",
  appliesTitle: "Where it applies",
  scopeTitle: "What a scope usually names",
  needTitle: "What we need from the site",
  serviceAskTitle: "Ask for this service",
  serviceAskText: "The form opens a lead. A person follows it up. Nothing is quoted from the form alone.",
  footerServices: "Services",
  footerCompany: "Company",
  footerNotes: "Notes",
  footerApproach: "Our approach",
  footerCapability: "Capability statement",
  footerPrivacy: "Privacy",
  footerTerms: "Terms",
  footerStaff: "Staff sign in",
  promises: JSON.stringify([
    "A written scope is agreed before the first shift commences.",
    "Work is scheduled to align with the production window.",
    "A dedicated supervisor is accountable for the job.",
  ]),
  ticks: JSON.stringify([
    "The rooms and surfaces included, and the ones left out",
    "How often, and the window the work has to fit",
    "Who supervises, and how the job is signed off",
    "A next step for the quote, not a figure made up on the walk",
  ]),
};

const services = [
  {
    slug: "food-manufacturing",
    name: "Food Manufacturing Cleaning",
    short: "Hygiene schedules designed around production requirements, not fitted around them as an afterthought.",
    summary:
      "Cleaning and sanitation for food-manufacturing facilities: daily production-area sanitation, equipment cleaning, periodic deep cleans, amenities, and on-demand work. Scoped to the areas, the production window, and the standard the site already works to.",
    image: "/uploads/rfp/p6-Im1.jpg",
    applies: [
      "Daily sanitation of production and packing areas",
      "Equipment cleaning agreed with the site",
      "Periodic work on walls, ceilings and ventilation",
      "Amenities, and emergency or on-demand cleans",
    ],
    scope: [
      "The rooms and equipment surfaces included, and the ones that are not",
      "The window the crew can work in, after production or between shifts",
      "Who supplies chemicals and equipment, agreed before the first shift",
      "Supervision on site and a note of what was completed",
    ],
    need: [
      "A site contact who can walk the plant",
      "Access, induction and hygiene rules",
      "The standard or audit the site is already working toward",
    ],
  },
  {
    slug: "industrial-warehouse",
    name: "Industrial & Warehouse Cleaning",
    short: "Factories, workshops and warehouses cleaned in line with a clearly defined scope of work.",
    summary:
      "Planned cleaning for industrial buildings and warehouses: floors, amenities, and the areas that affect safety and day-to-day running.",
    image: "/photos/warehouse.jpg",
    applies: ["Factories and workshops", "Warehouses and dispatch areas", "Amenities and shared staff spaces"],
    scope: [
      "Floors, amenities and agreed high areas where access is safe",
      "Frequency that matches how the building is used",
      "Shutdown or after-hours windows when the floor needs to stay clear",
      "A named supervisor and a simple completion record",
    ],
    need: [
      "Site induction and any exclusion zones",
      "The times forklifts, production or dispatch cannot stop",
      "What ‘done’ looks like for this building",
    ],
  },
  {
    slug: "commercial-office",
    name: "Commercial & Office Cleaning",
    short: "Offices and commercial premises maintained to a professional standard for staff and visitors alike.",
    summary:
      "Regular and periodic cleaning for offices and commercial premises, scheduled so the work does not get in the way of the people using the building.",
    image: "/photos/office.jpg",
    applies: ["Offices and reception areas", "Kitchens, amenities and meeting rooms", "Common areas in commercial buildings"],
    scope: [
      "Daytime or after-hours attendance",
      "A task list the site contact can check",
      "Consumables and access arrangements agreed up front",
      "A straightforward way to raise something that was missed",
    ],
    need: [
      "Alarm, key or after-hours access",
      "Any areas that are out of bounds",
      "The finish the building expects in reception and amenities",
    ],
  },
];

const pages = [
  {
    slug: "about",
    kicker: "About",
    title: "A Perth company for food plants and the buildings around them.",
    lede: "Comprehensive Cleaning Pty Ltd is led by Hamilton Campbell, Managing Director. The company is based in Perth, Western Australia and has worked in food-processing environments for 32 years.",
    image: "/uploads/rfp/p11-Im2.jpg",
    imageAlt: "Two crew members in aprons after a wash-down",
    body: `Comprehensive Cleaning has worked in food-processing environments for 32 years, from a base in Perth, Western Australia. The work covers food plants, including meat processing, and the industrial, warehouse and commercial areas that sit with those sites.

Daily sanitation, equipment cleaning, periodic deep cleans, amenities and on-demand callouts are scoped before a crew starts. A supervisor is on the shift and is the contact for the site while the crew is there. Staff are trained in food safety, sanitation and the protective equipment the site requires.

Companies named in the company's own proposals include Anchor Foods, British Sausage Company, Future Foods, Able Westchem, SCHNITS Frozen Food, Patties Food Group, and a long engagement at Linley Valley Pork. Edit or remove any name here before the site is treated as public.

This site explains the work and takes a request for a site assessment. Where a client, a certificate or a result is not approved for publication, it is left off the page. A capability statement uses the same facts and can be saved as a PDF from the browser.`,
  },
  {
    slug: "approach",
    kicker: "Approach",
    title: "The scope comes first. The crew follows. Then a formal review.",
    lede: "The work is accountable when someone can point at what was agreed, who supervised it, and what was recorded afterwards.",
    image: "/uploads/rfp/p11-Im2.jpg",
    imageAlt: "Two crew members in aprons after a wash-down",
    body: `What you should have after the assessment

Notes on the areas in the clean, and the areas left out.

A recommended frequency and the window the work has to fit.

A named next step for the quote, rather than a price made up on the walk.`,
  },
  {
    slug: "contact",
    kicker: "Contact",
    title: "Request a site assessment.",
    lede: "Call, email, or send the form. A person reads the enquiry and replies. The form does not produce a quote on its own.",
    image: "/photos/warehouse.jpg",
    imageAlt: "A clean warehouse aisle",
    body: "",
  },
  {
    slug: "services",
    kicker: "Services",
    title: "Choose the site. We will scope the clean.",
    lede: "Food-manufacturing plants, industrial buildings, warehouses and commercial offices. Each one starts with a walk-through and a written scope.",
    image: "/photos/hero-plant.jpg",
    imageAlt: "A clean food-processing room with stainless benches",
    body: "",
  },
  {
    slug: "gallery",
    kicker: "Gallery",
    title: "Photographs from the work.",
    lede: "These pictures are from Comprehensive Cleaning's own records. The captions describe the job. They are not client results or performance claims.",
    image: "/uploads/rfp/p11-Im1.jpg",
    imageAlt: "A crew member beside a kettle during a sanitation shift",
    body: "",
  },
  {
    slug: "resources",
    kicker: "Resources",
    title: "Notes for Briefing a Clean",
    lede: "Short guides on assessments, food-plant briefs and cleaning windows. These are operating notes, not case studies.",
    image: "",
    imageAlt: "",
    body: "",
  },
];

const steps = [
  ["01", "Site Assessment", "We conduct a walkthrough of the facility with your designated contact, identifying the relevant areas, risks, access requirements, and operational time constraints."],
  ["02", "Written Scope", "You receive a detailed scope outlining what is included, what is excluded, the required frequency, and the supervisory structure. A quote is provided based on this agreed scope."],
  ["03", "Delivery", "The crew operates within the agreed timeframe, with the on-site supervisor accountable for delivery against the scope — not a generic checklist."],
  ["04", "Review", "We conduct a joint walkthrough with the site contact to confirm completed work and agree on any required follow-up actions."],
];

const articles = [
  {
    slug: "what-a-site-assessment-covers",
    title: "What a Site Assessment Covers",
    kicker: "Guide",
    minutes: "4 min",
    lede: "A site assessment is a thorough walk-through, not a sales exercise. Here is what Comprehensive Cleaning evaluates before preparing a scope of work.",
    body: `The useful part of an assessment is seeing the building while it is working, or just after it has stopped. A floor plan helps. Standing in the room helps more. We want to know which areas are in play, which are out of bounds, and what a normal production or trading day actually looks like.

For a food plant that means the production window, hygiene entry rules, and the standard the site is already audited against. For a warehouse it means traffic, racking, and the times the floor has to stay clear. For an office it means access after hours, amenities, and the finish expected in reception.

We leave with notes: areas included, areas excluded, a recommended frequency, and the constraints the quote has to respect. The quote comes after that, so the price is attached to a scope you can point at.`,
  },
  {
    slug: "briefing-a-food-plant-clean",
    title: "How to Brief a Clean in a Food Plant",
    kicker: "Food manufacturing",
    minutes: "5 min",
    lede: "An effective brief is concise, covering the time window, the site rules, and the person authorised to confirm the job is complete — this is what prevents a missed area.",
    body: `Start with the window. If production ends at 11pm and the first shift walks in at 5am, the clean has to be finished, checked and clear of hoses and chemicals before that. Say so in the brief. A start time without a finish time is how a crew and a production team end up in the same room.

Then name the rules that are not optional: induction, boot wash, what can come onto the floor, who supplies chemicals, and which equipment the site’s own people must isolate. If an auditor or a customer standard already defines the clean, share that. The scope should follow the site’s standard, not replace it with a generic one.

Close the brief with one site contact who can walk the job at the end. Accountability is a person and a note of what was completed, not a promise that everything, everywhere, was done.`,
  },
  {
    slug: "cleaning-windows",
    title: "Setting a Cleaning Window Around the Work",
    kicker: "Operations",
    minutes: "4 min",
    lede: "A clean fails when it conflicts with production, dispatch, or staff still on site. Agreeing the window in advance, before the first shift, avoids this.",
    body: `A cleaning window is the time the crew is allowed to be in each area, and the time they have to be out. In a plant it often sits after production. In a warehouse it may be a weekend when picking stops. In an office it is usually after the last meeting, with the alarm code and the rooms that stay locked.

Write the window against the areas, not against the whole site. The amenities can be done while a line is still running. The line itself cannot. Splitting the scope this way is what makes a regular program possible instead of a string of one-off callouts.

If the window moves, the scope should say who tells the supervisor and by when. That is an ordinary operating rule. It belongs in the agreement, next to frequency and the areas in and out.`,
  },
];

const gallery = [
  ["/uploads/rfp/p6-Im1.jpg", "Foam being washed across the floor of a processing room", "Foam wash in a processing room"],
  ["/uploads/rfp/p11-Im2.jpg", "Two crew members in aprons after a wash-down", "Crew after a wash-down"],
  ["/uploads/rfp/p11-Im1.jpg", "A crew member beside a kettle during a sanitation shift", "A sanitation shift"],
  ["/uploads/rfp/p6-Im0.jpg", "A person mopping an amenities area", "Amenities cleaning"],
  ["/uploads/rfp/p13-Im0.jpg", "A supervisor with a clipboard during a plant clean", "Shift sign-off"],
  ["/uploads/rfp/p5-Im0.jpg", "A check beside a production line", "A check on the line"],
  ["/uploads/rfp/p11-Im0.jpg", "The production floor during a clean", "The production floor"],
];

export async function seedContent(db) {
  const count = (await one(db, "SELECT COUNT(*) AS n FROM settings")).n;
  if (Number(count) === 0) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await writeContent(client);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } else {
    await ensureSlides(db);
  }
  await ensureWorkGallery(db);
  await ensureCertificates(db);
  await ensurePartners(db);
}

async function writeContent(db) {
  const cache = new Map();
  async function image(src) {
    if (!src) return "";
    if (cache.has(src)) return cache.get(src);
    const url = await saveMediaFile(db, path.resolve(publicDir, src.replace(/^\//, "")));
    cache.set(src, url);
    return url;
  }

  for (const [key, value] of Object.entries(settings)) {
    const stored = /Image$/.test(key) ? await image(value) : value;
    await exec(db, "INSERT INTO settings (key, value) VALUES (?, ?)", [key, stored]);
  }
  for (const [index, service] of services.entries()) {
    await exec(
      db,
      `INSERT INTO services (slug, name, short, summary, image, applies, scope, need, sort_order, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        service.slug,
        service.name,
        service.short,
        service.summary,
        await image(service.image),
        JSON.stringify(service.applies),
        JSON.stringify(service.scope),
        JSON.stringify(service.need),
        index,
      ]
    );
  }
  for (const page of pages) {
    await exec(
      db,
      "INSERT INTO pages (slug, kicker, title, lede, image, image_alt, body) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [page.slug, page.kicker, page.title, page.lede, await image(page.image), page.imageAlt, page.body]
    );
  }
  for (const [index, step] of steps.entries()) {
    await exec(db, "INSERT INTO steps (n, title, text, sort_order) VALUES (?, ?, ?, ?)", [step[0], step[1], step[2], index]);
  }
  for (const [index, article] of articles.entries()) {
    await exec(
      db,
      `INSERT INTO articles (slug, title, kicker, minutes, lede, body, published, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      [article.slug, article.title, article.kicker, article.minutes, article.lede, article.body, index]
    );
  }
  for (const [index, photo] of gallery.entries()) {
    await exec(
      db,
      "INSERT INTO gallery (src, alt, caption, sort_order, published) VALUES (?, ?, ?, ?, 1)",
      [await image(photo[0]), photo[1], photo[2], index]
    );
  }
  const slideRows = [
    [settings.heroImage, settings.heroAlt, ""],
    [services[1].image, services[1].name, services[1].name],
    [services[2].image, services[2].name, services[2].name],
  ];
  for (const [index, row] of slideRows.entries()) {
    await exec(db, "INSERT INTO slides (src, alt, caption, sort_order, published) VALUES (?, ?, ?, ?, 1)", [
      await image(row[0]),
      row[1],
      row[2],
      index,
    ]);
  }
}

export async function ensureSlides(db) {
  const count = Number((await one(db, "SELECT COUNT(*) AS n FROM slides")).n);
  if (count > 0) return;
  const hero = await one(db, "SELECT value FROM settings WHERE key = 'heroImage'");
  const heroAlt = await one(db, "SELECT value FROM settings WHERE key = 'heroAlt'");
  const published = await many(db, "SELECT name, image FROM services WHERE published = 1 AND image <> '' ORDER BY sort_order, id");
  const rows = [];
  const seen = new Set();
  function add(src, alt, caption) {
    if (!src || seen.has(src)) return;
    seen.add(src);
    rows.push([src, alt || "", caption || ""]);
  }
  add(hero?.value, heroAlt?.value, "");
  for (const service of published) add(service.image, service.name, service.name);
  for (const [index, row] of rows.entries()) {
    await exec(db, "INSERT INTO slides (src, alt, caption, sort_order, published) VALUES (?, ?, ?, ?, 1)", [...row, index]);
  }
}

const EXTRA_SETTINGS = {
  servicesKicker: "Services",
  servicesTitle: "Three types of site. One consistent approach to scoping the work.",
  approachLink: "Read how a job is run",
  askKicker: "Contact",
  askTitle: "Request a Site Assessment",
  askText: "Provide details of your facility and the service required. Your enquiry will be reviewed personally, and we will respond directly. Please note that submitting this form does not generate an automatic quote.",
  navHome: "Home",
  navServices: "Services",
  navApproach: "Approach",
  navAbout: "About",
  navGallery: "Gallery",
  navResources: "Resources",
  navContact: "Contact",
  navCta: "Request a site assessment",
  heroPrimary: "Request a site assessment",
  heroSecondary: "See the services",
  formButton: "Request a site assessment",
  appliesTitle: "Where it applies",
  scopeTitle: "What a scope usually names",
  needTitle: "What we need from the site",
  serviceAskTitle: "Ask for this service",
  serviceAskText: "The form opens a lead. A person follows it up. Nothing is quoted from the form alone.",
  footerServices: "Services",
  footerCompany: "Company",
  footerNotes: "Notes",
  footerApproach: "Our approach",
  footerCapability: "Capability statement",
  footerPrivacy: "Privacy",
  footerTerms: "Terms",
  footerStaff: "Staff sign in",
  menuAboutText: "The company",
  menuGalleryText: "Photographs from the work",
  menuResourcesText: "Notes for briefing a clean",
  missingServiceKicker: "Services",
  missingServiceTitle: "That service is not listed",
  missingServiceLink: "Back to services",
  missingGuideKicker: "Resources",
  missingGuideTitle: "That note is not on the site",
  missingGuideLink: "Back to resources",
  formSending: "Sending",
  logoImage: "/logo.png",
  partnersTitle: "Industries We Serve",
  industryKicker: "Industries We Serve",
  industryTitle: "Specialist commercial cleaning for the food manufacturing industry.",
  industryLede: "Food manufacturing and processing represents our primary market. We approach this sector not as general commercial cleaning, but as dedicated plant sanitation, scoped to the specific hygiene demands of food production.",
  industryMarkets: JSON.stringify([
    "Meat and Smallgoods Processing Facilities",
    "Abattoirs",
    "Frozen Food Production Plants",
    "Prepared and Quality Foods Manufacturers",
  ]),
  industryMarketNotes: JSON.stringify([
    "Production rooms, processing lines and floors",
    "All processing areas",
    "Freezers, cold rooms and packing areas",
    "Ready-to-eat and convenience food lines",
  ]),
  industryAlsoTitle: "Related Facilities",
  industryAlso: "Bakeries, dairy processors and seafood plants operate under equivalent hygiene regulations. We develop scopes for these facilities using the same disciplined approach: the plant, the operational window, and the required food-safety checks.",
  industryWorkTitle: "Scope of Cleaning Requirements",
  industryWorkIntro: "Our cleaning programs are built to address the full range of food-safety obligations, including:",
  industryWork: JSON.stringify([
    "HACCP and food safety compliance cleaning",
    "Allergen control and cross-contamination prevention",
    "Sanitation standard operating procedures (SSOPs)",
    "Cold storage and freezer cleaning",
    "Wash-down areas and high-pressure sanitation",
    "Compliance with food safety audits, including AQIS requirements for export-registered plants",
    "Microbial control, including the management of Listeria and Salmonella",
  ]),
  galleryEmpty: "Photographs will appear here once they are published in the CRM.",
  formContact: "Contact name",
  formCompany: "Company",
  formEmail: "Email",
  formPhone: "Phone",
  formService: "Service",
  formSelect: "Select a service",
  formWindow: "Preferred service window",
  formWindowEmpty: "Not sure yet",
  formFacility: "Facility details",
  formFacilityHint: "Site type, suburb or city, and anything the crew would need to know.",
  formNotes: "Notes",
  formFine: "Add an email or a phone number so the enquiry can be returned.",
  extraServices: JSON.stringify(["More than one of these", "Not sure yet"]),
  thankKicker: "Enquiry received",
  thankTitle: "The site assessment request is in.",
  thankWithRef: "Your reference is {{ref}}.",
  thankWithoutRef: "We have the enquiry.",
  thankEmail: "A reply will come to {{email}} once someone has read the facility notes.",
  thankPhone: "Someone will use the phone number on the form to make contact.",
  thankKeep: "Keep the reference if you need to follow the enquiry up.",
  thankHome: "Back to the home page",
  capServices: "Services",
  capApproach: "Approach",
  capAccountTitle: "Accountability",
  capContact: "Contact",
  capPdf: "Save as PDF",
  navTraining: "Training",
  heroWork: "See the work",
  heroOpen: "Open the gallery",
  reelText: "From the plants, the equipment, and the staff rooms.",
  reelLink: "All photographs",
  reelLabel: "Photographs from the work",
  promiseKicker: "On Every Job",
  promiseTitle: "Agreed in advance. Then the crew begins.",
  promiseLink: "How a Job Is Run",
  certKicker: "Training",
  certTitle: "Certifications held by our crew.",
  certLede: "Chemical handling and first aid training issued to personnel at Comprehensive Cleaning. These are individual, verifiable records provided alongside the company's documentation.",
  certPageLede: "Chemical handling and first aid training issued to personnel at Comprehensive Cleaning. These are individual, verifiable records provided alongside the company's documentation. Open a certificate to read it.",
  certLink: "All Certificates",
  workKicker: "On Site",
  workTitle: "Our work, organised by area type.",
  workLink: "View the gallery",
  galleryAll: "All",
  galleryFilters: "Photograph categories",
  backToTop: "Back to top",
  footerAbout: "About",
  footerTraining: "Training",
  footerGallery: "Gallery",
  footerContact: "Contact",
  galleryCategories: JSON.stringify([
    { id: "food", title: "Food and Meat Processing", text: "Wash-down of processing rooms, production lines and floors — the core discipline the company is built on." },
    { id: "plant", title: "Equipment and High-Level Wash", text: "Cleaning of machinery, conveyors and overhead plant, including elevated work platform access where required." },
    { id: "amenities", title: "Offices and Staff Amenities", text: "Maintenance cleaning of office spaces and amenities to a professional standard for staff comfort and presentation." },
  ]),
  promiseImages: JSON.stringify([
    { src: "/work/food/food-06.jpg", position: "50% 62%" },
    { src: "/work/food/food-02.jpg", position: "72% center" },
    { src: "/work/plant/plant-01.jpg", position: "42% 28%" },
  ]),
};

const EXTRA_PAGES = [
  {
    slug: "privacy",
    kicker: "Privacy",
    title: "Privacy placeholder",
    lede: "This page is a placeholder. It is not legal advice and it needs review before the site is public.",
    image: "",
    imageAlt: "",
    body: `{{legalName}} collects the details you put on the site-assessment form so the company can reply and keep a record of the enquiry. Those details are stored in the company’s lead system and are visible to staff who manage enquiries.

The form asks for a contact name, company, email or phone, facility notes and the service you need. Do not send sensitive personal information in the notes.

To ask about a record, email {{email}}. Replace this page with a policy reviewed for Australian privacy law before launch.`,
  },
  {
    slug: "terms",
    kicker: "Terms",
    title: "Terms and disclaimer placeholder",
    lede: "This page is a placeholder. It is not legal advice.",
    image: "",
    imageAlt: "",
    body: `The pages on this website describe how {{legalName}} approaches cleaning work. They are not an offer, a quote, or a certification. A scope and a price exist only when the company sends them after a site assessment.

Nothing on this site should be read as a claim about a named customer, an insurance position, a certificate, or a measured result, unless a later approved page says so in plain terms.

Have this page reviewed before the website is treated as the company’s public terms.`,
  },
  {
    slug: "capability",
    kicker: "Capability statement",
    title: "Capability statement",
    lede: "A one-document view of the company for a prospect or a procurement contact. Use the browser’s print dialog and choose Save as PDF.",
    image: "",
    imageAlt: "",
    body: `{{legalName}} cleans commercial buildings, industrial sites, warehouses and food-manufacturing facilities. The company is led by {{principal}}{{principalTitle}}. Work starts with a site assessment and a written scope.

A job names the areas, the window, the supervisor and the record made at the end. Client names and any certificates appear only when they are published from the CRM. This statement does not add either on its own.`,
  },
  {
    slug: "training",
    kicker: "Training",
    title: "Certifications held by our crew.",
    lede: "Chemical handling and first aid training issued to personnel at Comprehensive Cleaning. These are individual, verifiable records provided alongside the company's documentation. Open a certificate to read it.",
    image: "",
    imageAlt: "",
    body: "",
  },
];

export async function ensurePages(db) {
  for (const page of EXTRA_PAGES) {
    const existing = await one(db, "SELECT slug FROM pages WHERE slug = ?", [page.slug]);
    if (existing) continue;
    await exec(
      db,
      "INSERT INTO pages (slug, kicker, title, lede, image, image_alt, body) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [page.slug, page.kicker, page.title, page.lede, page.image, page.imageAlt, page.body]
    );
  }
}

const PLACE = "Perth, Western Australia";

export function withoutMandurah(value) {
  const original = String(value ?? "");
  if (!/mandurah|407[\s-]*389[\s-]*985|po box 6210|based in western australia|a base in western australia/i.test(original)) {
    return original;
  }
  let text = original;
  text = text.replace(/(?:\+?61[\s-]*)?0?407[\s-]*389[\s-]*985/g, "0400 791 933");
  text = text.replace(/PO Box 6210,\s*Mandurah North,\s*(?:WA|Western Australia)\s*6210/gi, PLACE);
  text = text.replace(/PO Box 6210,\s*(?:WA|Western Australia)\s*6210/gi, PLACE);
  text = text.replace(/Mandurah,\s*Western Australia/gi, PLACE);
  text = text.replace(/\bbased in Mandurah\b/gi, `based in ${PLACE}`);
  text = text.replace(/\ba base in Mandurah\b/gi, `a base in ${PLACE}`);
  text = text.replace(/\bbased in (?!Perth,\s*)Western Australia/gi, `based in ${PLACE}`);
  text = text.replace(/\ba base in (?!Perth,\s*)Western Australia/gi, `a base in ${PLACE}`);
  text = text.replace(/A Mandurah company/g, "A Perth company");
  text = text.replace(/Mandurah North/gi, "Perth");
  text = text.replace(/Mandurah\s*·\s*/gi, "Perth · ");
  text = text.replace(/Mandurah/gi, "Perth");
  text = text.replace(/(Perth, Western Australia)(?:,\s*Western Australia)+/g, "$1");
  return text.replace(/[ ]{2,}/g, " ").replace(/\s+([.,])/g, "$1").trim();
}

const STORED_COPY = [
  ["settings", "key", ["value"]],
  ["pages", "slug", ["kicker", "title", "lede", "image_alt", "body"]],
  ["articles", "id", ["title", "kicker", "lede", "body"]],
  ["services", "id", ["name", "short", "summary", "applies", "scope", "need"]],
  ["steps", "id", ["title", "text"]],
  ["gallery", "id", ["alt", "caption"]],
  ["slides", "id", ["alt", "caption"]],
  ["certificates", "id", ["title", "issuer", "detail"]],
  ["leads", "id", ["facility_details", "notes"]],
  ["clients", "id", ["suburb", "notes"]],
  ["sites", "id", ["address", "access_notes"]],
  ["jobs", "id", ["title", "notes"]],
  ["quotes", "id", ["title", "notes"]],
  ["invoices", "id", ["notes"]],
];

export async function correctStoredCopy(db) {
  for (const [table, id, fields] of STORED_COPY) {
    const rows = await many(db, `SELECT ${id}, ${fields.join(", ")} FROM ${table}`);
    for (const row of rows) {
      const next = {};
      for (const field of fields) {
        const value = withoutMandurah(row[field]);
        if (value !== String(row[field] ?? "")) next[field] = value;
      }
      if (table === "settings" && row.key === "phone") {
        const digits = String(next.value ?? row.value ?? "").replace(/\D/g, "");
        if (digits === "61407389985" || digits === "0407389985" || digits === "407389985") next.value = "0400 791 933";
      }
      if (table === "settings" && row.key === "location") {
        const current = String(next.value ?? row.value ?? "").trim();
        if (/^(western australia|wa|perth)$/i.test(current)) next.value = PLACE;
      }
      if (table === "settings" && row.key === "address") {
        const current = String(next.value ?? row.value ?? "");
        if (/mandurah|6210|po box/i.test(current)) next.value = PLACE;
      }
      const keys = Object.keys(next);
      if (!keys.length) continue;
      await exec(
        db,
        `UPDATE ${table} SET ${keys.map((key) => `${key} = ?`).join(", ")} WHERE ${id} = ?`,
        [...keys.map((key) => next[key]), row[id]]
      );
    }
  }
}

export async function ensureSettings(db) {
  await correctStoredCopy(db);
  const rows = await many(db, "SELECT key, value FROM settings");
  const have = new Map(rows.map((row) => [row.key, row.value]));
  const missing = { ...EXTRA_SETTINGS };
  if (!have.has("promises")) {
    missing.promises = JSON.stringify(
      [have.get("promise1"), have.get("promise2"), have.get("promise3")].filter(Boolean)
    );
  }
  for (const [key, value] of Object.entries(missing)) {
    if (!have.has(key)) await exec(db, "INSERT INTO settings (key, value) VALUES (?, ?)", [key, value]);
  }
  if (have.has("launchPosts")) await exec(db, "DELETE FROM settings WHERE key = ?", ["launchPosts"]);
  if (have.get("partnersTitle") === "Partners") {
    await exec(db, "UPDATE settings SET value = ? WHERE key = ?", ["Industries We Serve", "partnersTitle"]);
  }
  await exec(db, "UPDATE partners SET published = 0");
  await applyHomepageWording(db);
}

const COPY_REVISION = "home-wording-1";

async function putSetting(db, key, value) {
  const existing = await one(db, "SELECT key FROM settings WHERE key = ?", [key]);
  if (existing) await exec(db, "UPDATE settings SET value = ? WHERE key = ?", [value, key]);
  else await exec(db, "INSERT INTO settings (key, value) VALUES (?, ?)", [key, value]);
}

export async function applyHomepageWording(db) {
  const current = await one(db, "SELECT value FROM settings WHERE key = ?", ["copyRevision"]);
  if (current?.value === COPY_REVISION) return;

  const text = {
    footer: "Comprehensive Cleaning Pty Ltd provides specialist cleaning services to food-processing plants, industrial sites, warehouses and commercial buildings. Based in Perth, Western Australia, the company brings 32 years of experience in food-processing environments.",
    heroTitle: "The scope of cleaning is agreed upon and finalized before any work begins.",
    heroText: "Comprehensive Cleaning begins with a full facility walkthrough to document scope—clearly defining what is included and excluded—before executing a tailored cleaning plan aligned to that defined scope. We serve food manufacturing facilities, industrial sites, warehouses, and office environments.",
    servicesTitle: "Three types of site. One consistent approach to scoping the work.",
    walkText: "We begin by assessing the areas involved, the access requirements, and the time available for the crew to complete the work. Pricing is then based directly on that defined scope.",
    askTitle: "Request a Site Assessment",
    askText: "Provide details of your facility and the service required. Your enquiry will be reviewed personally, and we will respond directly. Please note that submitting this form does not generate an automatic quote.",
    promise1: "A written scope is agreed before the first shift commences.",
    promise2: "Work is scheduled to align with the production window.",
    promise3: "A dedicated supervisor is accountable for the job.",
    partnersTitle: "Industries We Serve",
    industryKicker: "Industries We Serve",
    industryTitle: "Specialist commercial cleaning for the food manufacturing industry.",
    industryLede: "Food manufacturing and processing represents our primary market. We approach this sector not as general commercial cleaning, but as dedicated plant sanitation, scoped to the specific hygiene demands of food production.",
    industryAlsoTitle: "Related Facilities",
    industryAlso: "Bakeries, dairy processors and seafood plants operate under equivalent hygiene regulations. We develop scopes for these facilities using the same disciplined approach: the plant, the operational window, and the required food-safety checks.",
    industryWorkTitle: "Scope of Cleaning Requirements",
    industryWorkIntro: "Our cleaning programs are built to address the full range of food-safety obligations, including:",
    promiseKicker: "On Every Job",
    promiseTitle: "Agreed in advance. Then the crew begins.",
    promiseLink: "How a Job Is Run",
    certTitle: "Certifications held by our crew.",
    certLede: "Chemical handling and first aid training issued to personnel at Comprehensive Cleaning. These are individual, verifiable records provided alongside the company's documentation.",
    certPageLede: "Chemical handling and first aid training issued to personnel at Comprehensive Cleaning. These are individual, verifiable records provided alongside the company's documentation. Open a certificate to read it.",
    certLink: "All Certificates",
    workKicker: "On Site",
    workTitle: "Our work, organised by area type.",
    workLink: "View the gallery",
  };
  for (const [key, value] of Object.entries(text)) await putSetting(db, key, value);
  await putSetting(db, "promises", JSON.stringify([text.promise1, text.promise2, text.promise3]));
  await putSetting(db, "industryMarkets", JSON.stringify([
    "Meat and Smallgoods Processing Facilities",
    "Abattoirs",
    "Frozen Food Production Plants",
    "Prepared and Quality Foods Manufacturers",
  ]));
  await putSetting(db, "industryMarketNotes", JSON.stringify([
    "Production rooms, processing lines and floors",
    "All processing areas",
    "Freezers, cold rooms and packing areas",
    "Ready-to-eat and convenience food lines",
  ]));
  await putSetting(db, "industryWork", JSON.stringify([
    "HACCP and food safety compliance cleaning",
    "Allergen control and cross-contamination prevention",
    "Sanitation standard operating procedures (SSOPs)",
    "Cold storage and freezer cleaning",
    "Wash-down areas and high-pressure sanitation",
    "Compliance with food safety audits, including AQIS requirements for export-registered plants",
    "Microbial control, including the management of Listeria and Salmonella",
  ]));
  await putSetting(db, "galleryCategories", JSON.stringify([
    { id: "food", title: "Food and Meat Processing", text: "Wash-down of processing rooms, production lines and floors — the core discipline the company is built on." },
    { id: "plant", title: "Equipment and High-Level Wash", text: "Cleaning of machinery, conveyors and overhead plant, including elevated work platform access where required." },
    { id: "amenities", title: "Offices and Staff Amenities", text: "Maintenance cleaning of office spaces and amenities to a professional standard for staff comfort and presentation." },
  ]));

  const services = [
    ["food-manufacturing", "Food Manufacturing Cleaning", "Hygiene schedules designed around production requirements, not fitted around them as an afterthought."],
    ["industrial-warehouse", "Industrial & Warehouse Cleaning", "Factories, workshops and warehouses cleaned in line with a clearly defined scope of work."],
    ["commercial-office", "Commercial & Office Cleaning", "Offices and commercial premises maintained to a professional standard for staff and visitors alike."],
  ];
  for (const [slug, name, short] of services) {
    await exec(db, "UPDATE services SET name = ?, short = ? WHERE slug = ?", [name, short, slug]);
  }

  const steps = [
    ["01", "Site Assessment", "We conduct a walkthrough of the facility with your designated contact, identifying the relevant areas, risks, access requirements, and operational time constraints."],
    ["02", "Written Scope", "You receive a detailed scope outlining what is included, what is excluded, the required frequency, and the supervisory structure. A quote is provided based on this agreed scope."],
    ["03", "Delivery", "The crew operates within the agreed timeframe, with the on-site supervisor accountable for delivery against the scope — not a generic checklist."],
    ["04", "Review", "We conduct a joint walkthrough with the site contact to confirm completed work and agree on any required follow-up actions."],
  ];
  for (const [n, title, text] of steps) {
    await exec(db, "UPDATE steps SET title = ?, text = ? WHERE n = ?", [title, text, n]);
  }

  const articles = [
    ["what-a-site-assessment-covers", "What a Site Assessment Covers", "A site assessment is a thorough walk-through, not a sales exercise. Here is what Comprehensive Cleaning evaluates before preparing a scope of work."],
    ["briefing-a-food-plant-clean", "How to Brief a Clean in a Food Plant", "An effective brief is concise, covering the time window, the site rules, and the person authorised to confirm the job is complete — this is what prevents a missed area."],
    ["cleaning-windows", "Setting a Cleaning Window Around the Work", "A clean fails when it conflicts with production, dispatch, or staff still on site. Agreeing the window in advance, before the first shift, avoids this."],
  ];
  for (const [slug, title, lede] of articles) {
    await exec(db, "UPDATE articles SET title = ?, lede = ? WHERE slug = ?", [title, lede, slug]);
  }

  await exec(db, "UPDATE pages SET title = ? WHERE slug = ?", ["The scope comes first. The crew follows. Then a formal review.", "approach"]);
  await exec(db, "UPDATE pages SET title = ? WHERE slug = ?", ["Notes for Briefing a Clean", "resources"]);
  await exec(
    db,
    "UPDATE pages SET title = ?, lede = ? WHERE slug = ?",
    [text.certTitle, text.certPageLede, "training"]
  );
  const about = await one(db, "SELECT lede, body FROM pages WHERE slug = ?", ["about"]);
  if (about) {
    await exec(db, "UPDATE pages SET lede = ?, body = ? WHERE slug = ?", [
      String(about.lede || "").replace(/25 years/g, "32 years"),
      String(about.body || "").replace(/25 years/g, "32 years"),
      "about",
    ]);
  }
  await putSetting(db, "copyRevision", COPY_REVISION);
}

const WORK_GROUPS = [
  {
    id: "food",
    count: 12,
    alts: [
      "Foam wash on a food-processing floor",
      "A crew member washing production equipment",
      "Wash-down along a processing line",
      "Sanitation of a food-plant room",
      "High-pressure clean of stainless plant",
      "A processing area during the clean",
    ],
  },
  {
    id: "plant",
    count: 12,
    alts: [
      "High-level wash from a scissor lift",
      "Foam on production machinery",
      "Cleaning overhead plant in a processing room",
      "A conveyor and equipment wash",
      "Machinery covered for a sanitation wash",
      "Detail work on food-plant equipment",
    ],
  },
  {
    id: "amenities",
    count: 10,
    alts: [
      "Cleaning a staff lunch room",
      "An office area on a sanitation round",
      "Staff amenities after the production areas",
      "A boot and change area",
      "Tables and floors in a staff room",
    ],
  },
];

const CERTIFICATE_ROWS = [
  ["Basic Chemical Awareness", "Chemform", "Kinley Tshering", "11 September 2026", "", "/certificates/chemform-chemical-awareness.jpg", "/certificates/chemform-chemical-awareness.jpg"],
  ["Chemical Safety and Handling", "Environex International", "Tshering Choden, Comprehensive Cleaning", "20 December 2024", "", "/certificates/environex-chemical-safety.jpg", "/certificates/environex-chemical-safety.pdf"],
  ["Chemical and Safety Awareness", "Able Westchem", "Arulraj Alakaiya, Comprehensive Cleaning", "28 June 2025", "", "/certificates/able-westchem-chemical-safety.jpg", "/certificates/able-westchem-chemical-safety.pdf"],
  ["Provide First Aid", "St John Ambulance Western Australia", "David Simpson", "Issued 11 July 2023", "HLTAID011 Provide First Aid, HLTAID010 Provide basic emergency life support, HLTAID009 Provide cardiopulmonary resuscitation.", "/certificates/st-john-first-aid.jpg", "/certificates/st-john-first-aid.pdf"],
];

export async function ensureWorkGallery(db) {
  const existing = await many(db, "SELECT src FROM gallery");
  const have = new Set(existing.map((row) => row.src));
  let order = Number((await one(db, "SELECT COALESCE(MAX(sort_order), -1) AS n FROM gallery")).n);
  for (const group of WORK_GROUPS) {
    for (let index = 1; index <= group.count; index += 1) {
      const src = `/work/${group.id}/${group.id}-${String(index).padStart(2, "0")}.jpg`;
      if (have.has(src)) continue;
      order += 1;
      const alt = group.alts[(index - 1) % group.alts.length];
      await exec(
        db,
        "INSERT INTO gallery (src, alt, caption, category, sort_order, published) VALUES (?, ?, ?, ?, ?, 1)",
        [src, alt, alt, group.id, order]
      );
    }
  }
}

const PARTNER_ROWS = [
  ["Anchor Foods", "/partners/anchor-foods-logo.svg", ""],
  ["Patties Food Group", "/partners/patties-logo.svg", ""],
  ["Linley Valley Pork", "/partners/linley-valley-logo.svg", ""],
  ["Able Westchem", "/partners/able-westchem-logo.svg", ""],
  ["Chemform", "/partners/chemform-logo.svg", ""],
  ["St John Ambulance WA", "/partners/st-john-logo.svg", ""],
];

export async function ensurePartners(db) {
  const count = Number((await one(db, "SELECT COUNT(*) AS n FROM partners")).n);
  if (count > 0) return;
  for (const [index, row] of PARTNER_ROWS.entries()) {
    await exec(db, "INSERT INTO partners (name, src, url, sort_order, published) VALUES (?, ?, ?, ?, 1)", [...row, index]);
  }
}

export async function ensureCertificates(db) {
  const count = Number((await one(db, "SELECT COUNT(*) AS n FROM certificates")).n);
  if (count > 0) return;
  for (const [index, row] of CERTIFICATE_ROWS.entries()) {
    await exec(
      db,
      "INSERT INTO certificates (title, issuer, person, issued, detail, image, file, sort_order, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)",
      [...row, index]
    );
  }
}
