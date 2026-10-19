import Page from "../components/Page";
import { fillCopy, useSiteContent } from "../site";

function RichParagraph({ text, email }) {
  if (!email || !String(text).includes(email)) return <p>{text}</p>;
  const [before, after] = String(text).split(email);
  return <p>{before}<a href={`mailto:${email}`}>{email}</a>{after}</p>;
}

export default function Legal({ kind }) {
  const { company, pages } = useSiteContent();
  const page = pages?.[kind] || { kicker: "", title: "", lede: "", paragraphs: [] };
  const fallback = kind === "privacy" ? "Privacy" : "Terms";
  return (
    <Page kicker={page.kicker || fallback} title={page.title || fallback} lede={fillCopy(page.lede, company)} image={page.image} imageAlt={page.imageAlt}>
      <div className="prose">
        {page.paragraphs.map((paragraph) => (
          <RichParagraph key={paragraph} text={fillCopy(paragraph, company)} email={company.email} />
        ))}
        {page.paragraphs.length === 0 && (
          <p>This page will be published when the company supplies the text.</p>
        )}
      </div>
    </Page>
  );
}
