import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#7460ee", "#2962FF", "#4fc3f7", "#36bea6", "#fb8c00", "#f62d51", "#26c6da", "#414755"];

const STAGE_COLOR = {
  New: "#7460ee",
  Contacted: "#2962FF",
  Qualified: "#4fc3f7",
  "Site Assessment": "#26c6da",
  "Proposal / Quote": "#36bea6",
  Won: "#00c292",
  Lost: "#f62d51",
  "Not Suitable": "#b0bec5",
};

const NAMED_COLOR = {
  Open: "#7460ee",
  Closed: "#4fc3f7",
};

const axisTick = { fill: "#8392a5", fontSize: 12 };
const categoryTick = { fill: "#3e5569", fontSize: 13 };

function ChartEmpty({ text }) {
  return (
    <div className="chart-empty">
      <span>{text}</span>
    </div>
  );
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const count = Number(item.value) || 0;
  const title = label || item.name;
  return (
    <div className="chart-tip">
      <strong>{title}</strong>
      <span>{count} {count === 1 ? "lead" : "leads"}</span>
    </div>
  );
}

function shortLabel(label) {
  return label
    .replace(" cleaning", "")
    .replace("More than one of these", "More than one")
    .replace("After production / night", "After production")
    .replace("One-off or periodic", "One-off");
}

function stageName(label) {
  return {
    "Site Assessment": "Assessment",
    "Proposal / Quote": "Proposal",
    "Not Suitable": "Unsuitable",
  }[label] || label;
}

function weekCounts(leads) {
  const rows = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let index = 7; index >= 0; index -= 1) {
    const start = new Date(today);
    start.setDate(today.getDate() - index * 7);
    rows.push({
      start,
      label: start.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
      count: 0,
    });
  }
  for (const lead of leads) {
    const created = new Date(lead.createdAt);
    if (Number.isNaN(created.getTime()) || created < rows[0].start) continue;
    for (let index = rows.length - 1; index >= 0; index -= 1) {
      if (created >= rows[index].start) {
        rows[index].count += 1;
        break;
      }
    }
  }
  return rows;
}

export function Columns({ rows, label }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (!total) return <ChartEmpty text="No leads in the pipeline yet" />;
  const data = rows.map((row) => ({ name: stageName(row.label), stage: row.label, Leads: row.count }));
  return (
    <div className="chart-frame tall" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 8, left: -12, bottom: 4 }} barCategoryGap="28%">
          <CartesianGrid stroke="#edf1f5" vertical={false} />
          <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} interval={0} />
          <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={36} />
          <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(116, 96, 238, 0.06)" }} />
          <Bar dataKey="Leads" radius={[8, 8, 0, 0]} maxBarSize={42}>
            {data.map((row) => (
              <Cell key={row.stage} fill={STAGE_COLOR[row.stage] || "#7460ee"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Ring({ rows, center, caption }) {
  const shown = rows.filter((row) => row.count > 0);
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (!total) return <ChartEmpty text="No leads yet" />;
  const data = shown.map((row) => ({ name: shortLabel(row.label), value: row.count }));
  return (
    <div className="donut" role="img" aria-label={shown.map((row) => `${shortLabel(row.label)} ${row.count}`).join(", ")}>
      <div className="donut-plot">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={data.length > 1 ? 3 : 0}
              cornerRadius={data.length > 1 ? 8 : 0}
              stroke="#fff"
              strokeWidth={3}
            >
              {data.map((row, index) => (
                <Cell key={row.name} fill={NAMED_COLOR[row.name] || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <strong>{center}</strong>
          <span>{caption}</span>
        </div>
      </div>
      <ul className="legend">
        {data.map((row, index) => (
          <li key={row.name}>
            <i style={{ background: NAMED_COLOR[row.name] || COLORS[index % COLORS.length] }} />
            <span>{row.name}</span>
            <strong>{row.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Bars({ rows, label }) {
  const active = rows.filter((row) => row.count > 0);
  if (!active.length) return <ChartEmpty text="No leads yet" />;
  const data = active.map((row) => ({ name: shortLabel(row.label), Leads: row.count }));
  const height = Math.max(260, data.length * 46);
  return (
    <div className="chart-frame" style={{ height }} role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid stroke="#edf1f5" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={156} tick={categoryTick} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(116, 96, 238, 0.06)" }} />
          <Bar dataKey="Leads" radius={[0, 8, 8, 0]} maxBarSize={18}>
            {data.map((row, index) => (
              <Cell key={row.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeekChart({ leads }) {
  const rows = useMemo(() => weekCounts(leads), [leads]);
  if (rows.every((row) => row.count === 0)) {
    return <ChartEmpty text="No new leads in the last eight weeks" />;
  }
  return (
    <div className="chart-frame tall" role="img" aria-label="New leads over the last eight weeks">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="lead-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7460ee" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#7460ee" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#edf1f5" vertical={false} />
          <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={36} />
          <Tooltip content={<ChartTip />} />
          <Area
            type="monotone"
            dataKey="count"
            name="New leads"
            stroke="#7460ee"
            strokeWidth={3}
            fill="url(#lead-area)"
            dot={{ r: 5, stroke: "#7460ee", strokeWidth: 2, fill: "#fff" }}
            activeDot={{ r: 7, stroke: "#7460ee", strokeWidth: 2, fill: "#fff" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
