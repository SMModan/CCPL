import { Link } from "react-router-dom";
import Certificates from "../components/Certificates";
import IndustryPanels from "../components/Industry";
import EnquiryForm from "../components/EnquiryForm";
import { telHref, usePageMeta, useSiteContent } from "../site";

export default function Home() {
  const content = useSiteContent();
  const { company, home, services, steps, labels, articles, pages, gallery = [], categories = [], certificates = [] } = content;
  usePageMeta(home.heroTitle, home.heroText);
  const heroPhoto = gallery.find((photo) => photo.category === "food") || gallery[0];
  const promiseImages = home.promiseImages?.length ? home.promiseImages : gallery.slice(0, 3).map((photo) => ({ src: photo.src, position: "center" }));

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            {home.heroKicker && <p className="kicker">{home.heroKicker}</p>}
            <h1>{home.heroTitle}</h1>
            <p className="lede">{home.heroText}</p>
            <div className="actions">
              <Link className="btn solid" to="/contact">{labels.heroPrimary}</Link>
              <Link className="btn line" to="/gallery">{home.heroWork}</Link>
            </div>
          </div>
          {heroPhoto && (
            <Link className="hero-frame" to="/gallery">
              <img src={heroPhoto.src} alt={heroPhoto.alt} />
              <span>{home.heroOpen}</span>
            </Link>
          )}
        </div>
      </section>

      <section className="industries">
        <div className="wrap">
          <p className="kicker" data-reveal>{home.servicesKicker}</p>
          <h2 data-reveal>{home.servicesTitle}</h2>
          <div className="mosaic">
            {services.map((service) => (
              <Link key={service.slug} to={`/services/${service.slug}`}>
                {service.image && <img src={service.image} alt="" />}
                <span>
                  <strong>{service.name}</strong>
                  <em>{service.short}</em>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <p className="kicker light">{pages?.approach?.kicker}</p>
          <h2>{pages?.approach?.title}</h2>
          <p className="lede light">{home.walkText}</p>
          <ol>
            {steps.map((step) => (
              <li key={step.n}><strong>{step.n} {step.title}.</strong> {step.text}</li>
            ))}
          </ol>
          <Link className="btn line light" to="/approach">{home.approachLink}</Link>
        </div>
      </section>

      {home.promises?.length > 0 && (
        <section className="promises">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">{home.promiseKicker}</p>
                <h2>{home.promiseTitle}</h2>
              </div>
              <Link to="/approach">{home.promiseLink}</Link>
            </div>
            <div className="promise-row">
              {home.promises.map((item, index) => {
                const photo = promiseImages[index % promiseImages.length];
                return (
                  <Link key={item} className="promise" to="/approach">
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
          <div className="section-head">
            <div>
              <p className="kicker">{home.certKicker}</p>
              <h2>{home.certTitle}</h2>
            </div>
            <Link to="/training">{home.certLink}</Link>
          </div>
          {home.certLede && <p className="lede">{home.certLede}</p>}
          <Certificates items={certificates} />
        </div>
      </section>

      <section className="industry" aria-label={home.industryKicker || "Industry we work with"}>
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="kicker">{home.industryKicker || "Industry we work with"}</p>
              <h2>{home.industryTitle || "Commercial cleaning for the food manufacturing industry."}</h2>
            </div>
            <Link to="/partners">The markets</Link>
          </div>
          {home.industryLede && <p className="lede industry-lede">{home.industryLede}</p>}
          <IndustryPanels home={home} />
        </div>
      </section>

      <section className="work-home">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="kicker">{home.workKicker}</p>
              <h2>{home.workTitle}</h2>
            </div>
            <Link to="/gallery">{home.workLink}</Link>
          </div>
          <div className="work-cats">
            {categories.map((item) => {
              const cover = gallery.find((photo) => photo.category === item.id);
              return (
                <Link key={item.id} to={`/gallery?category=${item.id}`}>
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
            <div className="section-head">
              <h2>{pages?.resources?.title || labels.navResources}</h2>
              <Link to="/resources">All notes</Link>
            </div>
            <div className="news-row">
              {articles.slice(0, 3).map((article) => (
                <article key={article.slug}>
                  <p>{article.kicker}{article.minutes ? ` · ${article.minutes}` : ""}</p>
                  <h3><Link to={`/resources/${article.slug}`}>{article.title}</Link></h3>
                  <p>{article.lede}</p>
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
            {company.phone && <a href={telHref(company.phone)}>{company.phone}</a>}
            {company.email && <a href={`mailto:${company.email}`}>{company.email}</a>}
          </div>
          <div className="quote-card"><EnquiryForm compact /></div>
        </div>
      </section>
    </>
  );
}
