import { Link } from "react-router-dom";
import IndustryPanels from "../components/Industry";
import Page from "../components/Page";
import { useSiteContent } from "../site";

export default function Partners() {
  const content = useSiteContent();
  const home = content?.home || {};
  const labels = content?.labels || {};

  return (
    <Page
      kicker={home.industryKicker || "Industry we work with"}
      title={home.industryTitle || "Commercial cleaning for the food manufacturing industry."}
      lede={home.industryLede || ""}
    >
      <IndustryPanels home={home} heading="h2" />
      <p className="page-note">
        <Link to="/contact">{labels.navCta || "Request a site assessment"}</Link>
      </p>
    </Page>
  );
}
