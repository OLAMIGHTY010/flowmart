import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type SortKey =
  | "default"
  | "price-asc"
  | "price-desc"
  | "stock";

const AppLayout = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] =
    useState(false);
  const [sort, setSort] =
    useState<SortKey>("default");

  const [showFooter, setShowFooter] =
    useState(true);

  const scrollTimeout = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY =
        window.scrollY;

      // Hide footer while scrolling
      if (
        currentScrollY > lastScrollY &&
        currentScrollY > 50
      ) {
        setShowFooter(false);
      }

      lastScrollY = currentScrollY;

      // Show footer when scrolling stops
      if (scrollTimeout.current) {
        clearTimeout(
          scrollTimeout.current
        );
      }

      scrollTimeout.current =
        setTimeout(() => {
          setShowFooter(true);
        }, 200);
    };

    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );

      if (scrollTimeout.current) {
        clearTimeout(
          scrollTimeout.current
        );
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Navbar */}
      <Navbar
        query={query}
        setQuery={setQuery}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        sort={sort}
        setSort={setSort}
      />

      {/* Scrollable Content */}
      <main
        className="
          pb-24
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-7xl
            px-4
            sm:px-6
            lg:px-8
          "
        >
          {children}
        </div>
      </main>

      {/* Animated Footer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${showFooter
            ? "translate-y-0"
            : "translate-y-full"
          }
        `}
      >
        <Footer />
      </div>
    </div>
  );
};

export default AppLayout;