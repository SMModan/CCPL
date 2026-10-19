import { Navigate, useParams } from "react-router-dom";
import Page from "../components/Page";
import { useSiteContent, useSitePath } from "../site";

const RESERVED = new Set([
  "services", "approach", "training", "about", "gallery", "resources", "contact",
  "privacy", "terms", "thank-you", "capability", "partners", "crm", "crm2", "option2",
]);

export default function Custom() {
  const { slug } = useParams();
  const sitePath = useSitePath();
  const page = useSiteContent().pages?.[slug];
  if (!page || RESERVED.has(slug)) return <Navigate to={sitePath("/")} replace />;
  return (
    <Page kicker={page.kicker} title={page.title} lede={page.lede} image={page.image} imageAlt={page.imageAlt}>
      <section className="prose">
        {page.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>
    </Page>
  );
}
