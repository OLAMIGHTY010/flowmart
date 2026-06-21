import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { Plus, Edit2, CheckCircle2 } from 'lucide-react';
import CreateZoneModal from '@/components/logistics/CreateZoneModal';
import CreateRuleModal from '@/components/logistics/CreateRuleModal';
import EditZonePricingModal from '@/components/logistics/EditZonePricingModal';
import EditRuleModal from '@/components/logistics/EditRuleModal';

const API_URL = import.meta.env.VITE_API_URL;

const formatCondition = (cond: any) => {
  if (!cond) return 'N/A';
  let parsed = cond;
  if (typeof cond === 'string') {
    try { parsed = JSON.parse(cond); } catch (e) { return cond; }
  }
  
  if (parsed.trigger === 'time') {
    return `Time: ${parsed.startTime || 'start'} to ${parsed.endTime || 'end'}`;
  } else if (parsed.trigger === 'weather') {
    return `Weather: ${parsed.condition || 'any'}`;
  } else if (parsed.trigger === 'event') {
    return `Event: ${parsed.eventName || 'custom'}`;
  } else {
    const entries = Object.entries(parsed).filter(([k]) => k !== 'trigger');
    if (entries.length === 0) return parsed.trigger || 'Custom';
    return `${parsed.trigger || 'Rule'}: ${entries.map(([k, v]) => `${k}=${v}`).join(', ')}`;
  }
};

export default function LogisticsPricing() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'zones' | 'rules'>('zones');
  const [zones, setZones] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);

  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<any | null>(null);
  const [editingRule, setEditingRule] = useState<any | null>(null);

  const role = user?.role;
  
  const canCreateZone = role === 'camp_logistics_coordinator' || role === 'zone_coordinator';
  const canCreateRule = role === 'finance';
  const canEditZone = role === 'camp_logistics_coordinator' || role === 'finance' || role === 'zone_coordinator';
  const canEditRule = role === 'finance';

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (activeTab === 'zones') {
        const res = await axios.get(`${API_URL}/logistics/zones`, { headers: { Authorization: `Bearer ${token}` } });
        setZones(res.data.data);
      } else {
        const res = await axios.get(`${API_URL}/logistics/rules`, { headers: { Authorization: `Bearer ${token}` } });
        setRules(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load logistics pricing data", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Logistics Pricing Engine</h1>
        {activeTab === 'zones' && canCreateZone && (
          <button 
            onClick={() => setIsZoneModalOpen(true)}
            className="bg-[#15803d] text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-green-600 transition"
          >
            <Plus size={18} />
            Create Zone
          </button>
        )}
        {activeTab === 'rules' && canCreateRule && (
          <button 
            onClick={() => setIsRuleModalOpen(true)}
            className="bg-[#15803d] text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-green-600 transition"
          >
            <Plus size={18} />
            Create Rule
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          className={`pb-3 font-medium text-sm transition-all ${
            activeTab === 'zones' ? 'border-b-2 border-[#15803d] text-[#15803d]' : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('zones')}
        >
          Delivery Zones
        </button>
        <button
          className={`pb-3 font-medium text-sm transition-all ${
            activeTab === 'rules' ? 'border-b-2 border-[#15803d] text-[#15803d]' : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('rules')}
        >
          Pricing Rules (Surges & Adjustments)
        </button>
      </div>

      {/* Content */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        {activeTab === 'zones' && (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
              <thead>
                <tr className="border-b bg-slate-50 text-slate-600">
                  <th className="p-3">Zone Name</th>
                  <th className="p-3">Base Fee</th>
                  <th className="p-3">Per Km Fee</th>
                  <th className="p-3">Rider Share</th>
                  <th className="p-3">Platform Share</th>
                  <th className="p-3">Status</th>
                  {canEditZone && <th className="p-3">Actions</th>}
                </tr>
              </thead>
            <tbody>
              {zones.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-slate-500">No delivery zones configured.</td></tr>
              ) : (
                zones.map((zone) => (
                  <tr key={zone.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-medium">{zone.zoneName}</td>
                    <td className="p-3">₦{zone.baseFee}</td>
                    <td className="p-3">₦{zone.perKmFee}</td>
                    <td className="p-3">{zone.riderCommissionPct}%</td>
                    <td className="p-3">{zone.platformCommissionPct}%</td>
                    <td className="p-3">
                      {zone.active ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-100 px-2 py-1 rounded-full w-max">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs font-bold bg-slate-100 px-2 py-1 rounded-full w-max">Inactive</span>
                      )}
                    </td>
                    {canEditZone && (
                      <td className="p-3">
                        <button 
                          onClick={() => setEditingZone(zone)}
                          className="text-[#15803d] hover:text-green-700 p-1 bg-green-50 rounded"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
              <thead>
                <tr className="border-b bg-slate-50 text-slate-600">
                  <th className="p-3">Rule Type</th>
                  <th className="p-3">Condition</th>
                  <th className="p-3">Adjustment</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  {canEditRule && <th className="p-3">Actions</th>}
                </tr>
              </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-500">No pricing rules configured.</td></tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-medium capitalize">{rule.ruleType.replace('_', ' ')}</td>
                    <td className="p-3 font-mono text-xs">{formatCondition(rule.condition)}</td>
                    <td className="p-3 font-medium text-[#15803d]">
                      {rule.valueType === 'percentage' ? `+${rule.value}%` : `+₦${rule.value}`}
                    </td>
                    <td className="p-3">{rule.priority}</td>
                    <td className="p-3">
                      {rule.active ? (
                        <span className="text-green-600 text-xs font-bold bg-green-100 px-2 py-1 rounded-full w-max">Active</span>
                      ) : (
                        <span className="text-slate-500 text-xs font-bold bg-slate-100 px-2 py-1 rounded-full w-max">Inactive</span>
                      )}
                    </td>
                    {canEditRule && (
                      <td className="p-3">
                        <button 
                          onClick={() => setEditingRule(rule)}
                          className="text-[#15803d] hover:text-green-700 p-1 bg-green-50 rounded"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <CreateZoneModal 
        isOpen={isZoneModalOpen} 
        onClose={() => setIsZoneModalOpen(false)} 
        onSuccess={() => {
          setIsZoneModalOpen(false);
          fetchData();
        }}
      />

      <CreateRuleModal 
        isOpen={isRuleModalOpen} 
        onClose={() => setIsRuleModalOpen(false)} 
        onSuccess={() => {
          setIsRuleModalOpen(false);
          fetchData();
        }}
        zones={zones}
      />

      <EditZonePricingModal 
        isOpen={!!editingZone}
        zone={editingZone}
        onClose={() => setEditingZone(null)}
        onSuccess={() => {
          setEditingZone(null);
          fetchData();
        }}
      />

      <EditRuleModal 
        isOpen={!!editingRule}
        rule={editingRule}
        zones={zones}
        onClose={() => setEditingRule(null)}
        onSuccess={() => {
          setEditingRule(null);
          fetchData();
        }}
      />
    </div>
  );
}
