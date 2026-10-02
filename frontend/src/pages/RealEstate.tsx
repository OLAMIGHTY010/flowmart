import { useState } from "react";
import { Building2, Search, Filter, ShieldCheck, MapPin } from "lucide-react";

export default function RealEstate() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <section className="bg-gradient-to-r from-blue-900 to-indigo-900 pb-12 pt-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="font-bold text-2xl tracking-tight">FlowMart Real Estate</h2>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            Premium Properties,<br/><span className="text-blue-300">Scam-Free Escrow.</span>
          </h1>

          <div className="relative max-w-2xl">
            <div className="flex items-center bg-white rounded-2xl shadow-xl p-2 pl-5 focus-within:ring-4 focus-within:ring-blue-500/30">
              <Search className="h-6 w-6 text-gray-400" />
              <input
                type="text"
                placeholder="Search locations, property types..."
                className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-4 text-gray-800 text-lg outline-none"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-colors">
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
                <label className="font-semibold text-gray-700 mb-3 block">Property Type</label>
                <div className="space-y-3">
                  {['Apartment', 'Duplex', 'Commercial', 'Land'].map(type => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-gray-600 group-hover:text-gray-900">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 mb-3 block">Price Range (₦)</label>
                <input type="range" className="w-full accent-blue-600" />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>1M</span>
                  <span>500M+</span>
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
                <div className="h-60 bg-gray-200 relative overflow-hidden">
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm">
                    For Sale
                  </div>
                  <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Escrow Only
                  </div>
                  <img 
                    src={`https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800`} 
                    alt="Property" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
                    <MapPin className="h-4 w-4" /> Lekki Phase 1, Lagos
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 mb-2">Luxury 4 Bed Detached Duplex</h3>
                  <div className="flex gap-4 text-sm text-gray-600 mb-6 font-medium">
                    <span>🛏 4 Beds</span>
                    <span>🛁 5 Baths</span>
                    <span>📐 450 sqm</span>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Asking Price</p>
                      <p className="font-black text-2xl text-blue-700">₦250M</p>
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
