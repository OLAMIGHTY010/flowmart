import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Outlet,
  useLocation,
} from "react-router-dom";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FilterSidebar from "@/components/FilterSidebar";
import ChatWidget from "@/components/ChatWidget";
import { useCategories } from "@/hooks/useCategories";

type SortKey =
  | "default"
  | "price-asc"
  | "price-desc"
  | "stock";

const AppLayout = () => {
  const location = useLocation();
  const { data: categories = ["All"] } = useCategories();

  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] =
    useState(true);
  const [sort, setSort] =
    useState<SortKey>("default");
  const [selectedCategory, setSelectedCategory] =
    useState("All");
  const [selectedTab, setSelectedTab] =
    useState("all");
  const [quickFilters, setQuickFilters] = useState<
    string[]
  >([]);
  const [offers, setOffers] = useState<string[]>(
    []
  );

  const [showFooter, setShowFooter] =
    useState(true);

  const scrollContainerRef =
    useRef<HTMLDivElement>(null);

  const scrollTimeout = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);

  /**
   * Routes where sidebar should be hidden
   */
  const shouldShowSidebar =
    ![
      "/login",
      "/register",
      "/verify-otp",
      "/profile",
      "/profile-setup",
      "/settings",
      "/wishlist",
      "/cart",
      "/checkout",
      "/orders",
      "/edit-profile",
      "/support",
      "/alerts",
      "/privacy-security",
      "/change-password",
      "/two-factor-auth",
      "/active-sessions",
      "/terms",
      "/help-support",
    ].some((route) =>
      location.pathname.startsWith(route)
    ) &&
    !location.pathname.startsWith("/products/") &&
    !location.pathname.startsWith("/vendor/");

  useEffect(() => {
    const container =
      scrollContainerRef.current;

    if (!container) return;

    let lastScrollTop = 0;

    const handleScroll = () => {
      const currentScrollTop =
        container.scrollTop;

      // Hide footer when scrolling down
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
    <div className="flex h-screen flex-col bg-background relative">
      <Navbar
        query={query}
        setQuery={setQuery}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        sort={sort}
        setSort={setSort}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        {shouldShowSidebar && (
          <FilterSidebar
            sort={sort}
            setSort={setSort}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            quickFilters={quickFilters}
            setQuickFilters={setQuickFilters}
            offers={offers}
            setOffers={setOffers}
            categories={categories}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />
        )}

        {/* Main Content */}
        <main
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto pb-24"
        >
          <div
            className={`mx-auto w-full px-4 sm:px-6 lg:px-7 ${shouldShowSidebar
                ? "max-w-7xl"
                : "max-w-6xl"
              }`}
          >
            <Outlet
              context={{
                query,
                setQuery,
                sort,
                setSort,
                selectedCategory,
                setSelectedCategory,
                selectedTab,
                setSelectedTab,
                quickFilters,
                setQuickFilters,
                offers,
                setOffers,
              }}
            />
          </div>
        </main>
      </div>

      <div
        className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${showFooter
            ? "translate-y-0"
            : "translate-y-full"
          }`}
      >
        <Footer />
      </div>

      {/* Global Support Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default AppLayout;