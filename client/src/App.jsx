import { Navigate, Route, Routes } from "react-router-dom";
import Shell from "./components/Shell";
import Home from "./pages/Home";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import Approach from "./pages/Approach";
import About from "./pages/About";
import Resources from "./pages/Resources";
import Article from "./pages/Article";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import Legal from "./pages/Legal";
import ThankYou from "./pages/ThankYou";
import Capability from "./pages/Capability";
import Training from "./pages/Training";
import Partners from "./pages/Partners";
import Custom from "./pages/Custom";
import CrmApp from "./crm/CrmApp";
import Option2Shell from "./option2/Shell";
import Option2Home from "./option2/Home";

function publicRoutes(home) {
  return [
    <Route key="home" index element={home} />,
    <Route key="services" path="services" element={<Services />} />,
    <Route key="service" path="services/:slug" element={<ServiceDetail />} />,
    <Route key="approach" path="approach" element={<Approach />} />,
    <Route key="training" path="training" element={<Training />} />,
    <Route key="about" path="about" element={<About />} />,
    <Route key="gallery" path="gallery" element={<Gallery />} />,
    <Route key="resources" path="resources" element={<Resources />} />,
    <Route key="article" path="resources/:slug" element={<Article />} />,
    <Route key="contact" path="contact" element={<Contact />} />,
    <Route key="privacy" path="privacy" element={<Legal kind="privacy" />} />,
    <Route key="terms" path="terms" element={<Legal kind="terms" />} />,
    <Route key="thanks" path="thank-you" element={<ThankYou />} />,
    <Route key="capability" path="capability" element={<Capability />} />,
    <Route key="partners" path="partners" element={<Partners />} />,
    <Route key="custom" path=":slug" element={<Custom />} />,
  ];
}

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        {publicRoutes(<Home />)}
      </Route>
      <Route path="option2" element={<Option2Shell />}>
        {publicRoutes(<Option2Home />)}
      </Route>
      <Route path="/crm/*" element={<CrmApp />} />
      <Route path="/crm2/*" element={<Navigate to="/crm" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
