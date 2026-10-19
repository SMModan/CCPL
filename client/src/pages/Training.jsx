import Page from "../components/Page";
import Certificates from "../components/Certificates";
import { pageOf, useSiteContent } from "../site";

export default function Training() {
  const content = useSiteContent();
  const page = pageOf(content, "training");
  return (
    <Page
      kicker={page.kicker || content.home?.certKicker}
      title={page.title || content.home?.certTitle}
      lede={page.lede || content.home?.certLede}
    >
      <Certificates items={content.certificates || []} />
    </Page>
  );
}
