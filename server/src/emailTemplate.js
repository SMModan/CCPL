const SITE = "https://comprehensivecleaning.au";
const LOGO = `${SITE}/logo.png`;
const PHONE = "0400 791 933";
const PHONE_HREF = "tel:0400791933";
const INBOX = "info@comprehensivecleaning.au";

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function block(value) {
  return esc(value).replace(/\n/g, "<br>");
}

function shell({ kicker, title, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f6f4ef;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border-collapse:separate;">
          <tr>
            <td style="background:#082868;height:8px;font-size:0;line-height:0;border-radius:14px 14px 0 0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:22px 28px 8px;">
              <img src="${LOGO}" alt="Comprehensive Cleaning" width="188" style="display:block;border:0;width:188px;max-width:70%;height:auto;">
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:8px 28px 28px;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#142033;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#082868;">${esc(kicker)}</p>
              <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;font-weight:700;letter-spacing:-0.03em;color:#142033;">${esc(title)}</h1>
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 8px 0;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;color:#5c6b7a;">
              Comprehensive Cleaning Pty Ltd · Perth, Western Australia<br>
              <a href="${PHONE_HREF}" style="color:#082868;text-decoration:none;">${PHONE}</a>
              &nbsp;·&nbsp;
              <a href="mailto:${INBOX}" style="color:#082868;text-decoration:none;">${INBOX}</a><br>
              <a href="${SITE}" style="color:#082868;text-decoration:none;">comprehensivecleaning.au</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function referenceBox(reference) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;border-collapse:separate;">
    <tr>
      <td style="background:#f6f4ef;border:1px solid #e4e0d8;border-radius:12px;padding:14px 18px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#082868;">Reference</div>
        <div style="margin-top:4px;font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#142033;">${esc(reference)}</div>
      </td>
    </tr>
  </table>`;
}

export function acknowledgementEmail({ reference, contactName }) {
  const name = contactName || "there";
  const subject = `We have your enquiry ${reference}`;
  const text = [
    `Hello ${name},`,
    "",
    "Thank you for contacting Comprehensive Cleaning. We have your request for a site assessment.",
    `Your reference is ${reference}.`,
    "",
    "A person will read the facility details and contact you. This email is not a quote.",
    "",
    "Comprehensive Cleaning Pty Ltd",
    "Perth, Western Australia",
    PHONE,
    INBOX,
  ].join("\n");
  const html = shell({
    kicker: "Site assessment",
    title: "We have your request.",
    body: `
      <p style="margin:0;font-size:16px;line-height:1.6;color:#142033;">Hello ${esc(name)},</p>
      <p style="margin:12px 0 0;font-size:16px;line-height:1.6;color:#5c6b7a;">Thank you for contacting Comprehensive Cleaning. We have your request for a site assessment. A person will read the facility details and contact you. This email is not a quote.</p>
      ${referenceBox(reference)}
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#082868;">What happens next</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;border-top:1px solid #e4e0d8;font-size:15px;line-height:1.5;color:#142033;"><strong style="color:#082868;">01</strong>&nbsp;&nbsp;We read the facility details.</td></tr>
        <tr><td style="padding:8px 0;border-top:1px solid #e4e0d8;font-size:15px;line-height:1.5;color:#142033;"><strong style="color:#082868;">02</strong>&nbsp;&nbsp;We contact you to arrange a walk-through.</td></tr>
        <tr><td style="padding:8px 0;border-top:1px solid #e4e0d8;border-bottom:1px solid #e4e0d8;font-size:15px;line-height:1.5;color:#142033;"><strong style="color:#082868;">03</strong>&nbsp;&nbsp;The scope and the price follow that visit.</td></tr>
      </table>
      <p style="margin:18px 0 0;font-size:14px;line-height:1.5;color:#5c6b7a;">Keep the reference if you need to follow the enquiry up.</p>
    `,
  });
  return { subject, text, html };
}

function detailRow(label, value) {
  if (!String(value || "").trim()) return "";
  return `<tr>
    <td style="padding:10px 0;border-top:1px solid #e4e0d8;width:120px;font-size:13px;font-weight:700;color:#5c6b7a;vertical-align:top;">${esc(label)}</td>
    <td style="padding:10px 0;border-top:1px solid #e4e0d8;font-size:15px;line-height:1.5;color:#142033;">${block(value)}</td>
  </tr>`;
}

export function enquiryNoticeEmail({ reference, contactName, companyName, email, phone, service, serviceWindow, facility, notes }) {
  const subject = `New enquiry ${reference}`;
  const lines = [
    `New website enquiry ${reference}`,
    "",
    `Name: ${contactName}`,
    companyName ? `Company: ${companyName}` : "",
    email ? `Email: ${email}` : "",
    phone ? `Phone: ${phone}` : "",
    service ? `Service: ${service}` : "",
    serviceWindow ? `Window: ${serviceWindow}` : "",
    facility ? `Facility: ${facility}` : "",
    notes ? `\n${notes}` : "",
  ].filter((line) => line !== "");
  const text = lines.join("\n");
  const reply = email
    ? `<p style="margin:22px 0 0;"><a href="mailto:${esc(email)}?subject=${encodeURIComponent(`Re: site assessment ${reference}`)}" style="display:inline-block;background:#082868;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 18px;border-radius:10px;">Reply to ${esc(contactName || "the enquiry")}</a></p>`
    : "";
  const html = shell({
    kicker: "Website enquiry",
    title: "New site assessment request",
    body: `
      ${referenceBox(reference)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #e4e0d8;">
        ${detailRow("Name", contactName)}
        ${detailRow("Company", companyName)}
        ${detailRow("Email", email)}
        ${detailRow("Phone", phone)}
        ${detailRow("Service", service)}
        ${detailRow("Window", serviceWindow)}
        ${detailRow("Facility", facility)}
        ${detailRow("Notes", notes)}
      </table>
      ${reply}
    `,
  });
  return { subject, text, html };
}
