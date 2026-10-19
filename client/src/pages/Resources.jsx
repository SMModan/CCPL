import { Link } from "react-router-dom";
import { Arrow } from "../components/Shell";
import Page from "../components/Page";
import { pageOf, useSiteContent, useSitePath } from "../site";

export default function Resources() {
  const content = useSiteContent();
  const sitePath = useSitePath();
  const page = pageOf(content, "resources");
  return (
    <Page kicker={page.kicker} title={page.title} lede={page.lede} image={page.image} imageAlt={page.imageAlt}>
      <div className="insight-grid">
        {content.articles.map((article) => (
          <article key={article.slug}>
            <p className="kicker">{article.kicker}{article.minutes ? ` · ${article.minutes}` : ""}</p>
            <h2><Link to={sitePath(`/resources/${article.slug}`)}>{article.title}</Link></h2>
            <p>{article.lede}</p>
            <Link className="text-link" to={sitePath(`/resources/${article.slug}`)}>Read <Arrow /></Link>
          </article>
        ))}
      </div>
    </Page>
  );
}
