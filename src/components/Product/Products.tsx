import React, { useState } from "react";
import { ProductList } from "./ProductList";
import { SearchBar } from "../common/SearchBar";
import { CategoryFilter } from "../common/CategoryFilter";
import { useProducts } from "../../hooks/useProducts";

const Products: React.FC = () => {
  const { products, loading } = useProducts();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const categories: string[] = Array.from(
    new Set(products.map((p) => p.category))
  );

  const filteredProducts = products
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((p) => (selectedCategory ? p.category === selectedCategory : true));

  if (loading)
    return <div className="text-center mt-8">Loading products...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-black-700 nimmis-heading">
        Nimmi's Product Catalog
      </h1>
      <div className="max-w-xl mx-auto mb-8">
        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </div>
      <ProductList products={filteredProducts} />
    </div>
  );
};

export { Products };
