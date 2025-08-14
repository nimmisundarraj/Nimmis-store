import React from "react";
import { Product } from "../../types";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(255,185,80,.15)]">
    {/* Image */}
    <div className="relative">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-64 object-cover"
      />
      {/* Top overlay accents */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-80" />
      {/* Category chip */}
      <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-xs font-semibold text-black bg-gradient-to-br from-amber-300 to-yellow-300 ring-1 ring-black/10">
        {product.category}
      </span>
      {/* Quick price pill on hover */}
      {product.price != null && (
        <span className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-sm font-semibold text-amber-50 bg-black/60 ring-1 ring-white/15 group-hover:bg-black/75 transition">
          ₹{product.price}
        </span>
      )}
    </div>

    {/* Body */}
    <div className="p-4">
      <h2 className="text-lg sm:text-xl font-semibold mb-1 text-amber-50">
        {product.name}
      </h2>
      <p className="text-amber-100/70 line-clamp-2 min-h-[2.75rem]">
        {product.description}
      </p>

      <div className="mt-4 items-center justify-between hidden">
        {product.price != null ? (
          <p className="text-base font-bold text-amber-200">
            ₹{product.price}
          </p>
        ) : (
          <span className="text-sm text-amber-100/60">Contact for price</span>
        )}

        <button
          className="rounded-full px-4 py-2 text-sm font-medium text-black bg-gradient-to-tr from-amber-300 to-yellow-300 shadow hover:from-amber-200 hover:to-yellow-200 active:translate-y-[1px] transition"
          onClick={() => {
          }}
        >
          View details
        </button>
      </div>
    </div>
  </div>
);

export { ProductCard };
