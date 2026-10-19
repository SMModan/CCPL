import { Link } from "react-router-dom";
import { usePageMeta, useSitePath } from "../site";

export default function Page({ kicker, title, lede, image, imageAlt = "", children }) {
  const sitePath = useSitePath();
  usePageMeta(title, lede);
  return (
    <article className="sheet">
      <header className={image ? "page-banner has-photo" : "page-banner"} style={image ? { backgroundImage: `url("${image}")` } : undefined}>
        <div className="wrap" data-reveal>
          <p className="crumbs">
            <Link to={sitePath("/")}>Home</Link>
            <span aria-hidden="true">/</span>
            <span>{kicker || title}</span>
          </p>
          {kicker && <p className="kicker">{kicker}</p>}
          <h1>{title}</h1>
          {lede && <p className="lede">{lede}</p>}
          {imageAlt && <span className="sr">{imageAlt}</span>}
        </div>
      </header>
      <div className="wrap sheet-body">{children}</div>
    </article>
  );
}
