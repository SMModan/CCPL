import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";

export function useSiteContent() {
  return useOutletContext().content;
}

export function useSitePath() {
  const { base = "" } = useOutletContext();
  return (path = "/") => {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    if (normalized === "/") return base || "/";
    return `${base}${normalized}`;
  };
}

export function pageOf(content, slug) {
  return content.pages?.[slug] || {
    kicker: "",
    title: "",
    lede: "",
    image: "",
    imageAlt: "",
    paragraphs: [],
  };
}

export function telHref(phone = "") {
  const digits = String(phone).replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

export function crmHref() {
  return "/crm";
}

export function usePageMeta(title, description) {
  const { content } = useOutletContext();
  const name = content?.company?.legalName || "Comprehensive Cleaning";
  useEffect(() => {
    document.title = title ? `${title} · ${name}` : name;
    const tag = document.querySelector('meta[name="description"]');
    if (tag && description) tag.setAttribute("content", description);
  }, [title, description, name]);
}

export function fillCopy(text, company = {}, extra = {}) {
  const title = company.principalTitle ? `, ${company.principalTitle}` : "";
  return String(text || "")
    .replaceAll("{{legalName}}", company.legalName || "")
    .replaceAll("{{email}}", extra.email || company.email || "")
    .replaceAll("{{principal}}", company.principal || "")
    .replaceAll("{{principalTitle}}", title)
    .replaceAll("{{phone}}", company.phone || "")
    .replaceAll("{{address}}", company.address || "")
    .replaceAll("{{location}}", company.location || "")
    .replaceAll("{{ref}}", extra.ref || "");
}

const BUILT_IN_PAGES = new Set([
  "about", "approach", "contact", "services", "training", "gallery", "resources", "privacy", "terms", "capability", "thank-you",
]);

export function extraPages(content) {
  return Object.values(content?.pages || {}).filter((page) => page?.slug && page.title && !BUILT_IN_PAGES.has(page.slug));
}

export function emphasise(text) {
  const value = String(text || "").trim();
  const words = value.split(/\s+/);
  if (words.length < 5) return value;
  return {
    head: words.slice(0, -3).join(" "),
    tail: words.slice(-3).join(" "),
  };
}
