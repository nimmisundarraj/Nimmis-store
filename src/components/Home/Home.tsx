import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SparklesCore } from "../ui/Sparkles";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [showCTA, setShowCTA] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleShowProducts = () => {
    navigate("/products");
  };

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollPosition = containerRef.current.scrollTop;
        const viewportHeight = window.innerHeight;
        if (scrollPosition > viewportHeight / 2) {
          setShowCTA(true);
        } else {
          setShowCTA(false);
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const companyHistory = `
    For over three decades, Nimmi's Products has been a testament to tradition, 
    quality, and purity. Established more than 30 years ago, we've built our 
    reputation on crafting the finest ghee, renowned for its exceptional aroma and 
    uncompromising purity. Our small-scale, handmade production process ensures that 
    every batch meets our exacting standards. From our humble beginnings with ghee to our 
    expanded range of products, we continue to serve our valued customers with the same 
    dedication and commitment to excellence that has defined us for generations.
  `;

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-auto snap-y snap-mandatory"
    >
      <div className="h-screen w-full snap-start">
        <div className="home-bg w-full h-full flex flex-col items-center justify-start">
          <div className={`ease-in duration-50 ${showCTA ? "opacity-0" : ""}`}>
            <div>
              <SparklesCore
                id="tsparticlesfullpage"
                background="transparent"
                minSize={0.3}
                maxSize={1}
                particleDensity={50}
                className="w-full h-full"
                particleColor="#f4db16"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="h-screen w-full snap-start home-bg-2 flex flex-col items-center justify-center">
        <div className="text-center max-w-8xl mx-auto px-4">
          <p className="text-white about-company text-xl mb-8">
            {companyHistory}
          </p>
          <button
            onClick={handleShowProducts}
            className="ease-in duration-300 ease-in mt-7 text-white text-2xl border-2 border-white px-8 py-3 rounded-lg hover:bg-white hover:text-black transition-colors"
          >
            Show Products
          </button>
        </div>
      </div>
    </div>
  );
};

export { Home };