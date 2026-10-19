import Page from "../components/Page";
import PartnerLogos from "../components/PartnerLogos";
import { useSiteContent } from "../site";

export default function Partners() {
  const content = useSiteContent();
  const partners = content.partners || [];
  return (
    <Page kicker={content.labels?.partnersTitle || "Partners"} title="Named in the company's own records.">
      {partners.length > 0 ? <PartnerLogos partners={partners} /> : <p>No partners to show yet.</p>}
    </Page>
  );
}
