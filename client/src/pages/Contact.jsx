import EnquiryForm from "../components/EnquiryForm";
import Page from "../components/Page";
import { pageOf, telHref, useSiteContent } from "../site";

export default function Contact() {
  const content = useSiteContent();
  const page = pageOf(content, "contact");
  const { company } = content;
  return (
    <Page kicker={page.kicker} title={page.title} lede={page.lede} image={page.image} imageAlt={page.imageAlt}>
      <div className="quote flat">
        <div className="quote-intro">
          {company.principal?.trim() && (
            <p className="who">{company.principal.trim()}{company.principalTitle ? `, ${company.principalTitle.trim()}` : ""}</p>
          )}
          <p>{company.legalName}</p>
          {company.phone && <p><a href={telHref(company.phone)}>{company.phone}</a></p>}
          {company.email && <p><a href={`mailto:${company.email}`}>{company.email}</a></p>}
          {company.address && <p>{company.address}</p>}
          {company.location && <p>{company.location}</p>}
          {page.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        <div className="quote-card">
          <EnquiryForm />
        </div>
      </div>
    </Page>
  );
}
