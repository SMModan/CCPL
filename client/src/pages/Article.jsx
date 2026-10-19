import { Link, useParams } from "react-router-dom";
import Page from "../components/Page";
import { useSiteContent, useSitePath } from "../site";

export default function Article() {
  const { slug } = useParams();
  const content = useSiteContent();
  const sitePath = useSitePath();
  const article = content.articles.find((item) => item.slug === slug);
  if (!article) {
    return (
      <Page titleLeads kicker={content.labels.missingGuideKicker || content.labels.navResources} title={content.labels.missingGuideTitle || "That note is not on the site"}>
        <Link className="text-link" to={sitePath("/resources")}>{content.labels.missingGuideLink || "Back to resources"}</Link>
      </Page>
    );
  }
  return (
    <Page titleLeads kicker={`${article.kicker}${article.minutes ? ` · ${article.minutes}` : ""}`} title={article.title} lede={article.lede} image={article.image} imageAlt={article.title}>
      <div className="prose">
        {article.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <Link className="text-link" to={sitePath("/contact")}>{content.labels.navCta}</Link>
      </div>
    </Page>
  );
}
