import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Home } from "../components/Home/Home";
import { Products } from "../components/Product/Products";
import CowBuddyShowcase from "../pages/CowBuddyShowcase";
import { NimmiSite } from "../site/NimmiSite";
import { NotFoundPage } from "../site/NotFoundPage";

const routes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<NimmiSite />} />
        <Route path="/classic" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/cow-buddy" element={<CowBuddyShowcase />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default routes;
