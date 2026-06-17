import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronDown, MoreVertical, Bike, Navigation, Clock, CheckCircle } from 'lucide-react';
import { RiderServices, type RiderItem } from '@/services/RiderServices';
import RiderDetailsSidebar from '@/components/riders/RiderDetailsSidebar';

export default function RiderManagement() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedRider, setSelectedRider] = useState<RiderItem | null>(null);

  const limit = 10;

  const { data: stats } = useQuery({
    queryKey: ['riderStats'],
    queryFn: RiderServices.getStats
  });

  const { data: ridersData, isLoading: isRidersLoading } = useQuery({
    queryKey: ['riders', page, limit, search, statusFilter],
    queryFn: () => RiderServices.getRiders(page, limit, search, statusFilter)
  });

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-headings">Rider Management</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">1,380 Riders Registered · November Welfare Distribution 2024</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm font-bold text-slate-500 mb-1">Total Riders</div>
          <div className="text-2xl font-black text-slate-800">{stats?.totalRiders.toLocaleString() || '1,380'}</div>
          <div className="text-xs text-slate-400 mt-2">Across all welfare zones</div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="text-sm font-bold text-slate-500 mb-1 flex items-center gap-1">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div> Active Now
          </div>
          <div className="text-2xl font-black text-slate-800">{stats?.activeNow.toLocaleString() || '1,204'}</div>
          <div className="text-xs text-success font-medium mt-2 flex items-center gap-1">
            <Navigation size={12} /> On the move
          </div>
          <div className="absolute -right-4 -bottom-4 text-success opacity-10">
            <Bike size={64} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm font-bold text-slate-500 mb-1">Completed Deliveries</div>
          <div className="text-2xl font-black text-slate-800">{stats?.completedDeliveries.toLocaleString() || '847'}</div>
          <div className="text-xs text-success font-medium mt-2 flex items-center gap-1">
            <CheckCircle size={12} /> Today's verified drops
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm font-bold text-slate-500 mb-1">Avg. Deliveries/Rider</div>
          <div className="text-2xl font-black text-slate-800">{stats?.avgDeliveriesPerRider.toLocaleString() || '3.2'}</div>
          <div className="text-xs text-blue-500 font-medium mt-2 flex items-center gap-1">
            <Clock size={12} /> Above average target
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-[500px]">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[250px] lg:max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search riders by name or ID..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full focus:outline-none focus:border-success focus:ring-1 focus:ring-success"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="appearance-none border border-slate-200 bg-white px-4 py-2 pr-8 rounded-lg text-sm font-medium text-slate-600 focus:outline-none focus:border-success cursor-pointer"
              >
                <option value="All">Status: All</option>
                <option value="Active">Active</option>
                <option value="Offline">Offline</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select className="appearance-none border border-slate-200 bg-white px-4 py-2 pr-8 rounded-lg text-sm font-medium text-slate-600 focus:outline-none focus:border-success cursor-pointer">
                <option value="All">Performance: All</option>
                <option value="High">Top Performers</option>
                <option value="Low">Needs Review</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[1000px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-5 py-4">Rider ID</th>
                <th className="px-5 py-4">Rider Name</th>
                <th className="px-5 py-4">Phone</th>
                <th className="px-5 py-4">Current Location</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Deliveries Today</th>
                <th className="px-5 py-4">Efficiency Score</th>
                <th className="px-5 py-4">Last Activity</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isRidersLoading ? (
                <tr><td colSpan={9} className="text-center py-10 text-slate-500">Loading riders...</td></tr>
              ) : ridersData?.data && ridersData.data.length > 0 ? (
                ridersData.data.map((rider) => (
                  <tr 
                    key={rider.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedRider(rider)}
                  >
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-700">{rider.riderId}</td>
                    <td className="px-5 py-4 font-bold text-slate-800">{rider.fullName}</td>
                    <td className="px-5 py-4 text-slate-500">{rider.phone}</td>
                    <td className="px-5 py-4 text-slate-700 font-medium">{rider.currentLocation}</td>
                    <td className="px-5 py-4">
                      {rider.status === 'active' ? (
                        <span className="text-success font-bold text-[10px] bg-green-50 px-2 py-0.5 rounded border border-green-100 uppercase">Active</span>
                      ) : (
                        <span className="text-orange-500 font-bold text-[10px] bg-orange-50 px-2 py-0.5 rounded border border-orange-100 uppercase">Idle</span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-800">{rider.deliveriesToday}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-success rounded-full" 
                            style={{ width: `${rider.efficiencyScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600">{rider.efficiencyScore}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{rider.lastActivity}</td>
                    <td className="px-5 py-4 text-slate-400">
                      <button className="hover:text-slate-700 p-1 rounded transition-colors" onClick={(e) => { e.stopPropagation(); setSelectedRider(rider); }}>
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={9} className="text-center py-10 text-slate-500">No riders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {ridersData?.pagination && ridersData.pagination.totalPages > 1 && (
          <div className="mt-auto border-t border-slate-200 p-4 flex justify-between items-center bg-slate-50">
            <span className="text-sm text-slate-500 font-medium">
              Page {page} of {ridersData.pagination.totalPages} · {ridersData.pagination.total} riders
            </span>
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 text-sm font-bold rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Prev
              </button>
              <button 
                disabled={page === ridersData.pagination.totalPages}
                onClick={() => setPage(p => Math.min(ridersData.pagination.totalPages, p + 1))}
                className="px-3 py-1 text-sm font-bold rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      {selectedRider && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedRider(null)} />
          <RiderDetailsSidebar rider={selectedRider} onClose={() => setSelectedRider(null)} />
        </>
      )}
    </div>
  );
}
