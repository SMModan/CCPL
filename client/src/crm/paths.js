export const Desk = { base: "/crm", variant: "classic" };

export function crmPath(path = "") {
  const base = Desk.base || "/crm";
  if (!path) return base;
  return `${base}/${String(path).replace(/^\//, "")}`;
}
