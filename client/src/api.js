export function getToken() {
  return sessionStorage.getItem("cc-token") || "";
}

export function setToken(token) {
  if (token) sessionStorage.setItem("cc-token", token);
  else sessionStorage.removeItem("cc-token");
}

export function publishSiteChange() {
  localStorage.setItem("cc-site-updated", String(Date.now()));
  window.dispatchEvent(new Event("cc-site-updated"));
}

export async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;
  const response = await fetch(path, {
    method,
    headers,
    cache: "no-store",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }
  if (response.status === 401 && auth) setToken("");
  if (!response.ok) throw new Error(data?.error || "Request failed.");
  return data;
}

export async function uploadImage(file) {
  const body = new FormData();
  body.append("image", file);
  const response = await fetch("/api/uploads", {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body,
  });
  const data = await response.json().catch(() => null);
  if (response.status === 401) setToken("");
  if (!response.ok) throw new Error(data?.error || "The image could not be uploaded.");
  return data;
}

export async function uploadSlide(file, fields) {
  const body = new FormData();
  Object.entries(fields).forEach(([key, value]) => body.append(key, value));
  body.append("image", file);
  const response = await fetch("/api/slides", {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body,
  });
  const data = await response.json().catch(() => null);
  if (response.status === 401) setToken("");
  if (!response.ok) throw new Error(data?.error || "The slider photograph could not be added.");
  return data;
}

export async function replaceSlideImage(id, file) {
  const body = new FormData();
  body.append("image", file);
  const response = await fetch(`/api/slides/${id}/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body,
  });
  const data = await response.json().catch(() => null);
  if (response.status === 401) setToken("");
  if (!response.ok) throw new Error(data?.error || "The slider photograph could not be replaced.");
  return data;
}

export async function uploadPartner(file, fields) {
  const body = new FormData();
  Object.entries(fields).forEach(([key, value]) => body.append(key, value));
  body.append("image", file);
  const response = await fetch("/api/partners", {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body,
  });
  const data = await response.json().catch(() => null);
  if (response.status === 401) setToken("");
  if (!response.ok) throw new Error(data?.error || "The partner logo could not be added.");
  return data;
}

export async function uploadGallery(file, fields) {
  const body = new FormData();
  Object.entries(fields).forEach(([key, value]) => body.append(key, value));
  body.append("image", file);
  const response = await fetch("/api/gallery", {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body,
  });
  const data = await response.json().catch(() => null);
  if (response.status === 401) setToken("");
  if (!response.ok) throw new Error(data?.error || "The photograph could not be added.");
  return data;
}

export async function downloadCsv() {
  const response = await fetch("/api/leads/export.csv", {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!response.ok) throw new Error("The export did not complete.");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "comprehensive-cleaning-leads.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
