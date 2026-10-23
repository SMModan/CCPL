function marketKind(label = "") {
  const text = label.toLowerCase();
  if (text.includes("abattoir")) return "plant";
  if (text.includes("frozen") || text.includes("cold")) return "snow";
  if (text.includes("prepared") || text.includes("quality") || text.includes("convenience")) return "pack";
  return "lines";
}

function workKind(label = "") {
  const text = label.toLowerCase();
  if (text.includes("allergen") || text.includes("cross-contamination")) return "shield";
  if (text.includes("cold") || text.includes("freezer")) return "snow";
  if (text.includes("wash") || text.includes("pressure")) return "drop";
  if (text.includes("procedure") || text.includes("operating")) return "list";
  if (text.includes("audit") || text.includes("aqis")) return "check";
  if (text.includes("microbial") || text.includes("listeria") || text.includes("salmonella")) return "scope";
  if (text.includes("haccp")) return "clipboard";
  return "check";
}

function Icon({ kind }) {
  return (
    <svg className="industry-ico" viewBox="0 0 32 32" aria-hidden="true">
      {kind === "plant" && (
        <>
          <path d="M6 26V14l10-7 10 7v12" />
          <path d="M13 26v-7h6v7" />
        </>
      )}
      {kind === "snow" && (
        <>
          <path d="M16 4v24M6.5 9.5l19 13M25.5 9.5l-19 13" />
          <path d="M16 4l-2.4 3M16 4l2.4 3M16 28l-2.4-3M16 28l2.4-3" />
        </>
      )}
      {kind === "pack" && (
        <>
          <rect x="6" y="9" width="20" height="15" rx="2" />
          <path d="M6 15h20M16 9v6" />
        </>
      )}
      {kind === "clipboard" && (
        <>
          <rect x="8" y="6" width="16" height="20" rx="2" />
          <path d="M12 6h8v3h-8zM12 15h8M12 19h6" />
        </>
      )}
      {kind === "shield" && <path d="M16 5l9 4v7c0 5.5-3.8 8.6-9 10.5C10.8 24.6 7 21.5 7 16V9z" />}
      {kind === "list" && (
        <>
          <rect x="7" y="5" width="18" height="22" rx="2" />
          <path d="M11 12h10M11 17h10M11 22h6" />
        </>
      )}
      {kind === "drop" && <path d="M16 5s8 9 8 14a8 8 0 0 1-16 0c0-5 8-14 8-14z" />}
      {kind === "check" && (
        <>
          <circle cx="16" cy="16" r="10" />
          <path d="M11 16.5l3.2 3.2L21 12.5" />
        </>
      )}
      {kind === "scope" && (
        <>
          <circle cx="16" cy="16" r="7" />
          <circle cx="16" cy="16" r="2" />
          <path d="M16 4v4M16 24v4M4 16h4M24 16h4" />
        </>
      )}
      {kind === "lines" && <path d="M7 10h18M7 16h18M7 22h18" />}
    </svg>
  );
}

export default function IndustryPanels({ home, heading = "h3" }) {
  const Title = heading;
  const markets = home.industryMarkets || [];
  const notes = home.industryMarketNotes || [];
  const work = home.industryWork || [];

  return (
    <>
      {markets.length > 0 && (
        <ul className="industry-markets">
          {markets.map((item, index) => (
            <li key={item}>
              <Icon kind={marketKind(item)} />
              <span>
                <strong>{item}</strong>
                {notes[index] && <em>{notes[index]}</em>}
              </span>
            </li>
          ))}
        </ul>
      )}
      {work.length > 0 && (
        <div className="industry-work">
          <Title>{home.industryWorkTitle || "What the clean has to cover"}</Title>
          <ul>
            {work.map((item) => (
              <li key={item}>
                <Icon kind={workKind(item)} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {home.industryAlso && (
        <aside className="industry-also">
          <Title>{home.industryAlsoTitle || "Related plants"}</Title>
          <p>{home.industryAlso}</p>
        </aside>
      )}
    </>
  );
}
