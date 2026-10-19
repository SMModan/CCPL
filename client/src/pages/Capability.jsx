import { Link } from "react-router-dom";
import Page from "../components/Page";
import { fillCopy, useSiteContent, useSitePath } from "../site";

export default function Capability() {
  const { company, services, steps, pages, labels } = useSiteContent();
  const sitePath = useSitePath();
  const page = pages?.capability || { kicker: "", title: "", lede: "", paragraphs: [] };
  const [intro, ...rest] = page.paragraphs;
  return (
    <Page
      kicker={page.kicker || "Capability"}
      title={page.title || "Capability statement"}
      lede={page.lede || company.footer}
      image={page.image}
      imageAlt={page.imageAlt}
    >
      <div className="capability">
        <p className="running">{company.legalName} · {company.location}</p>
        {intro && <p>{fillCopy(intro, company)}</p>}
        <h2>{labels.capServices}</h2>
        <div className="matrix-scroll">
          <table className="matrix">
            <thead>
              <tr>
                <th>Industry</th>
                <th>{labels.appliesTitle}</th>
                <th>{labels.scopeTitle}</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.slug}>
                  <th>
                    <Link to={sitePath(`/services/${service.slug}`)}>{service.name}</Link>
                  </th>
                  <td>
                    <ul>{service.applies.map((item) => <li key={item}>{item}</li>)}</ul>
                  </td>
                  <td>
                    <ul>{service.scope.map((item) => <li key={item}>{item}</li>)}</ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2>{labels.capApproach}</h2>
        <ol>
          {steps.map((step) => (
            <li key={step.n}><strong>{step.title}.</strong> {step.text}</li>
          ))}
        </ol>
        <h2>{labels.capAccountTitle}</h2>
        {rest.map((paragraph) => <p key={paragraph}>{fillCopy(paragraph, company)}</p>)}
        <h2>{labels.capContact}</h2>
        <p>
          {company.phone && <>{company.phone}<br /></>}
          {company.email}<br />
          {company.address}<br />
          {company.location}
        </p>
        <button className="btn solid" type="button" onClick={() => window.print()}>{labels.capPdf}</button>
      </div>
    </Page>
  );
}
