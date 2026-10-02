import { useState, useMemo } from "react";
import {
  Search,
  Upload,
  Pill,
  Syringe,
  Heart,
  Stethoscope,
  X,
  FileText,
  Plus,
  Minus,
} from "lucide-react";

interface Medication {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  requiresPrescription: boolean;
  image?: string;
}

const MOCK_MEDICATIONS: Medication[] = [
  { id: "m1", name: "Paracetamol 500mg", description: "Pain relief and fever reduction (Pack of 12)", price: 500, category: "Pain Relief", requiresPrescription: false },
  { id: "m2", name: "Amoxicillin 250mg", description: "Antibiotic for bacterial infections", price: 1200, category: "Antibiotics", requiresPrescription: true },
  { id: "m3", name: "Vitamin C 1000mg", description: "Immune system support supplements", price: 2500, category: "Vitamins", requiresPrescription: false },
  { id: "m4", name: "Ibuprofen 400mg", description: "Anti-inflammatory painkiller", price: 800, category: "Pain Relief", requiresPrescription: false },
  { id: "m5", name: "Loratadine 10mg", description: "Non-drowsy allergy relief", price: 1500, category: "Allergy", requiresPrescription: false },
  { id: "m6", name: "Ventolin Inhaler", description: "Asthma reliever inhaler (Salbutamol)", price: 3500, category: "Respiratory", requiresPrescription: true },
];

const PHARMACY_CATEGORIES = [
  { id: "all", label: "All Products", icon: <Pill className="h-4 w-4" /> },
  { id: "Pain Relief", label: "Pain Relief", icon: <Heart className="h-4 w-4" /> },
  { id: "Antibiotics", label: "Antibiotics", icon: <Syringe className="h-4 w-4" /> },
  { id: "Vitamins", label: "Vitamins & Supplements", icon: <Pill className="h-4 w-4" /> },
  { id: "Allergy", label: "Allergy", icon: <Stethoscope className="h-4 w-4" /> },
  { id: "Respiratory", label: "Respiratory", icon: <Stethoscope className="h-4 w-4" /> },
];

export default function Pharmacy() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState<{item: Medication, qty: number}[]>([]);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);

  const filteredMeds = useMemo(() => {
    let results = MOCK_MEDICATIONS;
    if (searchQuery.trim()) {
      results = results.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.description.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (activeCategory !== "all") {
      results = results.filter(m => m.category === activeCategory);
    }
    return results;
  }, [searchQuery, activeCategory]);

  const addToCart = (med: Medication) => {
    setCart(prev => {
      const exists = prev.find(c => c.item.id === med.id);
      if (exists) {
        return prev.map(c => c.item.id === med.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { item: med, qty: 1 }];
    });
  };

  const hasPrescriptionItems = cart.some(c => c.item.requiresPrescription);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* ══════════ HERO SECTION ══════════ */}
      <section className="bg-gradient-to-r from-teal-600 to-emerald-600 pb-10 pt-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-6 text-white">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <h2 className="font-bold text-lg">FlowMart Pharmacy</h2>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
            Health essentials, <br/>delivered fast.
          </h1>

          <div className="relative max-w-xl">
            <div className="flex items-center bg-white rounded-xl shadow-md p-1 pl-4 focus-within:ring-2 focus-within:ring-teal-400">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for medications, vitamins..."
                className="flex-1 bg-transparent border-none focus:ring-0 px-3 py-3 text-gray-800"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ PRESCRIPTION UPLOAD ══════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-teal-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="bg-teal-100 p-3 rounded-full text-teal-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Have a Prescription?</h3>
              <p className="text-gray-500 text-sm mt-1">Upload your doctor's note and we'll fulfill it directly.</p>
            </div>
          </div>
          <div className="w-full md:w-auto">
            <label className="cursor-pointer flex items-center justify-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-teal-700 transition">
              <Upload className="h-5 w-5" />
              {prescriptionFile ? prescriptionFile.name : "Upload Prescription"}
              <input 
                type="file" 
                className="hidden" 
                accept="image/*,.pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setPrescriptionFile(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>
        </div>
      </section>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex flex-col lg:flex-row gap-8">
        
        {/* Categories Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <h3 className="font-bold text-gray-900 mb-4">Categories</h3>
          <div className="flex overflow-x-auto lg:flex-col gap-2 pb-4 lg:pb-0 scrollbar-hide">
            {PHARMACY_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left whitespace-nowrap transition-colors ${
                  activeCategory === cat.id 
                  ? "bg-teal-50 text-teal-700 font-bold border border-teal-200" 
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-transparent"
                }`}
              >
                <div className={activeCategory === cat.id ? "text-teal-600" : "text-gray-400"}>
                  {cat.icon}
                </div>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">
            {activeCategory === "all" ? "All Products" : activeCategory}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredMeds.map(med => (
              <div key={med.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative">
                {med.requiresPrescription && (
                  <span className="absolute top-4 right-4 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Rx Required
                  </span>
                )}
                <div className="h-24 w-24 bg-gray-50 rounded-xl mb-4 flex items-center justify-center text-4xl">
                  {med.category === "Vitamins" ? "💊" : med.category === "Respiratory" ? "💨" : "💊"}
                </div>
                <h4 className="font-bold text-gray-900 line-clamp-1">{med.name}</h4>
                <p className="text-gray-500 text-sm mt-1 mb-4 h-10 line-clamp-2">{med.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-700 text-lg">₦{med.price.toLocaleString()}</span>
                  <button 
                    onClick={() => addToCart(med)}
                    className="bg-gray-100 hover:bg-teal-600 hover:text-white text-gray-800 p-2 rounded-lg transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating/Sticky Cart Summary (Simplified) */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">{cart.reduce((a,c) => a + c.qty, 0)} Items</p>
                <p className="text-teal-700 font-bold text-xl">
                  ₦{cart.reduce((a,c) => a + (c.item.price * c.qty), 0).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {hasPrescriptionItems && !prescriptionFile && (
                  <p className="text-red-500 text-sm font-medium hidden sm:block">
                    ⚠️ Prescription upload required to checkout
                  </p>
                )}
                <button 
                  disabled={hasPrescriptionItems && !prescriptionFile}
                  className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-colors"
                >
                  Checkout
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
