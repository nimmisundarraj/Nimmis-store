import { useState, useEffect } from "react";
import { Product } from "../types";
import productsData from "../data/products.json";

const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProducts(productsData.products as Product[]);
      setLoading(false);
    }, 500);
  }, []);

  return { products, loading };
};

export { useProducts };
