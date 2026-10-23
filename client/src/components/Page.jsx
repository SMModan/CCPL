import { usePageMeta } from "../site";

export default function Page({ kicker, title, lede, image, imageAlt = "", titleLeads = false, children }) {
  usePageMeta(title, lede);
  return (
    <article className="sheet">
      <header className={titleLeads ? "page-hero title-leads" : "page-hero"}>
        <div className={image ? "wrap page-hero-grid" : "wrap page-hero-copy"}>
          <div data-reveal>
            {kicker && <p className="kicker">{kicker}</p>}
            <h1>{title}</h1>
            {lede && <p className="lede">{lede}</p>}
          </div>
          {image && <img className="page-hero-photo" src={image} alt={imageAlt} />}
        </div>
      </header>
      <div className="wrap sheet-body">{children}</div>
    </article>
  );
}
