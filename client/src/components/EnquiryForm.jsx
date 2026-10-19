import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WINDOWS } from "../../../shared/pipeline.js";
import { api } from "../api";
import { useSiteContent, useSitePath } from "../site";
import { blank, drop, emailOk, hasProblems } from "../validate";

export default function EnquiryForm({ compact = false, defaultService = "" }) {
  const navigate = useNavigate();
  const sitePath = useSitePath();
  const content = useSiteContent();
  const labels = content.labels || {};
  const extras = Array.isArray(labels.extraServices) && labels.extraServices.length
    ? labels.extraServices
    : ["More than one of these", "Not sure yet"];
  const serviceOptions = [
    ...content.services.map((service) => service.name),
    ...extras.filter((item) => !content.services.some((service) => service.name === item)),
  ];
  const [form, setForm] = useState({
    contactName: "",
    companyName: "",
    email: "",
    phone: "",
    facilityDetails: "",
    service: defaultService,
    serviceWindow: "",
    message: "",
    companyWebsite: "",
  });
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => drop(current, key));
  }

  function enquiryErrors() {
    const found = {};
    if (blank(form.contactName)) found.contactName = "Enter a contact name.";
    if (blank(form.service)) found.service = "Choose a service.";
    if (blank(form.email) && blank(form.phone)) {
      found.email = "Add an email address or a phone number.";
      found.phone = "Add an email address or a phone number.";
    } else if (!blank(form.email) && !emailOk(form.email)) {
      found.email = "That email address does not look right.";
    }
    return found;
  }

  async function onSubmit(event) {
    event.preventDefault();
    const found = enquiryErrors();
    setErrors(found);
    setError("");
    if (hasProblems(found)) return;
    setSending(true);
    try {
      const result = await api("/api/enquiries", { method: "POST", body: form });
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "site_assessment_request", reference: result.reference });
      navigate(`${sitePath("/thank-you")}?ref=${encodeURIComponent(result.reference)}&email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setError(err.message);
      setSending(false);
    }
  }

  return (
    <form className={compact ? "enquiry compact" : "enquiry"} noValidate onSubmit={onSubmit}>
      <div className="hp" aria-hidden="true">
        <label>
          Company website
          <input tabIndex={-1} autoComplete="off" value={form.companyWebsite} onChange={(event) => set("companyWebsite", event.target.value)} />
        </label>
      </div>
      <div className="grid-2">
        <Field label={labels.formContact || "Contact name"} value={form.contactName} onChange={(value) => set("contactName", value)} required error={errors.contactName} autoComplete="name" />
        <Field label={labels.formCompany || "Company"} value={form.companyName} onChange={(value) => set("companyName", value)} autoComplete="organization" />
        <Field label={labels.formEmail || "Email"} type="email" value={form.email} onChange={(value) => set("email", value)} error={errors.email} autoComplete="email" />
        <Field label={labels.formPhone || "Phone"} type="tel" value={form.phone} onChange={(value) => set("phone", value)} error={errors.phone} autoComplete="tel" />
      </div>
      <label className={errors.service ? "is-invalid" : undefined}>
        <span>{labels.formService || "Service"} *</span>
        <select className={errors.service ? "is-invalid" : undefined} value={form.service} onChange={(event) => set("service", event.target.value)} aria-invalid={errors.service ? "true" : undefined}>
          <option value="">{labels.formSelect || "Select a service"}</option>
          {serviceOptions.map((service) => (
            <option key={service}>{service}</option>
          ))}
        </select>
        {errors.service && <small>{errors.service}</small>}
      </label>
      <label>
        {labels.formWindow || "Preferred service window"}
        <select value={form.serviceWindow} onChange={(event) => set("serviceWindow", event.target.value)}>
          <option value="">{labels.formWindowEmpty || "Not sure yet"}</option>
          {WINDOWS.map((window) => (
            <option key={window}>{window}</option>
          ))}
        </select>
      </label>
      <label>
        {labels.formFacility || "Facility details"}
        <textarea rows={compact ? 3 : 4} value={form.facilityDetails} onChange={(event) => set("facilityDetails", event.target.value)} placeholder={labels.formFacilityHint || ""} />
      </label>
      {!compact && (
        <label>
          {labels.formNotes || "Notes"}
          <textarea rows={4} value={form.message} onChange={(event) => set("message", event.target.value)} />
        </label>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn solid" type="submit" disabled={sending}>
        {sending ? (labels.formSending || "Sending") : (labels.formButton || "Request a site assessment")}
      </button>
      <p className="fine">{labels.formFine || "Add an email or a phone number so the enquiry can be returned."}</p>
    </form>
  );
}

function Field({ label, value, onChange, type = "text", required = false, autoComplete, error }) {
  return (
    <label className={error ? "is-invalid" : undefined}>
      <span>{label}{required ? " *" : ""}</span>
      <input type={type} value={value} autoComplete={autoComplete} aria-invalid={error ? "true" : undefined} onChange={(event) => onChange(event.target.value)} />
      {error && <small>{error}</small>}
    </label>
  );
}
