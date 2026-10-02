import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  Star,
  MapPin,
  Calendar,
  Clock,
  Wrench,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  X,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────
interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string; // e.g., "1 hour"
}

interface Provider {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  rating: number;
  reviewCount: number;
  distance: string;
  tags: string[];
  categories: string[];
  services: ServiceItem[];
  availability: string[]; // e.g., ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"]
}

// ─── Helpers ────────────────────────────────────────────────
const formatNaira = (amount: number) =>
  `₦${amount.toLocaleString("en-NG")}`;

// ─── Mock Data ──────────────────────────────────────────────
const MOCK_PROVIDERS: Provider[] = [
  {
    id: "p1",
    name: "Express Fix Plumbing",
    emoji: "🚰",
    gradient: "from-blue-500 via-indigo-500 to-cyan-500",
    rating: 4.8,
    reviewCount: 312,
    distance: "2.1 km",
    tags: ["Verified", "Fast Response"],
    categories: ["Plumbing", "Home Repair"],
    availability: ["08:00 AM", "10:00 AM", "01:00 PM", "03:00 PM", "05:00 PM"],
    services: [
      { id: "s1", name: "Leak Repair", description: "Fixing dripping taps, burst pipes, and under-sink leaks.", price: 15000, duration: "1-2 hours" },
      { id: "s2", name: "Water Heater Installation", description: "Professional installation of new water heating units.", price: 35000, duration: "2-3 hours" },
    ],
  },
  {
    id: "p2",
    name: "Spark Electricians",
    emoji: "⚡",
    gradient: "from-amber-500 via-yellow-500 to-orange-500",
    rating: 4.9,
    reviewCount: 450,
    distance: "3.5 km",
    tags: ["Verified", "Top Rated"],
    categories: ["Electrical", "Home Repair"],
    availability: ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"],
    services: [
      { id: "s3", name: "Fault Finding & Repair", description: "Diagnosing and fixing electrical faults and tripping breakers.", price: 20000, duration: "1-2 hours" },
      { id: "s4", name: "AC Installation", description: "Mounting and wiring of new Air Conditioning units.", price: 40000, duration: "2-4 hours" },
    ],
  },
  {
    id: "p3",
    name: "Sparkle Cleaning Co.",
    emoji: "🧹",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    rating: 4.6,
    reviewCount: 890,
    distance: "5.0 km",
    tags: ["Verified"],
    categories: ["Cleaning", "Home Services"],
    availability: ["08:00 AM", "12:00 PM", "03:00 PM"],
    services: [
      { id: "s5", name: "Deep Home Cleaning", description: "Thorough cleaning of a 3-bedroom apartment.", price: 50000, duration: "4-6 hours" },
      { id: "s6", name: "Post-Construction Cleaning", description: "Heavy-duty cleaning for newly built or renovated homes.", price: 80000, duration: "6-8 hours" },
    ],
  },
  {
    id: "p4",
    name: "Oga Mechanic",
    emoji: "🚗",
    gradient: "from-gray-700 via-gray-600 to-gray-800",
    rating: 4.7,
    reviewCount: 220,
    distance: "1.2 km",
    tags: ["Verified", "Mobile Service"],
    categories: ["Auto Repair"],
    availability: ["09:00 AM", "10:30 AM", "01:00 PM", "04:00 PM"],
    services: [
      { id: "s7", name: "Full Car Servicing", description: "Oil change, filter replacement, and general diagnostics.", price: 25000, duration: "2 hours" },
      { id: "s8", name: "Brake Pad Replacement", description: "Supply and replacement of front and rear brake pads.", price: 18000, duration: "1 hour" },
    ],
  },
];

const SERVICE_CATEGORIES = [
  { id: "all", label: "All", emoji: "🛠️" },
  { id: "plumbing", label: "Plumbing", emoji: "🚰" },
  { id: "electrical", label: "Electrical", emoji: "⚡" },
  { id: "cleaning", label: "Cleaning", emoji: "🧹" },
  { id: "auto", label: "Auto Repair", emoji: "🚗" },
  { id: "beauty", label: "Beauty", emoji: "💅" },
];

export default function ServicesBooking() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  
  // Booking state
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isBookingComplete, setIsBookingComplete] = useState(false);

  const providerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedProvider && providerRef.current) {
      setTimeout(() => {
        providerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [selectedProvider]);

  // Generate next 5 days for date picker
  const upcomingDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push({
        value: d.toISOString().split("T")[0],
        label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }
    return dates;
  }, []);

  const filteredProviders = useMemo(() => {
    let results = MOCK_PROVIDERS;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (p) => p.name.toLowerCase().includes(q) || p.services.some(s => s.name.toLowerCase().includes(q))
      );
    }

    if (activeCategory !== "all") {
      const categoryMap: Record<string, string[]> = {
        plumbing: ["Plumbing"],
        electrical: ["Electrical"],
        cleaning: ["Cleaning"],
        auto: ["Auto Repair"],
        beauty: ["Beauty"],
      };
      const target = categoryMap[activeCategory] || [];
      results = results.filter((p) => p.categories.some((c) => target.includes(c)));
    }

    return results;
  }, [searchQuery, activeCategory]);

  const handleBookService = () => {
    if (selectedService && selectedDate && selectedTime) {
      setIsBookingComplete(true);
      // Here you would typically make an API call to create the booking
    }
  };

  return (
    <div className="min-h-screen bg-gray-100/60 pb-32">
      {/* ══════════ HERO SECTION ══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-800">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <span className="text-xl">🛠️</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">FlowMart Services</h2>
              <div className="flex items-center gap-1 text-indigo-200/80 text-xs">
                <MapPin className="h-3 w-3" />
                <span>Verified Pros in Lekki, Lagos</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl leading-tight">
              Book a <span className="text-amber-300">verified pro</span> <br />in minutes.
            </h1>
          </div>

          <div className="relative max-w-xl">
            <div className="flex items-center rounded-2xl bg-white/95 backdrop-blur-sm shadow-lg ring-1 ring-white/20 focus-within:ring-2 focus-within:ring-amber-400">
              <Search className="ml-4 h-5 w-5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for plumbers, electricians, cleaning..."
                className="flex-1 bg-transparent px-3 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="mr-2 rounded-full p-1.5 text-gray-400 hover:bg-gray-100">
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
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {SERVICE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSelectedProvider(null);
                  setSelectedService(null);
                  setIsBookingComplete(false);
                }}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 flex-shrink-0 ${
                  activeCategory === cat.id
                    ? "bg-indigo-600 text-white shadow-md scale-105"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {!selectedProvider ? (
          <>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {activeCategory === "all" ? "All Service Providers" : SERVICE_CATEGORIES.find((c) => c.id === activeCategory)?.label}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider)}
                  className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/60 transition-all hover:shadow-xl hover:-translate-y-1 text-left"
                >
                  <div className={`relative h-32 bg-gradient-to-br ${provider.gradient} overflow-hidden`}>
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl opacity-30 group-hover:scale-110 transition-transform">
                      {provider.emoji}
                    </span>
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {provider.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase text-gray-800 backdrop-blur-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-white text-xs font-semibold">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      {provider.rating} <span className="font-normal opacity-70">({provider.reviewCount})</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-bold text-gray-900">{provider.name}</h3>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{provider.distance} away</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div ref={providerRef} className="max-w-3xl mx-auto">
            {/* Back button */}
            <button
              onClick={() => {
                setSelectedProvider(null);
                setSelectedService(null);
                setIsBookingComplete(false);
              }}
              className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Providers
            </button>

            {/* Provider Details Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-gray-200 mb-6">
              <div className="flex items-center gap-4">
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${selectedProvider.gradient} text-3xl`}>
                  {selectedProvider.emoji}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{selectedProvider.name}</h1>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1 text-amber-500 font-medium">
                      <Star className="h-4 w-4 fill-amber-500" /> {selectedProvider.rating} ({selectedProvider.reviewCount} reviews)
                    </span>
                    <span className="h-1 w-1 rounded-full bg-gray-300" />
                    <span>{selectedProvider.distance}</span>
                  </div>
                </div>
              </div>
            </div>

            {isBookingComplete ? (
              <div className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-emerald-200 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                <p className="text-gray-600 mb-6">
                  You have successfully booked <strong>{selectedService?.name}</strong> with {selectedProvider.name} for <strong>{selectedDate} at {selectedTime}</strong>.
                </p>
                <button
                  onClick={() => {
                    setSelectedProvider(null);
                    setSelectedService(null);
                    setIsBookingComplete(false);
                  }}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-indigo-700"
                >
                  Return to Services
                </button>
              </div>
            ) : !selectedService ? (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Available Services</h3>
                <div className="space-y-4">
                  {selectedProvider.services.map((service) => (
                    <div key={service.id} className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-200 flex justify-between items-center hover:ring-indigo-300 transition-colors">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{service.name}</h4>
                        <p className="text-sm text-gray-500 mt-1 max-w-md">{service.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm font-medium">
                          <span className="text-indigo-600">{formatNaira(service.price)}</span>
                          <span className="text-gray-400">|</span>
                          <span className="text-gray-600 flex items-center gap-1"><Clock className="h-4 w-4" /> {service.duration}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedService(service)}
                        className="bg-gray-100 text-gray-800 hover:bg-indigo-600 hover:text-white px-5 py-2 rounded-xl font-medium transition-colors"
                      >
                        Book Now
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-gray-200">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Book {selectedService.name}</h3>
                    <p className="text-gray-500 mt-1">{formatNaira(selectedService.price)} • {selectedService.duration}</p>
                  </div>
                  <button onClick={() => setSelectedService(null)} className="text-sm text-indigo-600 font-medium">
                    Change Service
                  </button>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Calendar className="h-5 w-5 text-indigo-500" /> Select Date</h4>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {upcomingDates.map((date) => (
                      <button
                        key={date.value}
                        onClick={() => setSelectedDate(date.value)}
                        className={`flex-shrink-0 px-4 py-3 rounded-xl border transition-all ${
                          selectedDate === date.value ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-indigo-300"
                        }`}
                      >
                        <div className={`text-xs ${selectedDate === date.value ? "text-indigo-600 font-bold" : "text-gray-500"}`}>{date.label.split(',')[0]}</div>
                        <div className={`font-semibold ${selectedDate === date.value ? "text-indigo-900" : "text-gray-900"}`}>{date.label.split(',')[1]}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedDate && (
                  <div className="mb-8">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Clock className="h-5 w-5 text-indigo-500" /> Select Time</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {selectedProvider.availability.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                            selectedTime === time ? "border-indigo-600 bg-indigo-600 text-white shadow-md" : "border-gray-200 text-gray-700 hover:border-indigo-300"
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  disabled={!selectedDate || !selectedTime}
                  onClick={handleBookService}
                  className="w-full bg-indigo-600 text-white rounded-xl py-4 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
                >
                  Confirm Booking
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
