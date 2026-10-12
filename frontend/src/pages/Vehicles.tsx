import { useState } from "react";
import { Car, Search, Filter, ShieldCheck, MapPin } from "lucide-react";

export default function Vehicles() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <section className="bg-gradient-to-r from-slate-900 to-gray-800 pb-12 pt-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/20">
              <Car className="h-8 w-8 text-white" />
            </div>
            <h2 className="font-bold text-2xl tracking-tight text-white/90">FlowMart Motors</h2>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            Verified Vehicles,<br/><span className="text-amber-400">Secure Payments.</span>
          </h1>

          <div className="relative max-w-2xl">
            <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-2 pl-5 focus-within:border-amber-400/50 transition-colors">
              <Search className="h-6 w-6 text-white/50" />
              <input
                type="text"
                placeholder="Search make, model, or year..."
                className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-4 text-white text-lg outline-none placeholder:text-white/50"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-8 py-3 rounded-xl font-bold transition-colors">
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 flex gap-8">
        {/* Filters Sidebar */}
        <div className="hidden lg:block w-72 flex-shrink-0">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 font-bold text-xl text-gray-900 mb-6">
              <Filter className="h-5 w-5" /> Filters
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="font-semibold text-gray-700 mb-3 block">Condition</label>
                <div className="space-y-3">
                  {['Brand New', 'Foreign Used', 'Locally Used'].map(type => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500" />
                      <span className="text-gray-600 group-hover:text-gray-900">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                <div className="h-56 bg-gray-200 relative overflow-hidden">
                  <div className="absolute top-4 right-4 bg-amber-500 text-slate-900 px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Escrow Only
                  </div>
                  <img 
                    src={`https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=800`} 
                    alt="Vehicle" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-1 text-gray-500 text-sm mb-2 font-medium">
                    <MapPin className="h-4 w-4" /> Ikeja, Lagos
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 mb-2">2021 Toyota Camry SE</h3>
                  <div className="flex gap-4 text-xs text-gray-600 mb-6 font-bold bg-gray-50 p-3 rounded-xl">
                    <span className="flex flex-col"><span className="text-gray-400 mb-1">MILEAGE</span> 45k km</span>
                    <span className="flex flex-col"><span className="text-gray-400 mb-1">CONDITION</span> Foreign Used</span>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <div>
                      <p className="font-black text-2xl text-slate-900">₦22.5M</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
