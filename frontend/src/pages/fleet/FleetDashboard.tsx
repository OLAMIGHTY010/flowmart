import { Users, Bike, TrendingUp, Map } from "lucide-react";

export default function FleetDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-amber-500 text-slate-900 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bike className="h-8 w-8 text-slate-900" />
            <div>
              <h1 className="text-xl font-bold">Swift Logistics Fleet</h1>
              <p className="text-slate-800 text-sm font-medium">Fleet Manager Portal</p>
            </div>
          </div>
          <button className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors">
            Add New Rider
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-8 space-y-8">
        
        {/* Fleet Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 text-gray-500 mb-2">
              <Users className="h-5 w-5" />
              <p className="font-medium">Total Riders</p>
            </div>
            <h2 className="text-3xl font-black text-gray-900">24</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 text-green-600 mb-2">
              <Bike className="h-5 w-5" />
              <p className="font-medium">Active Now</p>
            </div>
            <h2 className="text-3xl font-black text-gray-900">18</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 text-blue-600 mb-2">
              <TrendingUp className="h-5 w-5" />
              <p className="font-medium">Today's Earnings</p>
            </div>
            <h2 className="text-3xl font-black text-gray-900">₦145,500</h2>
          </div>
          <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 text-white">
            <p className="text-slate-400 font-medium mb-2">Manager Wallet</p>
            <h2 className="text-3xl font-black mb-1">₦850,200</h2>
            <p className="text-xs text-amber-400">Available to withdraw</p>
          </div>
        </section>

        {/* Live Map Placeholder & Rider List */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Map className="h-5 w-5 text-gray-400" /> Live Fleet Tracking
              </h3>
            </div>
            <div className="flex-1 bg-gray-100 min-h-[400px] flex items-center justify-center">
              {/* In a real app, integrate Google Maps or Mapbox here */}
              <div className="text-center text-gray-400">
                <Map className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Map Integration Required</p>
                <p className="text-sm">Showing 18 active riders in Lagos area</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">Active Riders</h3>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto max-h-[400px]">
              {[
                { name: "Samuel O.", status: "Delivering", earnings: "₦12,500" },
                { name: "Chinedu E.", status: "Available", earnings: "₦8,200" },
                { name: "Idris M.", status: "Offline", earnings: "₦0" },
                { name: "Tochukwu A.", status: "Delivering", earnings: "₦15,000" }
              ].map((rider, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">
                      {rider.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{rider.name}</p>
                      <p className={`text-xs font-medium ${rider.status === 'Delivering' ? 'text-amber-600' : rider.status === 'Available' ? 'text-green-600' : 'text-gray-400'}`}>
                        {rider.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-gray-900">{rider.earnings}</p>
                    <p className="text-xs text-gray-500">Today</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>

      </main>
    </div>
  );
}
