export default function PartnerLogos({ partners }) {
  return (
    <ul className="partner-row">
      {partners.map((partner) => {
        const logo = <img src={partner.src} alt={partner.name} />;
        return (
          <li key={`${partner.name}-${partner.src}`}>
            {partner.url ? <a href={partner.url} rel="noreferrer">{logo}</a> : logo}
          </li>
        );
      })}
    </ul>
  );
}
