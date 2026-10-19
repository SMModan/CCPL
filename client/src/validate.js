export function blank(value) {
  return !String(value ?? "").trim();
}

export function emailOk(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export function websiteOk(value) {
  const text = String(value ?? "").trim();
  if (!text) return true;
  return /^https?:\/\//i.test(text);
}

export function moneyOk(value) {
  if (value === "" || value == null) return false;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0;
}

export function hasProblems(errors) {
  return Object.keys(errors).length > 0;
}

export function drop(errors, key) {
  if (!errors[key]) return errors;
  const next = { ...errors };
  delete next[key];
  return next;
}
