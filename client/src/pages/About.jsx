import Page from "../components/Page";
import { pageOf, useSiteContent } from "../site";

export default function About() {
  const page = pageOf(useSiteContent(), "about");
  return (
    <Page kicker={page.kicker} title={page.title} lede={page.lede} image={page.image} imageAlt={page.imageAlt}>
      <div className="prose">
        {page.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
    </Page>
  );
}
