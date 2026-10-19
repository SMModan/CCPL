import { useOutletContext } from "react-router-dom";
import Option2Page from "../option2/Page";
import { usePageMeta } from "../site";

export default function Page(props) {
  const { design } = useOutletContext();
  if (design === "option2") return <Option2Page {...props} />;
  return <ClassicPage {...props} />;
}

function ClassicPage({ kicker, title, lede, image, imageAlt = "", titleLeads = false, children }) {
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
