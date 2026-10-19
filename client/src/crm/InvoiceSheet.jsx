import { useEffect, useState } from "react";
import { api } from "../api";
import {
  billTo,
  downloadInvoicePdf,
  formatInvoiceDate,
  formatInvoiceMoney,
  invoiceTone,
  issuerOf,
  lineFor,
} from "./invoiceDoc";

function Svg({ children, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export function DocumentIcon() {
  return (
    <Svg>
      <path d="M14 3H7.5A1.5 1.5 0 0 0 6 4.5v15A1.5 1.5 0 0 0 7.5 21h9a1.5 1.5 0 0 0 1.5-1.5V8L14 3z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </Svg>
  );
}

export function DownloadIcon({ size = 16 }) {
  return (
    <Svg size={size}>
      <path d="M12 4v10" />
      <path d="m7.5 11.5 4.5 4.5 4.5-4.5" />
      <path d="M5 20h14" />
    </Svg>
  );
}

function CalendarIcon() {
  return (
    <Svg size={14}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3.5v3" />
      <path d="M16 3.5v3" />
      <path d="M4 10h16" />
    </Svg>
  );
}

function BuildingIcon() {
  return (
    <Svg size={14}>
      <path d="M4 20V7l8-3 8 3v13" />
      <path d="M9 20v-5h6v5" />
      <path d="M4 20h16" />
    </Svg>
  );
}

export function useIssuer() {
  const [company, setCompany] = useState(() => issuerOf(null));
  useEffect(() => {
    let gone = false;
    api("/api/content")
      .then((payload) => {
        if (!gone) setCompany(issuerOf(payload?.company));
      })
      .catch(() => {});
    return () => {
      gone = true;
    };
  }, []);
  return company;
}

export function InvoiceActions({ invoice, client, company, onOpen, onError }) {
  async function save() {
    try {
      await downloadInvoicePdf({ invoice, client, company });
      onError?.("");
    } catch (err) {
      onError?.(err.message || "The PDF could not be saved.");
    }
  }

  return (
    <div className="invoice-actions">
      <button type="button" className="icon-btn" aria-label={`Open ${invoice.number}`} title="Open invoice" onClick={() => onOpen(invoice)}>
        <DocumentIcon />
      </button>
      <button type="button" className="icon-btn" aria-label={`Download ${invoice.number} as PDF`} title="Download PDF" onClick={save}>
        <DownloadIcon />
      </button>
    </div>
  );
}

export function InvoiceSheet({ invoice, client, company, onClose }) {
  const issuer = issuerOf(company);
  const bill = billTo(invoice, client);
  const line = lineFor(invoice);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const billLines = [bill.contact, bill.suburb, bill.email, bill.phone].filter(Boolean);
  const fromLines = [issuer.address, issuer.location, issuer.phone, issuer.email].filter(Boolean);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save() {
    setSaving(true);
    setError("");
    try {
      await downloadInvoicePdf({ invoice, client, company });
    } catch (err) {
      setError(err.message || "The PDF could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="lead-overlay" onMouseDown={onClose}>
      <div
        className="invoice-stage"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-sheet-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="invoice-toolbar">
          <button className="solid-btn icon-label" type="button" onClick={save} disabled={saving}>
            <DownloadIcon />
            {saving ? "Preparing PDF…" : "Download PDF"}
          </button>
          <button className="ghost-btn icon-label" type="button" onClick={onClose}>Close</button>
        </div>
        {error && <p className="note invoice-error">{error}</p>}
        <article className="invoice-sheet">
          <header className="invoice-head">
            <div className="invoice-brand">
              <img className="invoice-logo" src={issuer.logo} alt="" />
              <strong>{issuer.legalName}</strong>
              {fromLines.map((entry) => <span key={entry}>{entry}</span>)}
            </div>
            <div className="invoice-id">
              <p className="invoice-kicker">Invoice</p>
              <h2 id="invoice-sheet-title">{invoice.number}</h2>
              <span className={invoiceTone(invoice.status)}>{invoice.status}</span>
            </div>
          </header>

          <div className="invoice-parties">
            <section>
              <p className="invoice-label"><BuildingIcon /> Bill to</p>
              <strong>{bill.name}</strong>
              {billLines.map((entry) => <span key={entry}>{entry}</span>)}
            </section>
            <section className="invoice-dates">
              <div>
                <p className="invoice-label"><CalendarIcon /> Issued</p>
                <strong>{formatInvoiceDate(invoice.issuedOn)}</strong>
              </div>
              <div>
                <p className="invoice-label"><CalendarIcon /> Due</p>
                <strong>{formatInvoiceDate(invoice.dueOn)}</strong>
              </div>
            </section>
          </div>

          <table className="invoice-lines">
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>{line.title}</strong>
                  <div className="muted">{line.detail}</div>
                </td>
                <td>{formatInvoiceMoney(line.amount)}</td>
              </tr>
            </tbody>
          </table>

          <div className="invoice-total">
            <span>Total due</span>
            <strong>{formatInvoiceMoney(line.amount)}</strong>
          </div>

          <footer className="invoice-foot">
            <p>Pay by the due date and quote {invoice.number} with the payment.</p>
            <p>{issuer.legalName} · {issuer.location}</p>
          </footer>
        </article>
      </div>
    </div>
  );
}
