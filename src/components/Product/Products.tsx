import React, { useEffect, useMemo, useState } from "react";
import { ProductList } from "./ProductList";
import { SearchBar } from "../common/SearchBar";
import { CategoryFilter } from "../common/CategoryFilter";
import { useProducts } from "../../hooks/useProducts";

type SortBy = "relevance" | "name" | "priceAsc" | "priceDesc";

const Products: React.FC = () => {
  const { products, loading } = useProducts();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortBy>("relevance");

  const [showMobileFab] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileFiltersOpen(false);
    };
    if (isMobileFiltersOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobileFiltersOpen]);

  const categories: string[] = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))),
    [products]
  );

  const filtered = useMemo(
    () =>
      products
        .filter((p) =>
          p.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
        )
        .filter((p) =>
          selectedCategory ? p.category === selectedCategory : true
        ),
    [products, searchTerm, selectedCategory]
  );

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case "name":
        return arr.sort((a, b) => a.name.localeCompare(b.name));
      case "priceAsc":
        return arr.sort(
          (a, b) =>
            (a.price ?? Number.POSITIVE_INFINITY) -
            (b.price ?? Number.POSITIVE_INFINITY)
        );
      case "priceDesc":
        return arr.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
      default:
        return arr;
    }
  }, [filtered, sortBy]);

  if (loading) {
    return (
      <div className="relative min-h-screen grid place-items-center text-amber-100 product-listing-bg">
        <div className="rounded-2xl px-6 py-3 bg-white/5 backdrop-blur ring-1 ring-white/10">
          Loading products…
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen product-listing-bg">
      <div className="bg-black/60 shadow-lg">
        <div className="container mx-auto py-10">
          <div className="px-4 py-4">
            <h1 className="text-center mb-3">
              <span className="text-4xl md:text-5xl font-extrabold tracking-tight bg-white bg-clip-text text-transparent ">
                Nimmi&apos;s Product Catalog
              </span>
            </h1>
            <p className="text-center text-amber-100/70 mb-8">
              Handpicked dairy & premium dry fruits
            </p>

            <div className="sticky top-4 z-10 mb-10 hidden sm:block">
              <div className="max-w-4xl mx-auto rounded-2xl bg-white/5 backdrop-blur-xl ring-1 ring-white/10 shadow-[0_0_0_1px_rgba(255,255,255,.04)] p-3 md:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <SearchBar
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                    />
                  </div>

                  <div className="min-w-[200px]">
                    <CategoryFilter
                      categories={categories}
                      selectedCategory={selectedCategory}
                      onCategoryChange={setSelectedCategory}
                    />
                  </div>

                  <div className="min-w-[180px]">
                    <label className="block text-xs mb-1 text-amber-100/70">
                      Sort by
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortBy)}
                      className="w-full rounded-xl bg-black/30 text-amber-50 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300/60"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="name">Name (A–Z)</option>
                      <option value="priceAsc">Price: Low → High</option>
                      <option value="priceDesc">Price: High → Low</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {showMobileFab && (
              <button
                type="button"
                aria-label="Open filters"
                onClick={() => setIsMobileFiltersOpen(true)}
                className="sm:hidden fixed bottom-6 right-6 z-40 rounded-full p-4 shadow-lg bg-white/90 backdrop-blur ring-1 ring-black/10 hover:bg-white active:scale-95 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6 text-black"
                >
                  <path d="M3 5.25A.75.75 0 0 1 3.75 4.5h16.5a.75.75 0 0 1 .53 1.28L15 12.56v5.19a.75.75 0 0 1-1.12.66l-3-1.8a.75.75 0 0 1-.38-.66v-3.39L3.22 5.78A.75.75 0 0 1 3 5.25z" />
                </svg>
              </button>
            )}

            {isMobileFiltersOpen && (
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Filters"
                className="sm:hidden fixed inset-0 z-50"
              >
                <div
                  className="absolute inset-0 bg-black/60"
                  onClick={() => setIsMobileFiltersOpen(false)}
                />
                <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-neutral-900 ring-1 ring-white/10 p-4">
                  <div className="mx-auto h-1.5 w-12 rounded-full bg-white/20 mb-4" />
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-amber-50 font-semibold">Filters</h2>
                    <button
                      onClick={() => setIsMobileFiltersOpen(false)}
                      className="rounded-lg px-3 py-1.5 text-sm bg-white/10 text-amber-50 hover:bg-white/20"
                    >
                      Done
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs mb-1 text-amber-100/70">
                        Search
                      </label>
                      <SearchBar
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                      />
                    </div>

                    <div>
                      <label className="block text-xs mb-1 text-amber-100/70">
                        Category
                      </label>
                      <CategoryFilter
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                      />
                    </div>

                    <div>
                      <label className="block text-xs mb-1 text-amber-100/70">
                        Sort by
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortBy)}
                        className="w-full rounded-xl bg-black/30 text-amber-50 ring-1 ring-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300/60"
                      >
                        <option value="relevance">Relevance</option>
                        <option value="name">Name (A–Z)</option>
                        <option value="priceAsc">Price: Low → High</option>
                        <option value="priceDesc">Price: High → Low</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <ProductList products={sorted} />
          </div>
        </div>
      </div>
    </div>
  );
};

export { Products };
