import { lazy, Suspense } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { usePageViews } from "../lib/analytics";
import { Home } from "../components/Home/Home";
import CowBuddyShowcase from "../pages/CowBuddyShowcase";
import { NimmiSite } from "../site/NimmiSite";
import { NotFoundPage } from "../site/NotFoundPage";
import { ProductsPage } from "../site/ProductsPage";

// Firebase Auth and the admin screens load only when someone opens /admin.
const AdminApp = lazy(() => import("../admin/AdminApp"));

function PageViews() {
  usePageViews();
  return null;
}

const routes = () => {
  return (
    <Router>
      <PageViews />
      <Routes>
        <Route path="/" element={<NimmiSite />} />
        <Route path="/classic" element={<Home />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route
          path="/admin"
          element={
            <Suspense fallback={null}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route path="/cow-buddy" element={<CowBuddyShowcase />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default routes;
