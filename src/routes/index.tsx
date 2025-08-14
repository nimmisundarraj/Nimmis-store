import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Home } from "../components/Home/Home";
import { Products } from "../components/Product/Products";

const routes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
      </Routes>
    </Router>
  );
};

export default routes;
