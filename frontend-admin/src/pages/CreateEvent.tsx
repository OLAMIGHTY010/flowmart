import { useState } from 'react';
import { 
  ChevronRight, 
  MapPin, 
  Package, 
  Users, 
  Save, 
  ArrowRight,
  Search,
  Check,
  AlertTriangle,
  Info,
  Activity
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { CoordinatorAnalyticsServices } from '../services/CoordinatorAnalyticsServices';

export default function CreateEvent() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('');
  const [description, setDescription] = useState('');
  const [targetPopulation, setTargetPopulation] = useState('2,500,000');
  const [priority, setPriority] = useState('High');

  const { data: zones } = useQuery({
    queryKey: ['coordWelfareZones'],
    queryFn: CoordinatorAnalyticsServices.getWelfareZones
  });

  const { data: inventory } = useQuery({
    queryKey: ['coordWelfareInventory'],
    queryFn: CoordinatorAnalyticsServices.getWelfareInventory
  });

  const [includedZones, setIncludedZones] = useState<Record<string, boolean>>({});

  const toggleZone = (id: string) => {
    setIncludedZones(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const activeZonesCount = zones ? zones.filter((z: any) => includedZones[z.id] !== false && z.included).length + Object.values(includedZones).filter(v => v).length - Object.values(includedZones).filter(v => !v).length : 0;

  const totalInventoryStock = inventory ? inventory.reduce((sum: number, item: any) => sum + Number((item.stock || '0').toString().replace(/,/g, '')), 0) : 0;
  const totalInventoryAllocated = inventory ? inventory.reduce((sum: number, item: any) => sum + Number((item.allocated || '0').toString().replace(/,/g, '')), 0) : 0;
  
  const estRidersNeeded = activeZonesCount > 0 ? activeZonesCount * 18 : 0;
  const allocationHealth = totalInventoryStock > 0 ? Math.min(100, Math.round((totalInventoryAllocated / totalInventoryStock) * 100)) : 0;
  const shortageItems = inventory ? inventory.filter((item: any) => item.status === 'Shortage Risk') : [];


  return (
    <div className="flex flex-col max-w-[1400px] mx-auto min-h-full pb-10 font-body">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-6">
        <span>Events</span>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="text-slate-800">Create Event</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form Area */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <div>
            <h1 className="text-2xl font-black text-slate-800 font-headings">Create Distribution Event</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Configure zones, inventory, and scheduling for a new welfare distribution</p>
          </div>

          {/* Stepper */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4 border-b border-slate-200 pb-4">
            <div className={`flex items-center gap-2 text-sm font-bold ${currentStep >= 1 ? 'text-[#16a34a]' : 'text-slate-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 1 ? 'bg-[#16a34a] text-white' : 'border-2 border-slate-200'}`}>1</div>
              Event Details
            </div>
            <div className={`w-6 sm:w-10 h-0.5 rounded-full ${currentStep >= 2 ? 'bg-[#16a34a]' : 'bg-slate-200'}`}></div>
            <div className={`flex items-center gap-2 text-sm font-bold ${currentStep >= 2 ? 'text-[#16a34a]' : 'text-slate-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 2 ? 'bg-[#16a34a] text-white' : 'border-2 border-slate-200'}`}>2</div>
              Zone & Inventory
            </div>
            <div className={`w-6 sm:w-10 h-0.5 rounded-full ${currentStep >= 3 ? 'bg-[#16a34a]' : 'bg-slate-200'}`}></div>
            <div className={`flex items-center gap-2 text-sm font-bold ${currentStep >= 3 ? 'text-[#16a34a]' : 'text-slate-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 3 ? 'bg-[#16a34a] text-white' : 'border-2 border-slate-200'}`}>3</div>
              Schedule & Review
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col gap-8">
            
            {/* Event Information */}
            {currentStep === 1 && (
              <section className="flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Event Information</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Enter the basic details for this distribution event</p>
                </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Event Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g., December Welfare Distribution" 
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] text-sm"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Event Type</label>
                  <select 
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] text-sm text-slate-600 bg-white"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                  >
                    <option value="">Select event type</option>
                    <option value="food">Food Relief</option>
                    <option value="medical">Medical Outreach</option>
                    <option value="general">General Supply</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
                <textarea 
                  rows={3}
                  placeholder="Describe the purpose and scope of this distribution event..." 
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] text-sm resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Population</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full pl-3 pr-20 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] text-sm"
                      value={targetPopulation}
                      onChange={(e) => setTargetPopulation(e.target.value)}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">attendees</div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Priority Level</label>
                  <div className="flex p-1 bg-slate-50 rounded-lg border border-slate-200 h-[42px]">
                    {['Low', 'Medium', 'High', 'Critical'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setPriority(level)}
                        className={`flex-1 text-xs font-bold rounded-md transition-colors ${
                          priority === level 
                            ? 'bg-[#16a34a] text-white shadow-sm' 
                            : 'text-slate-600 hover:bg-slate-200/50'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
            )}

            {currentStep === 2 && (
              <>
                {/* Zone Allocation */}
                <section className="flex flex-col gap-4">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Zone Allocation</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Select zones to include in this distribution event</p>
                </div>
                <div className="relative w-48 hidden sm:block">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search zones..." 
                    className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:border-[#16a34a] text-xs bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {zones?.map((zone: any) => {
                  const isIncluded = includedZones[zone.id] !== undefined ? includedZones[zone.id] : zone.included;
                  return (
                  <div 
                    key={zone.id} 
                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      isIncluded 
                        ? 'border-[#16a34a] bg-green-50/30' 
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                    onClick={() => toggleZone(zone.id)}
                  >
                    {isIncluded ? (
                      <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-[#16a34a] flex items-center justify-center">
                        <Check size={10} className="text-white" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="absolute top-3 right-3 w-4 h-4 rounded-full border-2 border-slate-200"></div>
                    )}
                    
                    <div className="flex items-center gap-2 mb-2 text-slate-800">
                      <div className={`p-1.5 rounded-md ${isIncluded ? 'bg-green-100 text-[#16a34a]' : 'bg-slate-100 text-slate-400'}`}>
                        <MapPin size={14} />
                      </div>
                      <span className="font-bold text-sm">{zone.name}</span>
                    </div>
                    
                    <p className="text-xs text-slate-500 font-medium mb-3">Est. {zone.pop} pop.</p>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold ${isIncluded ? 'text-[#16a34a]' : 'text-slate-400'}`}>
                        {isIncluded ? 'Included' : 'Excluded'}
                      </span>
                      {/* Toggle Switch */}
                      <div className={`w-8 h-4 rounded-full relative transition-colors ${isIncluded ? 'bg-[#16a34a]' : 'bg-slate-200'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isIncluded ? 'left-4.5 right-0.5' : 'left-0.5'}`}></div>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Inventory Assignment */}
            <section className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Inventory Assignment</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Allocate inventory items for this distribution event</p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-bold">Item Name</th>
                      <th className="py-3 px-4 font-bold">Available Stock</th>
                      <th className="py-3 px-4 font-bold">Allocated Qty</th>
                      <th className="py-3 px-4 font-bold">Unit</th>
                      <th className="py-3 px-4 font-bold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {inventory?.map((item: any, i: number) => (
                      <tr key={i}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded flex items-center justify-center bg-orange-50 text-orange-500">
                              <Package size={12} />
                            </div>
                            <span className="font-bold text-slate-800">{item.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-500">{item.stock}</td>
                        <td className="py-3 px-4">
                          <input 
                            type="text" 
                            className="w-24 px-2 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:border-[#16a34a] text-xs font-bold text-slate-800"
                            defaultValue={item.allocated}
                          />
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-500">{item.unit}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold inline-block
                            ${item.status === 'Sufficient' ? 'bg-green-50 text-[#16a34a]' : 'bg-red-50 text-red-500'}
                          `}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            </>
            )}

            {/* Schedule & Review Step */}
            {currentStep === 3 && (
              <section className="flex flex-col gap-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Schedule & Final Review</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Set the event date and review your configuration</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                     <label className="text-xs font-bold text-slate-700">Official Start Date & Time</label>
                     <input type="datetime-local" className="w-full sm:w-1/2 px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] text-sm bg-white" />
                  </div>
                </div>

                <div className="p-6 rounded-xl border border-slate-200 flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Configuration Summary</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 text-xs font-medium">Event Name</span>
                      <span className="font-bold text-slate-800">{eventName || 'Untitled Event'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 text-xs font-medium">Priority</span>
                      <span className="font-bold text-slate-800">{priority}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 text-xs font-medium">Zones</span>
                      <span className="font-bold text-slate-800">{activeZonesCount} selected</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 text-xs font-medium">Inventory</span>
                      <span className="font-bold text-slate-800">{totalInventoryAllocated.toLocaleString()} units</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Form Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              {currentStep > 1 ? (
                <button 
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
              ) : (
                <button 
                  onClick={() => {
                    alert('Event draft saved successfully!');
                    navigate('/admin/coordinator/dashboard');
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Save size={16} className="text-slate-400" /> Save Draft
                </button>
              )}
              
              {currentStep < 3 ? (
                <button 
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#16a34a] hover:bg-green-600 text-white text-sm font-bold transition-colors shadow-sm"
                >
                  Continue <ArrowRight size={16} />
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/admin/coordinator/live-tracker')}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#16a34a] hover:bg-green-600 text-white text-sm font-bold transition-colors shadow-sm"
                >
                  Publish Event <ArrowRight size={16} />
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Right Column: Event Summary */}
        <div className="lg:col-span-1">
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col gap-5 sticky top-24">
            
            <div>
              <div className="flex items-center gap-2 text-[#16a34a] mb-1">
                <Activity size={16} />
                <h3 className="font-bold text-sm">Event Summary</h3>
              </div>
              <p className="text-[11px] font-medium text-slate-500">Live preview of your configuration</p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-50 text-[#16a34a] rounded-md"><MapPin size={14} /></div>
                  <span className="text-xs font-bold text-slate-600">Total Zones Selected</span>
                </div>
                <span className="font-black text-slate-800">{zones ? activeZonesCount : 0}</span>
              </div>

              <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-50 text-[#16a34a] rounded-md"><Package size={14} /></div>
                  <span className="text-xs font-bold text-slate-600">Total Inventory</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-800">{totalInventoryStock.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-slate-400 ml-1">units</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-50 text-[#16a34a] rounded-md"><Users size={14} /></div>
                  <span className="text-xs font-bold text-slate-600">Est. Riders Needed</span>
                </div>
                <span className="font-black text-slate-800">{estRidersNeeded}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm">
              <div className="flex justify-between items-end mb-3">
                <span className="text-xs font-bold text-slate-700">Allocation Health</span>
                <span className="text-sm font-black text-[#16a34a]">{allocationHealth}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mb-2">
                <div className="bg-[#16a34a] h-full rounded-full transition-all" style={{ width: `${allocationHealth}%` }}></div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#16a34a]">
                <Check size={12} /> {allocationHealth >= 70 ? 'Good allocation coverage' : 'Low allocation coverage'}
              </div>
            </div>

            {shortageItems.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-red-600 flex gap-3">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider mb-1">Attention Required</h4>
                  <p className="text-[11px] font-medium leading-relaxed opacity-90">
                    {shortageItems.map((item: any) => item.name).join(', ')} allocation exceeds safe thresholds. Consider requesting additional supply.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-auto pt-4 border-t border-slate-200">
              <div className="flex gap-2 text-[11px] text-slate-500 font-medium">
                <Info size={14} className="shrink-0 text-[#16a34a]" />
                <p>Tip: Enable more zones to improve distribution coverage across the camp.</p>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
