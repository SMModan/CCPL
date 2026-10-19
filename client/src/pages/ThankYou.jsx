import { Link, useSearchParams } from "react-router-dom";
import Page from "../components/Page";
import { fillCopy, useSiteContent, useSitePath } from "../site";

export default function ThankYou() {
  const { labels } = useSiteContent();
  const sitePath = useSitePath();
  const [params] = useSearchParams();
  const ref = params.get("ref") || "";
  const email = params.get("email") || "";
  return (
    <Page
      kicker={labels.thankKicker}
      title={labels.thankTitle}
      lede={fillCopy(ref ? labels.thankWithRef : labels.thankWithoutRef, {}, { ref, email })}
    >
      <div className="prose">
        <p>{fillCopy(email ? labels.thankEmail : labels.thankPhone, {}, { ref, email })}</p>
        <p>{labels.thankKeep}</p>
        <Link className="text-link" to={sitePath("/")}>{labels.thankHome}</Link>
      </div>
    </Page>
  );
}
