import { Link } from "react-router-dom";
import { Arrow } from "../components/Shell";
import Page from "../components/Page";
import { pageOf, useSiteContent, useSitePath } from "../site";

export default function Services() {
  const content = useSiteContent();
  const sitePath = useSitePath();
  const page = pageOf(content, "services");
  return (
    <Page kicker={page.kicker} title={page.title} lede={page.lede} image={page.image} imageAlt={page.imageAlt}>
      <div className="service-rows">
        {content.services.map((service, index) => (
          <Link key={service.slug} to={sitePath(`/services/${service.slug}`)} className="service-row">
            {service.image && <img src={service.image} alt="" />}
            <span>
              <small>{String(index + 1).padStart(2, "0")}</small>
              <strong>{service.name}</strong>
              <em>{service.summary}</em>
            </span>
            <b>Learn more <Arrow /></b>
          </Link>
        ))}
      </div>
    </Page>
  );
}
