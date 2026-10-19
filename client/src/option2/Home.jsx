import { Link } from "react-router-dom";
import { Arrow } from "../components/Shell";
import Certificates from "../components/Certificates";
import EnquiryForm from "../components/EnquiryForm";
import PartnerLogos from "../components/PartnerLogos";
import { telHref, usePageMeta, useSiteContent, useSitePath } from "../site";

export default function Home() {
  const content = useSiteContent();
  const sitePath = useSitePath();
  const { company, home, services, steps, labels, articles, gallery = [], categories = [], certificates = [], partners = [] } = content;
  usePageMeta(home.heroTitle, home.heroText);
  const heroPhoto = home.heroImage || gallery.find((photo) => photo.category === "food")?.src || gallery[0]?.src;
  const promiseImages = home.promiseImages?.length ? home.promiseImages : gallery.slice(0, 3).map((photo) => ({ src: photo.src, position: "center" }));

  return (
    <>
      <section className="hero" style={heroPhoto ? { backgroundImage: `url("${heroPhoto}")` } : undefined}>
        <div className="hero-shade">
          <div className="wrap hero-copy" data-reveal>
            {home.heroKicker && <p className="kicker">{home.heroKicker}</p>}
            <h1>{home.heroTitle}</h1>
            <p className="lede">{home.heroText}</p>
            <div className="actions">
              <Link className="btn solid" to={sitePath("/contact")}>{labels.heroPrimary} <Arrow /></Link>
              <Link className="btn line light" to={sitePath("/services")}>{labels.heroSecondary}</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="about-split">
        <div className="wrap about-grid">
          {(home.walkImage || heroPhoto) && (
            <div className="about-photo" data-reveal>
              <img src={home.walkImage || heroPhoto} alt={home.walkAlt || ""} />
            </div>
          )}
          <div data-reveal>
            <p className="kicker">{home.walkKicker || "About"}</p>
            <h2>{home.walkTitle}</h2>
            <p className="lede">{home.walkText}</p>
            {home.ticks?.length > 0 && (
              <ul className="ticks">
                {home.ticks.map((item) => <li key={item}>{item}</li>)}
              </ul>
            )}
            <Link className="btn solid" to={sitePath("/about")}>{labels.navAbout || "About"} <Arrow /></Link>
          </div>
        </div>
      </section>

      <section className="services-band">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <div>
              <p className="kicker">{home.servicesKicker}</p>
              <h2>{home.servicesTitle}</h2>
            </div>
            <Link to={sitePath("/services")}>{labels.navServices || "Services"} <Arrow /></Link>
          </div>
          <div className="service-cards">
            {services.map((service, index) => (
              <Link key={service.slug} to={sitePath(`/services/${service.slug}`)} data-reveal>
                {service.image && <img src={service.image} alt="" />}
                <span>
                  <em>{String(index + 1).padStart(2, "0")}</em>
                  <strong>{service.name}</strong>
                  <small>{service.short}</small>
                  <b>Learn more <Arrow /></b>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="process">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <div>
              <p className="kicker">{content.pages?.approach?.kicker || "Approach"}</p>
              <h2>{content.pages?.approach?.title}</h2>
            </div>
            <Link to={sitePath("/approach")}>{home.approachLink} <Arrow /></Link>
          </div>
          <ol className="process-row">
            {steps.map((step) => (
              <li key={step.n} data-reveal>
                <span>{step.n}</span>
                <strong>{step.title}</strong>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {home.promises?.length > 0 && (
        <section className="promises">
          <div className="wrap">
            <div className="section-head" data-reveal>
              <div>
                <p className="kicker">{home.promiseKicker}</p>
                <h2>{home.promiseTitle}</h2>
              </div>
              <Link to={sitePath("/approach")}>{home.promiseLink} <Arrow /></Link>
            </div>
            <div className="promise-row">
              {home.promises.map((item, index) => {
                const photo = promiseImages[index % promiseImages.length];
                return (
                  <Link key={item} className="promise" to={sitePath("/approach")} data-reveal>
                    {photo?.src && <img src={photo.src} alt="" style={{ objectPosition: photo.position || "center" }} />}
                    <span>
                      <em>{String(index + 1).padStart(2, "0")}</em>
                      <strong>{item}</strong>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="certs">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <div>
              <p className="kicker">{home.certKicker}</p>
              <h2>{home.certTitle}</h2>
            </div>
            <Link to={sitePath("/training")}>{home.certLink} <Arrow /></Link>
          </div>
          {home.certLede && <p className="lede">{home.certLede}</p>}
          <Certificates items={certificates} />
        </div>
      </section>

      {partners.length > 0 && (
        <section className="partners" aria-label={labels.partnersTitle || "Partners"}>
          <div className="wrap">
            <div className="section-head" data-reveal>
              <div>
                <p className="kicker">{labels.partnersTitle || "Partners"}</p>
                <h2>Named in the company's own records.</h2>
              </div>
              {partners.length > 6 && <Link to={sitePath("/partners")}>View all <Arrow /></Link>}
            </div>
            <PartnerLogos partners={partners.slice(0, 6)} />
          </div>
        </section>
      )}

      <section className="work-home">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <div>
              <p className="kicker">{home.workKicker}</p>
              <h2>{home.workTitle}</h2>
            </div>
            <Link to={sitePath("/gallery")}>{home.workLink} <Arrow /></Link>
          </div>
          <div className="work-cats">
            {categories.map((item) => {
              const cover = gallery.find((photo) => photo.category === item.id);
              return (
                <Link key={item.id} to={sitePath(`/gallery?category=${item.id}`)} data-reveal>
                  {cover && <img src={cover.src} alt="" />}
                  <span>
                    <strong>{item.title}</strong>
                    <em>{item.text}</em>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {articles?.length > 0 && (
        <section className="news">
          <div className="wrap">
            <div className="section-head" data-reveal>
              <div>
                <p className="kicker">{labels.navResources}</p>
                <h2>{content.pages?.resources?.title || labels.navResources}</h2>
              </div>
              <Link to={sitePath("/resources")}>All notes <Arrow /></Link>
            </div>
            <div className="news-row">
              {articles.slice(0, 3).map((article) => (
                <article key={article.slug} data-reveal>
                  <p>{article.kicker}{article.minutes ? ` · ${article.minutes}` : ""}</p>
                  <h3><Link to={sitePath(`/resources/${article.slug}`)}>{article.title}</Link></h3>
                  <p>{article.lede}</p>
                  <Link className="text-link" to={sitePath(`/resources/${article.slug}`)}>Read <Arrow /></Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="talk">
        <div className="wrap talk-grid">
          <div>
            <p className="kicker">{home.askKicker}</p>
            <h2>{home.askTitle}</h2>
            <p>{home.askText}</p>
            <div className="talk-contacts">
              {company.phone && <a href={telHref(company.phone)}><PhoneMark />{company.phone}</a>}
              {company.email && <a href={`mailto:${company.email}`}><MailMark />{company.email}</a>}
              {company.location && <p>{company.location}</p>}
            </div>
          </div>
          <div className="quote-card"><EnquiryForm /></div>
        </div>
      </section>
    </>
  );
}

function PhoneMark() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M7 3h3l1.5 4-2 1.5a12 12 0 0 0 6 6L17 13l4 1.5V18a2 2 0 0 1-2.2 2A16 16 0 0 1 4 7.2 2 2 0 0 1 6 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function MailMark() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
