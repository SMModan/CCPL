import path from "node:path";
import { fileURLToPath } from "node:url";
import { exec, many, one, saveMediaFile } from "./pgdb.js";

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../client/public");

const settings = {
  legalName: "Comprehensive Cleaning Pty Ltd",
  location: "Mandurah, Western Australia",
  principal: "Hamilton Campbell",
  principalTitle: "Managing Director",
  email: "compclean@outlook.com",
  phone: "+61 407 389 985",
  address: "PO Box 6210, Mandurah North, WA 6210",
  footer:
    "Comprehensive Cleaning Pty Ltd cleans food-processing plants, industrial sites, warehouses and commercial buildings. The company is based in Mandurah, Western Australia, and has worked in food-processing environments for 25 years.",
  heroKicker: "Mandurah · Food plants, warehouses, commercial buildings",
  heroTitle: "The clean is agreed before anyone is on the tools.",
  heroText:
    "Comprehensive Cleaning walks the facility, writes what is in and what is out, then cleans to that window. Food manufacturing, industrial sites, warehouses and offices.",
  heroImage: "/uploads/rfp/p6-Im1.jpg",
  heroAlt: "Foam being washed across the floor of a processing room",
  promise1: "Written scope before the first shift",
  promise2: "Fitted to the production window",
  promise3: "A supervisor accountable for the job",
  walkImage: "/uploads/rfp/p11-Im2.jpg",
  walkAlt: "Two crew members in aprons after a wash-down",
  walkKicker: "Site assessment",
  walkTitle: "A walk of the building, not a tour of a brochure.",
  walkText:
    "We look at the areas, the access rules and the time the crew has to be in and out. The quote follows that, so the price is attached to a scope.",
  afterImage: "/photos/steel-detail.jpg",
  afterAlt: "Water on clean stainless steel beside a blue cloth",
  afterKicker: "After the assessment",
  afterTitle: "What you should have in hand before a price.",
  servicesKicker: "Services",
  servicesTitle: "Three kinds of site. The same way of scoping the work.",
  approachLink: "Read how a job is run",
  askKicker: "Contact",
  askTitle: "Request a site assessment",
  askText: "Tell us the facility and the service. A person reads it and replies. The form does not produce a quote on its own.",
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
    "Written scope before the first shift",
    "Fitted to the production window",
    "A supervisor accountable for the job",
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
    name: "Food manufacturing cleaning",
    short: "Hygiene work planned around production, not squeezed in around it.",
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
    name: "Industrial & warehouse cleaning",
    short: "Factories, workshops and warehouses, cleaned to a written scope.",
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
    name: "Commercial & office cleaning",
    short: "Offices and commercial premises, kept presentable for staff and visitors.",
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
    title: "A Mandurah company for food plants and the buildings around them.",
    lede: "Comprehensive Cleaning Pty Ltd is led by Hamilton Campbell, Managing Director. The company is based in Mandurah and has worked in food-processing environments for 25 years.",
    image: "/uploads/rfp/p11-Im2.jpg",
    imageAlt: "Two crew members in aprons after a wash-down",
    body: `Comprehensive Cleaning has worked in food-processing environments for 25 years, from a base in Mandurah, Western Australia. The work covers food plants, including meat processing, and the industrial, warehouse and commercial areas that sit with those sites.

Daily sanitation, equipment cleaning, periodic deep cleans, amenities and on-demand callouts are scoped before a crew starts. A supervisor is on the shift and is the contact for the site while the crew is there. Staff are trained in food safety, sanitation and the protective equipment the site requires.

Companies named in the company's own proposals include Anchor Foods, British Sausage Company, Future Foods, Able Westchem, SCHNITS Frozen Food, Patties Food Group, and a long engagement at Linley Valley Pork. Edit or remove any name here before the site is treated as public.

This site explains the work and takes a request for a site assessment. Where a client, a certificate or a result is not approved for publication, it is left off the page. A capability statement uses the same facts and can be saved as a PDF from the browser.`,
  },
  {
    slug: "approach",
    kicker: "Approach",
    title: "Scope first. Then the crew. Then a review.",
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
    title: "Notes for people briefing a clean.",
    lede: "Short guides on assessments, food-plant briefs and cleaning windows. These are operating notes, not case studies.",
    image: "",
    imageAlt: "",
    body: "",
  },
];

const steps = [
  ["01", "Site assessment", "We walk the facility with your contact, note the areas, the risks, the access rules and the window the work has to fit."],
  ["02", "Written scope", "You get a scope that says what is included, what is not, how often, and who is supervising. A quote follows that scope."],
  ["03", "Delivery", "The crew works to the agreed window. The supervisor on the job is accountable for the scope, not a generic task list."],
  ["04", "Review", "We walk the result with the site contact, record what was done, and agree the next action if something needs to change."],
];

const articles = [
  {
    slug: "what-a-site-assessment-covers",
    title: "What a site assessment covers",
    kicker: "Guide",
    minutes: "4 min",
    lede: "A site assessment is a walk-through, not a sales tour. This is what Comprehensive Cleaning looks at before writing a scope.",
    body: `The useful part of an assessment is seeing the building while it is working, or just after it has stopped. A floor plan helps. Standing in the room helps more. We want to know which areas are in play, which are out of bounds, and what a normal production or trading day actually looks like.

For a food plant that means the production window, hygiene entry rules, and the standard the site is already audited against. For a warehouse it means traffic, racking, and the times the floor has to stay clear. For an office it means access after hours, amenities, and the finish expected in reception.

We leave with notes: areas included, areas excluded, a recommended frequency, and the constraints the quote has to respect. The quote comes after that, so the price is attached to a scope you can point at.`,
  },
  {
    slug: "briefing-a-food-plant-clean",
    title: "How to brief a clean in a food plant",
    kicker: "Food manufacturing",
    minutes: "5 min",
    lede: "The brief that prevents a missed room is short. It names the window, the rules, and the person who can say the job is finished.",
    body: `Start with the window. If production ends at 11pm and the first shift walks in at 5am, the clean has to be finished, checked and clear of hoses and chemicals before that. Say so in the brief. A start time without a finish time is how a crew and a production team end up in the same room.

Then name the rules that are not optional: induction, boot wash, what can come onto the floor, who supplies chemicals, and which equipment the site’s own people must isolate. If an auditor or a customer standard already defines the clean, share that. The scope should follow the site’s standard, not replace it with a generic one.

Close the brief with one site contact who can walk the job at the end. Accountability is a person and a note of what was completed, not a promise that everything, everywhere, was done.`,
  },
  {
    slug: "cleaning-windows",
    title: "Setting a cleaning window around the work",
    kicker: "Operations",
    minutes: "4 min",
    lede: "The clean fails when it collides with production, dispatch or the people still in the office. Agree the window before the first night.",
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
  servicesTitle: "Three kinds of site. The same way of scoping the work.",
  approachLink: "Read how a job is run",
  askKicker: "Contact",
  askTitle: "Request a site assessment",
  askText: "Tell us the facility and the service. A person reads it and replies. The form does not produce a quote on its own.",
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
  partnersTitle: "Partners",
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
  promiseKicker: "On every job",
  promiseTitle: "Agreed first. Then the crew starts.",
  promiseLink: "How a job is run",
  certKicker: "Training",
  certTitle: "Certificates held by the crew.",
  certLede: "Chemical handling and first aid training issued to people at Comprehensive Cleaning. These are individual records, supplied with the company papers.",
  certPageLede: "Chemical handling and first aid training issued to people at Comprehensive Cleaning. These are individual records, supplied with the company papers. Open a certificate to read it.",
  certLink: "All certificates",
  workKicker: "On site",
  workTitle: "The work, by the kind of area.",
  workLink: "Open the gallery",
  galleryAll: "All",
  galleryFilters: "Photograph categories",
  backToTop: "Back to top",
  footerAbout: "About",
  footerTraining: "Training",
  footerGallery: "Gallery",
  footerContact: "Contact",
  galleryCategories: JSON.stringify([
    { id: "food", title: "Food and meat processing", text: "Wash-down of processing rooms, lines and floors. This is the work the company wants to be known for." },
    { id: "plant", title: "Equipment and high-level wash", text: "Machinery, conveyors and the overhead plant, including work from a lift." },
    { id: "amenities", title: "Offices and staff amenities", text: "Lunch rooms, offices and change areas that sit with a food plant." },
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
    title: "Certificates held by the crew.",
    lede: "Chemical handling and first aid training issued to people at Comprehensive Cleaning. These are individual records, supplied with the company papers. Open a certificate to read it.",
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

export async function ensureSettings(db) {
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
