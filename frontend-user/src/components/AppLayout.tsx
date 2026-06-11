import {
  useEffect,
  useRef,
  useState,
} from "react";
import { Outlet } from "react-router-dom";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type SortKey =
  | "default"
  | "price-asc"
  | "price-desc"
  | "stock";
  

const AppLayout = () => {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] =
    useState(false);
  const [sort, setSort] =
    useState<SortKey>("default");

  const [showFooter, setShowFooter] =
    useState(true);

  const scrollContainerRef =
    useRef<HTMLDivElement>(null);

  const scrollTimeout = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);

  useEffect(() => {
    const container =
      scrollContainerRef.current;

    if (!container) return;

    let lastScrollTop = 0;

    const handleScroll = () => {
      const currentScrollTop =
        container.scrollTop;

      // Hide footer while scrolling down
      if (
        currentScrollTop > lastScrollTop &&
        currentScrollTop > 50
      ) {
        setShowFooter(false);
      }

      lastScrollTop = currentScrollTop;

      // Show footer when scrolling stops
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      scrollTimeout.current =
        setTimeout(() => {
          setShowFooter(true);
        }, 200);
    };

    container.addEventListener(
      "scroll",
      handleScroll
    );

    return () => {
      container.removeEventListener(
        "scroll",
        handleScroll
      );

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

    return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar
        query={query}
        setQuery={setQuery}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        sort={sort}
        setSort={setSort}
      />

      <main
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pb-24"
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <Outlet /> {/* Replace {children} with this */}
        </div>
      </main>

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
          showFooter ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <Footer />
      </div>
    </div>
  );
};

export default AppLayout;