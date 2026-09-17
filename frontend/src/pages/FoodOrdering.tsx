import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  Star,
  Clock,
  MapPin,
  ShoppingBag,
  Plus,
  Minus,
  ChevronRight,
  X,
  Bike,
  Flame,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  popular?: boolean;
}

interface Restaurant {
  id: string;
  name: string;
  image: string;
  emoji: string;
  gradient: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  deliveryFee: number;
  distance: string;
  tags: string[];
  categories: string[];
  menu: MenuItem[];
}

interface CartItem extends MenuItem {
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

// ─── Helpers ────────────────────────────────────────────────
const formatNaira = (amount: number) =>
  `₦${amount.toLocaleString("en-NG")}`;

// ─── Mock Data ──────────────────────────────────────────────
// TODO: Replace with apiClient.get<Restaurant[]>('/food/restaurants')
const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: "r1",
    name: "Mama Put Kitchen",
    emoji: "🍲",
    gradient: "from-primary via-red-500 to-pink-500",
    image: "",
    rating: 4.8,
    reviewCount: 1240,
    deliveryTime: "20-30 min",
    deliveryFee: 400,
    distance: "1.2 km",
    tags: ["Popular", "Free Delivery"],
    categories: ["Rice Dishes", "Swallow", "Soups"],
    menu: [
      { id: "m1", name: "Jollof Rice & Chicken", description: "Smoky party jollof rice served with a perfectly seasoned fried chicken drumstick and coleslaw", price: 3500, category: "Rice Dishes", image: "🍚", popular: true },
      { id: "m2", name: "Pounded Yam & Egusi", description: "Smooth pounded yam paired with rich melon-seed egusi soup loaded with assorted meat", price: 4000, category: "Swallow", image: "🥘", popular: true },
      { id: "m3", name: "Fried Rice & Turkey", description: "Colourful fried rice with mixed vegetables, served with a well-seasoned turkey wing", price: 4500, category: "Rice Dishes", image: "🍛" },
      { id: "m4", name: "Amala & Ewedu", description: "Soft yam-flour amala with silky ewedu soup and gbegiri, plus assorted meat", price: 3000, category: "Swallow", image: "🫕" },
      { id: "m5", name: "Ofada Rice & Sauce", description: "Local unpolished ofada rice with spicy ofada stew, topped with boiled eggs and peppered beef", price: 3800, category: "Rice Dishes", image: "🍚" },
      { id: "m6", name: "Pepper Soup (Goat Meat)", description: "Spicy Nsala-style goat meat pepper soup, perfect for chilly evenings", price: 3500, category: "Soups", image: "🥣" },
    ],
  },
  {
    id: "r2",
    name: "Kilimanjaro Restaurant",
    emoji: "🥩",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    image: "",
    rating: 4.6,
    reviewCount: 890,
    deliveryTime: "25-35 min",
    deliveryFee: 500,
    distance: "2.5 km",
    tags: ["Popular"],
    categories: ["Suya & Grills", "Rice Dishes", "Drinks"],
    menu: [
      { id: "m7", name: "Suya Platter (Beef)", description: "Generous portion of thinly sliced beef suya seasoned with yaji spice, served with onions and tomatoes", price: 4500, category: "Suya & Grills", image: "🥩", popular: true },
      { id: "m8", name: "Grilled Whole Chicken", description: "Full chicken grilled over open flame, marinated in a secret spice blend", price: 8500, category: "Suya & Grills", image: "🍗" },
      { id: "m9", name: "Jollof Rice & Grilled Fish", description: "Long-grain jollof rice with a whole grilled tilapia fish and plantain", price: 5500, category: "Rice Dishes", image: "🐟", popular: true },
      { id: "m10", name: "Chapman Cocktail", description: "Classic Nigerian Chapman with Fanta, Sprite, cucumber, and bitters", price: 1500, category: "Drinks", image: "🍹" },
      { id: "m11", name: "Asun (Spicy Goat)", description: "Grilled and peppered goat meat chunks with onions and scotch bonnet", price: 5000, category: "Suya & Grills", image: "🔥" },
    ],
  },
  {
    id: "r3",
    name: "Chicken Republic",
    emoji: "🍗",
    gradient: "from-yellow-500 via-primary to-red-500",
    image: "",
    rating: 4.3,
    reviewCount: 2100,
    deliveryTime: "15-25 min",
    deliveryFee: 300,
    distance: "0.8 km",
    tags: ["New", "Free Delivery"],
    categories: ["Snacks", "Rice Dishes", "Drinks"],
    menu: [
      { id: "m12", name: "Chicken Sharwarma (Large)", description: "Loaded flour wrap with grilled chicken strips, cabbage, carrots, and creamy sauce", price: 3800, category: "Snacks", image: "🌯", popular: true },
      { id: "m13", name: "Crispy Chicken Bucket (6pc)", description: "Six pieces of crispy golden fried chicken with dipping sauce", price: 7200, category: "Snacks", image: "🍗" },
      { id: "m14", name: "Chicken & Chips Combo", description: "Two pieces of fried chicken with seasoned french fries and coleslaw", price: 3200, category: "Snacks", image: "🍟", popular: true },
      { id: "m15", name: "Spicy Rice Bowl", description: "Aromatic basmati rice with spicy chicken, mixed veggies, and sweet chilli drizzle", price: 2800, category: "Rice Dishes", image: "🍚" },
      { id: "m16", name: "Zobo Drink (50cl)", description: "Chilled homemade hibiscus drink with a hint of ginger and pineapple", price: 800, category: "Drinks", image: "🥤" },
    ],
  },
  {
    id: "r4",
    name: "Amala Joint Ikoyi",
    emoji: "🫕",
    gradient: "from-primary/90 via-violet-500 to-fuchsia-500",
    image: "",
    rating: 4.9,
    reviewCount: 650,
    deliveryTime: "30-45 min",
    deliveryFee: 600,
    distance: "3.1 km",
    tags: ["Popular"],
    categories: ["Swallow", "Soups"],
    menu: [
      { id: "m17", name: "Amala & Gbegiri/Ewedu", description: "Classic Lagos amala triple combo with gbegiri, ewedu, and stew topped with assorted meat", price: 3500, category: "Swallow", image: "🫕", popular: true },
      { id: "m18", name: "Eba & Ogbono Soup", description: "Smooth garri eba with draw ogbono soup loaded with stockfish and ponmo", price: 3200, category: "Swallow", image: "🥘" },
      { id: "m19", name: "Semo & Seafood Okra", description: "Semolina paired with fresh okra soup swimming with prawns, crab, and periwinkle", price: 6000, category: "Swallow", image: "🦐", popular: true },
      { id: "m20", name: "Fufu & Banga Soup", description: "Cassava fufu with rich Delta-style palm fruit banga soup, fresh catfish, and dry fish", price: 4500, category: "Swallow", image: "🥘" },
    ],
  },
  {
    id: "r5",
    name: "Buka Hut Express",
    emoji: "🔥",
    gradient: "from-rose-500 via-pink-500 to-primary",
    image: "",
    rating: 4.5,
    reviewCount: 430,
    deliveryTime: "20-30 min",
    deliveryFee: 350,
    distance: "1.8 km",
    tags: ["New"],
    categories: ["Rice Dishes", "Snacks", "Drinks"],
    menu: [
      { id: "m21", name: "Coconut Rice & Peppered Snail", description: "Creamy coconut jollof rice with spicy peppered snail and fried plantain", price: 5500, category: "Rice Dishes", image: "🥥", popular: true },
      { id: "m22", name: "Gizdodo", description: "Sautéed gizzard and diced plantain in spicy pepper sauce — the perfect appetizer", price: 3000, category: "Snacks", image: "🍖" },
      { id: "m23", name: "Meat Pie (x3)", description: "Three flaky, golden-crusted meat pies filled with minced beef, potatoes, and carrots", price: 2400, category: "Snacks", image: "🥧" },
      { id: "m24", name: "Puff Puff (12pcs)", description: "Dozen of perfectly fried Nigerian dough balls, golden and fluffy", price: 1500, category: "Snacks", image: "🧁" },
      { id: "m25", name: "Fresh Tiger Nut Drink", description: "Chilled creamy tiger nut (kunun aya) drink with dates, coconut, and ginger", price: 1200, category: "Drinks", image: "🥛" },
    ],
  },
  {
    id: "r6",
    name: "Shawarma Hub",
    emoji: "🌯",
    gradient: "from-amber-500 via-yellow-500 to-lime-500",
    image: "",
    rating: 4.4,
    reviewCount: 780,
    deliveryTime: "15-20 min",
    deliveryFee: 300,
    distance: "0.6 km",
    tags: ["Free Delivery", "Popular"],
    categories: ["Shawarma", "Snacks", "Drinks"],
    menu: [
      { id: "m26", name: "Classic Beef Shawarma", description: "Grilled beef strips, lettuce, cabbage, carrots, and garlic mayo in a warm tortilla wrap", price: 3500, category: "Shawarma", image: "🌯", popular: true },
      { id: "m27", name: "Chicken Shawarma Special", description: "Double chicken, extra cheese, and special hot sauce in an oversized wrap", price: 4200, category: "Shawarma", image: "🌯", popular: true },
      { id: "m28", name: "Shawarma Platter (4pcs)", description: "Four mini shawarma wraps with dipping sauces — perfect for sharing", price: 6500, category: "Shawarma", image: "🌮" },
      { id: "m29", name: "Loaded Fries", description: "Crispy fries topped with cheese sauce, grilled chicken, jalapeños, and spring onions", price: 2800, category: "Snacks", image: "🍟" },
      { id: "m30", name: "Smoothie (Mango-Banana)", description: "Fresh mango and banana blended with yoghurt and honey", price: 1800, category: "Drinks", image: "🥤" },
    ],
  },
];

const FOOD_CATEGORIES = [
  { id: "all", label: "All", emoji: "🍽️" },
  { id: "rice", label: "Rice Dishes", emoji: "🍚" },
  { id: "jollof", label: "Jollof", emoji: "🥘" },
  { id: "suya", label: "Suya & Grills", emoji: "🥩" },
  { id: "swallow", label: "Swallow", emoji: "🫕" },
  { id: "shawarma", label: "Shawarma", emoji: "🌯" },
  { id: "drinks", label: "Drinks", emoji: "🥤" },
  { id: "snacks", label: "Snacks", emoji: "🍿" },
];

// ─── Component ──────────────────────────────────────────────
export default function FoodOrdering() {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [menuCategoryFilter, setMenuCategoryFilter] = useState("All");
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Scroll into view when restaurant selected
  useEffect(() => {
    if (selectedRestaurant && menuRef.current) {
      setTimeout(() => {
        menuRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [selectedRestaurant]);

  // ─── Filter Restaurants ─────────────────────────────────
  const filteredRestaurants = useMemo(() => {
    let results = MOCK_RESTAURANTS;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.menu.some(
            (m) =>
              m.name.toLowerCase().includes(q) ||
              m.description.toLowerCase().includes(q)
          )
      );
    }

    if (activeCategory !== "all") {
      const categoryMap: Record<string, string[]> = {
        rice: ["Rice Dishes"],
        jollof: ["Rice Dishes"],
        suya: ["Suya & Grills"],
        swallow: ["Swallow"],
        shawarma: ["Shawarma"],
        drinks: ["Drinks"],
        snacks: ["Snacks"],
      };
      const target = categoryMap[activeCategory] || [];
      results = results.filter((r) =>
        r.categories.some((c) => target.includes(c))
      );
    }

    return results;
  }, [searchQuery, activeCategory]);

  // ─── Cart Operations ───────────────────────────────────
  const addToCart = (item: MenuItem, restaurant: Restaurant) => {
    setCart((prev) => {
      const existing = prev.find(
        (c) => c.id === item.id && c.restaurantId === restaurant.id
      );
      if (existing) {
        return prev.map((c) =>
          c.id === item.id && c.restaurantId === restaurant.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [
        ...prev,
        { ...item, quantity: 1, restaurantId: restaurant.id, restaurantName: restaurant.name },
      ];
    });
  };

  const updateQuantity = (itemId: string, restaurantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.id === itemId && c.restaurantId === restaurantId
            ? { ...c, quantity: c.quantity + delta }
            : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const getItemQuantity = (itemId: string, restaurantId: string) =>
    cart.find((c) => c.id === itemId && c.restaurantId === restaurantId)?.quantity || 0;

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const deliveryFee = selectedRestaurant?.deliveryFee || 0;
  const cartRestaurantIds = [...new Set(cart.map((c) => c.restaurantId))];
  const totalDeliveryFee = cartRestaurantIds.reduce((sum, rid) => {
    const r = MOCK_RESTAURANTS.find((r) => r.id === rid);
    return sum + (r?.deliveryFee || 0);
  }, 0);

  // ─── Filtered menu items for selected restaurant ──────
  const filteredMenu = useMemo(() => {
    if (!selectedRestaurant) return [];
    if (menuCategoryFilter === "All") return selectedRestaurant.menu;
    return selectedRestaurant.menu.filter((m) => m.category === menuCategoryFilter);
  }, [selectedRestaurant, menuCategoryFilter]);

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100/60">
      {/* ══════════ HERO SECTION ══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-emerald-800">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary-400/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <span className="text-xl">🍽️</span>
              </div>
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">FlowMart Food</h2>
                <div className="flex items-center gap-1 text-emerald-200/80 text-xs">
                  <MapPin className="h-3 w-3" />
                  <span>Delivering to Lekki, Lagos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero text */}
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl leading-tight">
              What are you{" "}
              <span className="bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 bg-clip-text text-transparent">
                craving?
              </span>
            </h1>
            <p className="mt-2 text-emerald-100/70 text-sm sm:text-base max-w-lg">
              Order from the best restaurants near you. Fast delivery, fresh food, great prices.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-xl">
            <div className="flex items-center rounded-2xl bg-white/95 backdrop-blur-sm shadow-lg shadow-black/10 ring-1 ring-white/20 transition-all focus-within:ring-2 focus-within:ring-amber-400/60 focus-within:shadow-xl">
              <Search className="ml-4 h-5 w-5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search restaurants, dishes..."
                className="flex-1 bg-transparent px-3 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mr-2 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ CATEGORIES ══════════ */}
      <section className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            ref={categoryScrollRef}
            className="flex gap-2 overflow-x-auto py-3 scrollbar-hide"
            style={{ scrollbarWidth: "none" }}
          >
            {FOOD_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSelectedRestaurant(null);
                  }}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 flex-shrink-0 ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/25 scale-105"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                  }`}
                >
                  <span className="text-base">{cat.emoji}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 pb-32">
        {/* Restaurant list OR restaurant detail */}
        {!selectedRestaurant ? (
          <>
            {/* Quick stats bar */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {activeCategory === "all" ? "All Restaurants" : FOOD_CATEGORIES.find((c) => c.id === activeCategory)?.label}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">{filteredRestaurants.length} restaurants near you</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                <MapPin className="h-3.5 w-3.5" />
                Lekki, Lagos
              </div>
            </div>

            {/* Restaurant Cards */}
            {filteredRestaurants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-bold text-gray-900">No restaurants found</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-sm">
                  Try adjusting your search or category filter
                </p>
                <button
                  onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}
                  className="mt-4 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRestaurants.map((restaurant) => (
                  <button
                    key={restaurant.id}
                    onClick={() => {
                      setSelectedRestaurant(restaurant);
                      setMenuCategoryFilter("All");
                    }}
                    className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/60 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:ring-primary/20 text-left"
                  >
                    {/* Image / Gradient banner */}
                    <div className={`relative h-36 bg-gradient-to-br ${restaurant.gradient} overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/10" />
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl opacity-30 group-hover:scale-110 transition-transform duration-500">
                        {restaurant.emoji}
                      </span>
                      {/* Tags */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        {restaurant.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${
                              tag === "Free Delivery"
                                ? "bg-emerald-500/90 text-white"
                                : tag === "Popular"
                                ? "bg-amber-500/90 text-white"
                                : "bg-white/90 text-gray-800"
                            }`}
                          >
                            {tag === "Popular" && "🔥 "}{tag}
                          </span>
                        ))}
                      </div>
                      {/* Rating pill */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-1 text-white text-xs font-semibold">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {restaurant.rating}
                        <span className="text-white/60 font-normal">({restaurant.reviewCount})</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors">
                        {restaurant.name}
                      </h3>

                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          {restaurant.deliveryTime}
                        </span>
                        <span className="h-3 w-px bg-gray-300" />
                        <span className="flex items-center gap-1">
                          <Bike className="h-3.5 w-3.5 text-primary" />
                          {restaurant.deliveryFee === 0 ? "Free" : formatNaira(restaurant.deliveryFee)}
                        </span>
                        <span className="h-3 w-px bg-gray-300" />
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          {restaurant.distance}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {restaurant.categories.slice(0, 3).map((cat) => (
                            <span key={cat} className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700">
                              {cat}
                            </span>
                          ))}
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          /* ══════════ RESTAURANT DETAIL / MENU ══════════ */
          <div ref={menuRef}>
            {/* Back button + Restaurant header */}
            <button
              onClick={() => setSelectedRestaurant(null)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors mb-4 group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to restaurants
            </button>

            {/* Restaurant hero */}
            <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${selectedRestaurant.gradient} p-6 sm:p-8 mb-6`}>
              <div className="absolute inset-0 bg-black/20" />
              <span className="absolute -bottom-4 -right-4 text-[120px] opacity-15">{selectedRestaurant.emoji}</span>
              <div className="relative">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">{selectedRestaurant.name}</h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-white font-semibold">{selectedRestaurant.rating}</span>
                    <span className="text-white/60">({selectedRestaurant.reviewCount} reviews)</span>
                  </span>
                  <span className="h-4 w-px bg-white/30" />
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {selectedRestaurant.deliveryTime}
                  </span>
                  <span className="h-4 w-px bg-white/30" />
                  <span className="flex items-center gap-1">
                    <Bike className="h-4 w-4" />
                    Delivery: {formatNaira(selectedRestaurant.deliveryFee)}
                  </span>
                  <span className="h-4 w-px bg-white/30" />
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedRestaurant.distance}
                  </span>
                </div>
                {/* Tags */}
                <div className="mt-3 flex gap-2">
                  {selectedRestaurant.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Menu category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
              {["All", ...selectedRestaurant.categories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setMenuCategoryFilter(cat)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all flex-shrink-0 ${
                    menuCategoryFilter === cat
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu items */}
            <div className="space-y-3">
              {filteredMenu.map((item) => {
                const qty = getItemQuantity(item.id, selectedRestaurant.id);
                return (
                  <div
                    key={item.id}
                    className="group flex items-start gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200/60 transition-all hover:shadow-md hover:ring-primary/15"
                  >
                    {/* Item image placeholder */}
                    <div className={`flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${selectedRestaurant.gradient} text-3xl shadow-inner`}>
                      {item.image}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-1.5">
                            {item.name}
                            {item.popular && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                                <Flame className="h-2.5 w-2.5" /> Popular
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-base font-extrabold text-primary">{formatNaira(item.price)}</span>

                        {/* Add to cart / quantity control */}
                        {qty === 0 ? (
                          <button
                            onClick={() => addToCart(item, selectedRestaurant)}
                            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 rounded-full bg-primary-50 px-1 py-1 ring-1 ring-primary/20">
                            <button
                              onClick={() => updateQuantity(item.id, selectedRestaurant.id, -1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm text-primary hover:bg-primary hover:text-white transition-colors"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-5 text-center text-sm font-bold text-primary">{qty}</span>
                            <button
                              onClick={() => updateQuantity(item.id, selectedRestaurant.id, 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-sm hover:bg-primary-600 transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ══════════ FLOATING CART BAR ══════════ */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
          <div className="mx-auto max-w-xl pointer-events-auto">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full flex items-center justify-between rounded-2xl bg-primary px-5 py-4 text-white shadow-2xl shadow-primary/30 ring-1 ring-white/10 transition-all hover:shadow-3xl hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag className="h-6 w-6" />
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-gray-900">
                    {cartCount}
                  </span>
                </div>
                <span className="text-sm font-semibold">View Cart</span>
              </div>
              <span className="text-lg font-extrabold">{formatNaira(cartTotal)}</span>
            </button>
          </div>
        </div>
      )}

      {/* ══════════ CART SLIDE-UP DRAWER ══════════ */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />

          {/* Drawer */}
          <div className="relative w-full max-w-lg rounded-t-3xl bg-white shadow-2xl animate-slide-up max-h-[85vh] flex flex-col">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-gray-900">Your Order</h3>
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-bold text-primary">{cartCount} items</span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {cart.map((item) => (
                <div key={`${item.restaurantId}-${item.id}`} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-xl">
                    {item.image}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
                    <p className="text-[10px] text-gray-400">{item.restaurantName}</p>
                    <p className="text-sm font-bold text-primary mt-0.5">{formatNaira(item.price * item.quantity)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.id, item.restaurantId, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white ring-1 ring-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-500 hover:ring-red-200 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.restaurantId, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-600 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t border-gray-100 px-5 py-4 space-y-2 bg-gray-50/50">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-700">{formatNaira(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Delivery Fee</span>
                <span className="font-semibold text-gray-700">{formatNaira(totalDeliveryFee)}</span>
              </div>
              <div className="h-px bg-gray-200 my-1" />
              <div className="flex justify-between text-base font-bold text-gray-900">
                <span>Total</span>
                <span className="text-primary">{formatNaira(cartTotal + totalDeliveryFee)}</span>
              </div>

              <button className="mt-3 w-full rounded-2xl bg-primary py-4 text-white font-bold text-sm shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/35 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Place Order — {formatNaira(cartTotal + totalDeliveryFee)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-up animation */}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
