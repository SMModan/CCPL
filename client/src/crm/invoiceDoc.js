const PAGE_W = 595;
const PAGE_H = 842;
const LEFT = 40;
const RIGHT = 555;

const STATUS_FILL = {
  Paid: "#e5f4ec",
  Overdue: "#fde8e4",
  Sent: "#e8eef8",
  Draft: "#f3f1ec",
};

const STATUS_INK = {
  Paid: "#0e6b45",
  Overdue: "#9c2f2f",
  Sent: "#082868",
  Draft: "#6a6256",
};

const WIDTHS = {
  " ": 278, "!": 278, '"': 355, "#": 556, "$": 556, "%": 889, "&": 667, "'": 191,
  "(": 333, ")": 333, "*": 389, "+": 584, ",": 278, "-": 333, ".": 278, "/": 278,
  0: 556, 1: 556, 2: 556, 3: 556, 4: 556, 5: 556, 6: 556, 7: 556, 8: 556, 9: 556,
  ":": 278, ";": 278, "?": 556, "@": 1015,
  A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 500,
  K: 667, L: 556, M: 833, N: 722, O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611,
  U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611,
  a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556, i: 222, j: 222,
  k: 500, l: 222, m: 833, n: 556, o: 556, p: 556, q: 556, r: 333, s: 500, t: 278,
  u: 556, v: 500, w: 722, x: 500, y: 500, z: 500,
};

export function issuerOf(company) {
  return {
    legalName: company?.legalName || "Comprehensive Cleaning Pty Ltd",
    location: company?.location || "Mandurah, Western Australia",
    email: company?.email || "compclean@outlook.com",
    phone: company?.phone || "+61 407 389 985",
    address: company?.address || "PO Box 6210, Mandurah North, WA 6210",
    logo: company?.logo || "/logo.png",
  };
}

export function billTo(invoice, client) {
  return {
    name: client?.name || invoice?.clientName || "Account",
    contact: client?.contactName || "",
    suburb: client?.suburb || "",
    email: client?.email || "",
    phone: client?.phone || "",
  };
}

export function formatInvoiceMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatInvoiceDate(value) {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function invoiceTone(status) {
  const tone = { Draft: "muted", Sent: "wait", Paid: "ok", Overdue: "bad" }[status] || "wait";
  return `stage-pill ${tone}`;
}

export function lineFor(invoice) {
  const note = String(invoice?.notes || "").trim();
  const who = invoice?.clientName ? ` for ${invoice.clientName}` : "";
  return {
    title: `Commercial cleaning${who}`,
    detail: note || "Services for this account.",
    amount: Number(invoice?.amount) || 0,
  };
}

function pdfText(value) {
  return String(value ?? "")
    .replaceAll("\u2014", "-")
    .replaceAll("\u2013", "-")
    .replaceAll("\u2018", "'")
    .replaceAll("\u2019", "'")
    .replaceAll("\u201c", '"')
    .replaceAll("\u201d", '"')
    .replaceAll("\u00b7", "|")
    .replace(/[^\x20-\x7E]/g, "");
}

function esc(value) {
  return pdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
    .map((channel) => channel.toFixed(3))
    .join(" ");
}

function num(value) {
  return (Math.round(value * 100) / 100).toString();
}

function textWidth(value, size, bold) {
  const scale = (bold ? 1.08 : 1) * size / 1000;
  let width = 0;
  for (const ch of pdfText(value)) width += (WIDTHS[ch] || 520) * scale;
  return width;
}

function wrap(value, width, size, bold) {
  const words = pdfText(value).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [];
  let current = "";
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (current && textWidth(trial, size, bold) > width) {
      lines.push(current);
      current = word;
    } else {
      current = trial;
    }
  }
  if (current) lines.push(current);
  return lines;
}

class Page {
  constructor() {
    this.ops = [];
  }

  fill(hex) {
    this.ops.push(`${rgb(hex)} rg`);
  }

  rect(x, y, w, h) {
    this.ops.push(`${num(x)} ${num(y)} ${num(w)} ${num(h)} re f`);
  }

  stroke(x, y, w, h, hex) {
    this.ops.push(`${rgb(hex)} RG 0.8 w ${num(x)} ${num(y)} ${num(w)} ${num(h)} re S`);
  }

  rule(x1, x2, y, hex) {
    this.ops.push(`${rgb(hex)} RG 0.8 w ${num(x1)} ${num(y)} m ${num(x2)} ${num(y)} l S`);
  }

  text(font, size, x, y, value, hex) {
    const safe = esc(value);
    if (!safe) return;
    this.ops.push(`BT ${rgb(hex)} rg /${font} ${num(size)} Tf 1 0 0 1 ${num(x)} ${num(y)} Tm (${safe}) Tj ET`);
  }

  textRight(font, size, right, y, value, hex, bold) {
    this.text(font, size, right - textWidth(value, size, bold), y, value, hex);
  }

  image(x, y, w, h) {
    this.ops.push(`q ${num(w)} 0 0 ${num(h)} ${num(x)} ${num(y)} cm /Im1 Do Q`);
  }

  toString() {
    return this.ops.join("\n");
  }
}

function fromTop(distance, height = 0) {
  return PAGE_H - distance - height;
}

function partyLines(party, kind) {
  if (kind === "from") return [party.legalName, party.address, party.location, party.phone, party.email].filter(Boolean);
  return [party.name, party.contact, party.suburb, party.email, party.phone].filter(Boolean);
}

export function buildInvoicePdf({ invoice, client, company, image }) {
  const issuer = issuerOf(company);
  const bill = billTo(invoice, client);
  const line = lineFor(invoice);
  const page = new Page();
  const amount = formatInvoiceMoney(line.amount);
  const status = invoice.status || "Draft";

  page.fill("#1c74d6");
  page.rect(0, 0, 7, PAGE_H);

  const logoH = image ? 48 : 0;
  const logoW = image ? Math.min(210, logoH * (image.width / image.height)) : 0;
  const drawnH = image ? logoW * (image.height / image.width) : 0;
  if (image) page.image(LEFT, fromTop(30, drawnH), logoW, drawnH);

  page.textRight("F1", 10, RIGHT, fromTop(42), "INVOICE", "#1c74d6", false);
  page.textRight("F2", 20, RIGHT, fromTop(68), invoice.number || "Invoice", "#142033", true);

  const chip = status.toUpperCase();
  const chipW = textWidth(chip, 8, true) + 16;
  const chipY = fromTop(90, 16);
  page.fill(STATUS_FILL[status] || STATUS_FILL.Draft);
  page.rect(RIGHT - chipW, chipY, chipW, 16);
  page.text("F2", 8, RIGHT - chipW + 8, chipY + 4.5, chip, STATUS_INK[status] || STATUS_INK.Draft);

  page.rule(LEFT, RIGHT, fromTop(112), "#efe8dc");

  page.text("F2", 8, LEFT, fromTop(132), "FROM", "#6a6256");
  page.text("F2", 8, 310, fromTop(132), "BILL TO", "#6a6256");

  const fromLines = partyLines(issuer, "from");
  const toLines = partyLines(bill, "to");
  fromLines.forEach((entry, index) => {
    page.text(index === 0 ? "F2" : "F1", index === 0 ? 12 : 10, LEFT, fromTop(150 + index * 14), entry, index === 0 ? "#142033" : "#6a6256");
  });
  toLines.forEach((entry, index) => {
    page.text(index === 0 ? "F2" : "F1", index === 0 ? 12 : 10, 310, fromTop(150 + index * 14), entry, index === 0 ? "#142033" : "#6a6256");
  });

  const block = Math.max(fromLines.length, toLines.length, 1);
  let cursor = 158 + block * 14;

  const boxes = [
    ["ISSUED", formatInvoiceDate(invoice.issuedOn)],
    ["DUE", formatInvoiceDate(invoice.dueOn)],
    ["STATUS", status],
  ];
  const gap = 8;
  const boxW = (RIGHT - LEFT - gap * 2) / 3;
  boxes.forEach((entry, index) => {
    const x = LEFT + index * (boxW + gap);
    const y = fromTop(cursor, 52);
    page.fill("#faf8f4");
    page.rect(x, y, boxW, 52);
    page.stroke(x, y, boxW, 52, "#efe8dc");
    page.text("F2", 8, x + 12, y + 32, entry[0], "#6a6256");
    page.text("F2", 11, x + 12, y + 14, entry[1], "#142033");
  });

  cursor += 74;
  page.fill("#142033");
  page.rect(LEFT, fromTop(cursor, 28), RIGHT - LEFT, 28);
  page.text("F2", 8, LEFT + 12, fromTop(cursor + 18), "DESCRIPTION", "#f6f1e6");
  page.textRight("F2", 8, RIGHT - 12, fromTop(cursor + 18), "AMOUNT", "#f6f1e6", true);

  const detailLines = wrap(line.detail, 340, 10, false).slice(0, 4);
  const rowH = 36 + detailLines.length * 13;
  cursor += 28;
  const rowTop = cursor;
  page.text("F2", 11, LEFT + 12, fromTop(cursor + 20), line.title, "#142033");
  detailLines.forEach((entry, index) => {
    page.text("F1", 10, LEFT + 12, fromTop(cursor + 36 + index * 13), entry, "#6a6256");
  });
  page.textRight("F2", 12, RIGHT - 12, fromTop(cursor + 22), amount, "#142033", true);
  page.rule(LEFT, RIGHT, fromTop(rowTop + rowH), "#efe8dc");

  cursor = rowTop + rowH + 18;
  page.fill("#142033");
  page.rect(RIGHT - 230, fromTop(cursor, 48), 230, 48);
  page.text("F1", 10, RIGHT - 216, fromTop(cursor + 29), "Total due", "#d5deea");
  page.textRight("F2", 14, RIGHT - 14, fromTop(cursor + 29), amount, "#f6f1e6", true);

  page.rule(LEFT, RIGHT, 78, "#efe8dc");
  page.text("F1", 9, LEFT, 58, `${issuer.legalName}  |  ${issuer.location}`, "#6a6256");
  page.text("F1", 9, LEFT, 44, `Pay by the due date and quote ${invoice.number || "this invoice"} with the payment.`, "#6a6256");
  const contact = [issuer.phone, issuer.email].filter(Boolean).join("  |  ");
  if (contact) page.text("F1", 9, LEFT, 30, contact, "#6a6256");

  return assemblePdf(page.toString(), image);
}

function assemblePdf(stream, image) {
  const encoder = new TextEncoder();
  const ascii = (value) => encoder.encode(value);
  const content = ascii(stream);
  const parts = [];
  const offsets = [0];
  let cursor = 0;

  function add(bytes) {
    parts.push(bytes);
    cursor += bytes.length;
  }

  function addObject(body) {
    offsets.push(cursor);
    add(ascii(`${offsets.length - 1} 0 obj\n`));
    add(typeof body === "string" ? ascii(body) : body);
    add(ascii("\nendobj\n"));
  }

  add(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xff, 0xff, 0xff, 0xff, 0x0a]));
  addObject("<< /Type /Catalog /Pages 2 0 R >>");
  addObject("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  const resources = image
    ? "<< /Font << /F1 5 0 R /F2 6 0 R >> /XObject << /Im1 7 0 R >> >>"
    : "<< /Font << /F1 5 0 R /F2 6 0 R >> >>";
  addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources ${resources} /Contents 4 0 R >>`);
  addObject(concat([
    ascii(`<< /Length ${content.length} >>\nstream\n`),
    content,
    ascii("\nendstream"),
  ]));
  addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  if (image) {
    addObject(concat([
      ascii(`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n`),
      image.bytes,
      ascii("\nendstream"),
    ]));
  }

  const startxref = cursor;
  let xref = `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    xref += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;
  add(ascii(xref));
  return concat(parts);
}

function concat(parts) {
  const size = parts.reduce((total, part) => total + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

async function loadLogo(src) {
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The logo could not be loaded."));
    image.src = src || "/logo.png";
  });
  const maxW = 640;
  const scale = Math.min(1, maxW / img.naturalWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const binary = atob(canvas.toDataURL("image/jpeg", 0.92).split(",")[1]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return { bytes, width: canvas.width, height: canvas.height };
}

export async function downloadInvoicePdf({ invoice, client, company }) {
  let image = null;
  try {
    image = await loadLogo(issuerOf(company).logo);
  } catch {
    image = null;
  }
  const bytes = buildInvoicePdf({ invoice, client, company, image });
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${String(invoice.number || "invoice").replace(/[^\w.-]+/g, "-")}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
