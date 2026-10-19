import { Link } from "react-router-dom";
import { Arrow } from "../components/Shell";
import Page from "../components/Page";
import { pageOf, useSiteContent, useSitePath } from "../site";

export default function Approach() {
  const content = useSiteContent();
  const sitePath = useSitePath();
  const page = pageOf(content, "approach");
  const [heading, ...points] = page.paragraphs;
  return (
    <Page kicker={page.kicker} title={page.title} lede={page.lede} image={page.image} imageAlt={page.imageAlt}>
      <ol className="method-steps tall">
        {content.steps.map((step) => (
          <li key={step.n}>
            <span>{step.n}</span>
            <strong>{step.title}</strong>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
      {points.length > 0 && (
        <section className="note-block">
          <h2>{heading}</h2>
          <ul>{points.map((item) => <li key={item}>{item}</li>)}</ul>
          <Link className="btn solid" to={sitePath("/contact")}>{content.labels.navCta} <Arrow /></Link>
        </section>
      )}
    </Page>
  );
}
