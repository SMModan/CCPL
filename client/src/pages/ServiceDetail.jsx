import { Link, useParams } from "react-router-dom";
import EnquiryForm from "../components/EnquiryForm";
import Page from "../components/Page";
import { useSiteContent, useSitePath } from "../site";

export default function ServiceDetail() {
  const { slug } = useParams();
  const content = useSiteContent();
  const sitePath = useSitePath();
  const { labels } = content;
  const service = content.services.find((item) => item.slug === slug);
  if (!service) {
    return (
      <Page titleLeads kicker={labels.missingServiceKicker || labels.navServices} title={labels.missingServiceTitle || "That service is not listed"}>
        <Link className="text-link" to={sitePath("/services")}>{labels.missingServiceLink || "Back to services"}</Link>
      </Page>
    );
  }
  const blocks = [
    [labels.appliesTitle, service.applies],
    [labels.scopeTitle, service.scope],
    [labels.needTitle, service.need],
  ];
  return (
    <Page titleLeads kicker={labels.navServices} title={service.name} lede={service.summary} image={service.image} imageAlt={service.name}>
      <div className="trio">
        {blocks.map(([title, items]) => (
          <section key={title}>
            <h2>{title}</h2>
            <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
        ))}
      </div>
      <section className="quote flat">
        <div className="quote-intro">
          <h2>{labels.serviceAskTitle}</h2>
          <p>{labels.serviceAskText}</p>
        </div>
        <div className="quote-card">
          <EnquiryForm defaultService={service.name} />
        </div>
      </section>
    </Page>
  );
}
