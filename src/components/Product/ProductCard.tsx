import React from "react";
import { Product } from "../../types";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:scale-105">
    <img
      src={product.image}
      alt={product.name}
      className="w-full h-49 object-cover"
    />
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-2 text-gray-800">
        {product.name}
      </h2>
      <p className="text-gray-600 mb-4 h-12 overflow-hidden">
        {product.description}
      </p>
      <div className="flex justify-between items-center">
        {product.price && <p className="text-lg font-bold text-indigo-600">₹{product.price}</p>}
        <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
          {product.category}
        </span>
      </div>
    </div>
  </div>
);

export { ProductCard };
