import React, { useState, useEffect } from "react";
import { apiClient } from "@/services/api";
import {
  Sliders,
  Plus,
  CheckCircle2,
  Trash2,
  Sparkles,
  Flame,
  Layers,
  UtensilsCrossed,
  DollarSign,
  AlertOctagon,
  RefreshCw,
  Eye,
  FileText,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Tag,
  Clock,
  Zap,
  Info
} from "lucide-react";

interface ModifierOption {
  id: string;
  name: string;
  priceDeltaNgn: number;
  isDefault: boolean;
  inStock: boolean;
  calories: number;
  prepTimeDeltaMins: number;
}

interface ModifierGroup {
  id: string;
  name: string;
  description: string;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  linkedItemIds: string[];
  options: ModifierOption[];
  kitchenDisplayCode: string;
  updatedAt: string;
}

interface MenuItem {
  id: string;
  name: string;
  basePriceNgn: number;
  category: string;
}

interface ModifierStats {
  totalGroupsCount: number;
  totalOptionsCount: number;
  inStockOptionsCount: number;
  attachedItemsCount: number;
  lastConfiguredAt: string;
}

export default function VendorRecipeModifiers() {
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [stats, setStats] = useState<ModifierStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New Group Modal State
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newMinSelect, setNewMinSelect] = useState(1);
  const [newMaxSelect, setNewMaxSelect] = useState(1);
  const [newIsRequired, setNewIsRequired] = useState(true);

  // Quick Add Option State for an active group
  const [addingOptionToGroupId, setAddingOptionToGroupId] = useState<string | null>(null);
  const [newOptName, setNewOptName] = useState("");
  const [newOptPriceDelta, setNewOptPriceDelta] = useState(0);
  const [newOptPrepDelta, setNewOptPrepDelta] = useState(0);
  const [newOptCalories, setNewOptCalories] = useState(0);

  // Interactive Sandbox Simulator State
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [sandboxSelections, setSandboxSelections] = useState<Record<string, string[]>>({});
  const [specialInstructions, setSpecialInstructions] = useState("");

  const fetchData = async () => {
    try {
      const res = await apiClient.get("/vendor/modifiers");
      if (res.data.success) {
        setModifierGroups(res.data.modifierGroups || []);
        setMenuItems(res.data.menuItems || []);
        setStats(res.data.stats || null);
        if (res.data.menuItems?.length > 0 && !selectedMenuItem) {
          setSelectedMenuItem(res.data.menuItems[0]);
          // Initialize sandbox defaults
          initializeSandboxDefaults(res.data.modifierGroups || []);
        }
      }
    } catch (err) {
      console.error("Failed to load modifiers data", err);
    } finally {
      setLoading(false);
    }
  };

  const initializeSandboxDefaults = (groups: ModifierGroup[]) => {
    const defaults: Record<string, string[]> = {};
    groups.forEach((g) => {
      const def = g.options.find((o) => o.isDefault && o.inStock);
      if (def) {
        defaults[g.id] = [def.id];
      } else if (g.isRequired && g.options.length > 0) {
        defaults[g.id] = [g.options[0].id];
      } else {
        defaults[g.id] = [];
      }
    });
    setSandboxSelections(defaults);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStock = async (groupId: string, optionId: string) => {
    try {
      const res = await apiClient.post(`/vendor/modifiers/${groupId}/options/${optionId}/toggle-stock`);
      if (res.data.success) {
        setModifierGroups((prev) =>
          prev.map((g) => (g.id === groupId ? res.data.group : g))
        );
        setSuccessMessage(res.data.message);
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      alert("Failed to toggle option stock: " + (err.response?.data?.message || err.message));
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const res = await apiClient.post("/vendor/modifiers", {
        name: newGroupName,
        description: newGroupDesc,
        minSelections: newMinSelect,
        maxSelections: newMaxSelect,
        isRequired: newIsRequired,
        linkedItemIds: [selectedMenuItem?.id || "prod-101"],
        options: [
          {
            name: "Standard Option",
            priceDeltaNgn: 0,
            isDefault: true,
            inStock: true,
            calories: 100,
            prepTimeDeltaMins: 0
          }
        ]
      });

      if (res.data.success) {
        setModifierGroups((prev) => [...prev, res.data.group]);
        setIsCreatingGroup(false);
        setNewGroupName("");
        setNewGroupDesc("");
        setSuccessMessage(res.data.message);
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      alert("Failed to create group: " + (err.response?.data?.message || err.message));
    }
  };

  const handleAddOption = async (groupId: string) => {
    if (!newOptName.trim()) return;

    const group = modifierGroups.find((g) => g.id === groupId);
    if (!group) return;

    const newOption: ModifierOption = {
      id: "OPT-" + Math.floor(100 + Math.random() * 900),
      name: newOptName.trim(),
      priceDeltaNgn: Number(newOptPriceDelta) || 0,
      isDefault: false,
      inStock: true,
      calories: Number(newOptCalories) || 0,
      prepTimeDeltaMins: Number(newOptPrepDelta) || 0
    };

    const updatedOptions = [...group.options, newOption];

    try {
      const res = await apiClient.put(`/vendor/modifiers/${groupId}`, {
        options: updatedOptions
      });

      if (res.data.success) {
        setModifierGroups((prev) =>
          prev.map((g) => (g.id === groupId ? res.data.group : g))
        );
        setAddingOptionToGroupId(null);
        setNewOptName("");
        setNewOptPriceDelta(0);
        setNewOptPrepDelta(0);
        setNewOptCalories(0);
        setSuccessMessage(`Option "${newOption.name}" added to ${group.name}`);
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      alert("Failed to add option: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this modifier group?")) return;
    try {
      const res = await apiClient.delete(`/vendor/modifiers/${groupId}`);
      if (res.data.success) {
        setModifierGroups((prev) => prev.filter((g) => g.id !== groupId));
        setSuccessMessage(res.data.message);
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      alert("Failed to delete group: " + (err.response?.data?.message || err.message));
    }
  };

  // Sandbox calculations
  const calculateSandboxTotal = () => {
    let total = selectedMenuItem ? selectedMenuItem.basePriceNgn : 0;
    modifierGroups.forEach((group) => {
      const selectedOptionIds = sandboxSelections[group.id] || [];
      selectedOptionIds.forEach((optId) => {
        const option = group.options.find((o) => o.id === optId);
        if (option && option.inStock) {
          total += option.priceDeltaNgn;
        }
      });
    });
    return total;
  };

  const calculateSandboxPrepTime = () => {
    let time = 15; // base 15 mins
    modifierGroups.forEach((group) => {
      const selectedOptionIds = sandboxSelections[group.id] || [];
      selectedOptionIds.forEach((optId) => {
        const option = group.options.find((o) => o.id === optId);
        if (option) {
          time += option.prepTimeDeltaMins;
        }
      });
    });
    return time;
  };

  const handleSandboxOptionToggle = (group: ModifierGroup, option: ModifierOption) => {
    if (!option.inStock) return;

    setSandboxSelections((prev) => {
      const current = prev[group.id] || [];
      if (group.maxSelections === 1) {
        // Radio single-choice
        return { ...prev, [group.id]: [option.id] };
      } else {
        // Multi-select checkbox
        if (current.includes(option.id)) {
          // Uncheck
          return { ...prev, [group.id]: current.filter((id) => id !== option.id) };
        } else {
          // Check if below max
          if (current.length < group.maxSelections) {
            return { ...prev, [group.id]: [...current, option.id] };
          }
          return prev;
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ═══ TOP BANNER: SMART RECIPE MODIFIER CONFIGURATOR ═══ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 md:p-8 text-white shadow-xl shadow-indigo-950/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Chowdeck-Grade Recipe Configurator • FlowMart Merchant Kitchen 2026
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Smart Recipe Modifier & Customizer Studio
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Build dynamic recipe choices, protein swaps, spice heat scales, and upsell sides. Seamlessly syncs customer cart choices with your Kitchen Display System (KDS) & thermal tickets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCreatingGroup(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Modifier Group</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-sm flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-xs text-emerald-300 hover:text-white underline">
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* ═══ KPI METRIC CARDS ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-white shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Modifier Groups</span>
            <Layers className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300">
            {stats ? stats.totalGroupsCount : modifierGroups.length}{" "}
            <span className="text-xs font-normal text-slate-400">Configured</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <span>Proteins, Spice levels, Sides & Drinks</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-white shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Options</span>
            <Tag className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300">
            {stats ? stats.totalOptionsCount : 16}{" "}
            <span className="text-xs font-normal text-slate-400">({stats ? stats.inStockOptionsCount : 15} In Stock)</span>
          </div>
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Instant 86'd stock toggle enabled</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-white shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Linked Menu Items</span>
            <UtensilsCrossed className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">
            {stats ? stats.attachedItemsCount : menuItems.length}{" "}
            <span className="text-xs font-normal text-slate-400">Attached</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <span>Automatic cart validation</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-white shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Upsell Boost</span>
            <TrendingUp className="w-5 h-5 text-violet-400" />
          </div>
          <div className="text-2xl font-black text-violet-300">+₦1,850</div>
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1 font-medium">
            <span>+38% average ticket value growth</span>
          </div>
        </div>
      </div>

      {/* ═══ MAIN WORKSPACE: LEFT GROUPS CONFIGURATOR vs RIGHT SANDBOX SIMULATOR ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: MODIFIER GROUPS & OPTIONS (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Modifier Groups & Options ({modifierGroups.length})
            </h3>
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="space-y-4">
            {modifierGroups.map((group) => {
              const isAddingOption = addingOptionToGroupId === group.id;
              return (
                <div
                  key={group.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg space-y-4 transition-all hover:border-indigo-500/30"
                >
                  {/* Group Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-400">{group.id}</span>
                        <h4 className="text-sm font-bold text-white">{group.name}</h4>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          [{group.kitchenDisplayCode}]
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{group.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          group.isRequired
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-slate-800 text-slate-300 border border-slate-700"
                        }`}
                      >
                        {group.isRequired
                          ? `Required (Pick ${group.minSelections})`
                          : `Optional (Max ${group.maxSelections})`}
                      </span>

                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="space-y-2">
                    {group.options.map((option) => (
                      <div
                        key={option.id}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-colors ${
                          option.inStock
                            ? "bg-slate-800/40 border-slate-700/60 text-slate-200"
                            : "bg-slate-950/60 border-rose-900/30 text-slate-500 line-through"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] text-slate-500">{option.id}</span>
                          <div>
                            <span className="font-semibold text-white">{option.name}</span>
                            {option.isDefault && (
                              <span className="ml-2 px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                                Default
                              </span>
                            )}
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                              {option.calories > 0 && <span>{option.calories} kcal</span>}
                              {option.prepTimeDeltaMins > 0 && (
                                <span className="flex items-center gap-1 text-amber-400">
                                  <Clock className="w-3 h-3" />
                                  +{option.prepTimeDeltaMins}m prep
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`font-mono font-bold ${
                              option.priceDeltaNgn === 0
                                ? "text-slate-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {option.priceDeltaNgn === 0
                              ? "Included"
                              : `+₦${option.priceDeltaNgn.toLocaleString()}`}
                          </span>

                          {/* In-Stock / 86'd Toggle Button */}
                          <button
                            onClick={() => handleToggleStock(group.id, option.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              option.inStock
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-300"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-emerald-500/20 hover:text-emerald-300"
                            }`}
                          >
                            {option.inStock ? "In Stock" : "86'd"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Inline Add Option Form */}
                  {isAddingOption ? (
                    <div className="p-4 rounded-xl bg-slate-800/80 border border-indigo-500/30 space-y-3 animate-fadeIn">
                      <h5 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        Add New Option to {group.name}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Option Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Extra Moi Moi"
                            value={newOptName}
                            onChange={(e) => setNewOptName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Price Delta (₦)</label>
                          <input
                            type="number"
                            placeholder="0 for free"
                            value={newOptPriceDelta}
                            onChange={(e) => setNewOptPriceDelta(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Prep Time Delta (Mins)</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={newOptPrepDelta}
                            onChange={(e) => setNewOptPrepDelta(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Calories (kcal)</label>
                          <input
                            type="number"
                            placeholder="120"
                            value={newOptCalories}
                            onChange={(e) => setNewOptCalories(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setAddingOptionToGroupId(null)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddOption(group.id)}
                          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                        >
                          Save Option
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingOptionToGroupId(group.id)}
                      className="w-full py-2 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500/50 text-slate-400 hover:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Option to this Group</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE CUSTOMER EXPERIENCE & KITCHEN TICKET SANDBOX (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-400" />
              Live CX & Kitchen Ticket Simulator
            </h3>
            <span className="text-xs text-slate-400">Interactive Preview</span>
          </div>

          {/* Dish Selector */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Select Base Dish
              </label>
              <select
                value={selectedMenuItem?.id || ""}
                onChange={(e) => {
                  const item = menuItems.find((m) => m.id === e.target.value);
                  if (item) setSelectedMenuItem(item);
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
              >
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (Base ₦{item.basePriceNgn.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Flow Simulator Box */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Customer Options Form
                </span>
                <span className="text-xs text-slate-400">FlowMart Customer View</span>
              </div>

              {modifierGroups.map((group) => {
                const selected = sandboxSelections[group.id] || [];
                return (
                  <div key={group.id} className="space-y-2 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{group.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {group.maxSelections === 1
                          ? "(Choose 1)"
                          : `(Choose up to ${group.maxSelections})`}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {group.options.map((option) => {
                        const isChecked = selected.includes(option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleSandboxOptionToggle(group, option)}
                            disabled={!option.inStock}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-xs text-left transition-all ${
                              isChecked
                                ? "bg-indigo-600/20 border border-indigo-500/50 text-white"
                                : option.inStock
                                ? "bg-slate-900/60 border border-slate-800 text-slate-300 hover:bg-slate-850"
                                : "bg-slate-950/60 border border-slate-800 text-slate-600 cursor-not-allowed line-through"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-3.5 h-3.5 rounded-${group.maxSelections === 1 ? "full" : "md"} border flex items-center justify-center text-[9px] ${
                                  isChecked
                                    ? "bg-indigo-600 border-indigo-400 text-white"
                                    : "border-slate-600"
                                }`}
                              >
                                {isChecked && "✓"}
                              </span>
                              <span>{option.name}</span>
                            </div>

                            <span className="font-mono text-[11px] text-emerald-400 font-semibold">
                              {option.priceDeltaNgn === 0
                                ? "+₦0"
                                : `+₦${option.priceDeltaNgn.toLocaleString()}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Special Instructions Note */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Chef Prep Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Extra spicy, packaging separate"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Price & Prep Summary Bar */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Estimated Prep</span>
                  <span className="text-sm font-extrabold text-amber-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {calculateSandboxPrepTime()} Mins
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Dynamic Total</span>
                  <span className="text-lg font-black text-emerald-400">
                    ₦{calculateSandboxTotal().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Live KDS Ticket Receipt Output */}
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                Live KDS Kitchen Thermal Ticket Output
              </span>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1.5">
                <div className="text-center font-bold text-indigo-400 pb-1 border-b border-slate-800">
                  ── FLOWMART KDS RECEIPT #KDS-4819 ──
                </div>
                <div className="text-slate-400">TABLE: Online App CX • TIME: {new Date().toLocaleTimeString()}</div>
                <div className="font-bold text-white pt-1">
                  1x {selectedMenuItem?.name}
                </div>
                {modifierGroups.map((g) => {
                  const selectedIds = sandboxSelections[g.id] || [];
                  return selectedIds.map((optId) => {
                    const opt = g.options.find((o) => o.id === optId);
                    if (!opt) return null;
                    return (
                      <div key={opt.id} className="text-emerald-400 pl-3">
                        &gt;&gt; [{g.kitchenDisplayCode}]: {opt.name} ({opt.priceDeltaNgn > 0 ? `+₦${opt.priceDeltaNgn}` : "INCL"})
                      </div>
                    );
                  });
                })}
                {specialInstructions && (
                  <div className="text-amber-300 pl-3 italic">
                    ** NOTE: "{specialInstructions}"
                  </div>
                )}
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white">
                  <span>TOTAL BILL:</span>
                  <span className="text-emerald-400">₦{calculateSandboxTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CREATE GROUP MODAL ═══ */}
      {isCreatingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Create New Recipe Modifier Group
              </h3>
              <button
                onClick={() => setIsCreatingGroup(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Choose Choice of Protein or Extra Garnishes"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Customer Description</label>
                <input
                  type="text"
                  placeholder="e.g. Select up to 2 extra sides to complete your meal"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Min Selections</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={newMinSelect}
                    onChange={(e) => setNewMinSelect(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400">1 = required, 0 = optional</span>
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Max Selections</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newMaxSelect}
                    onChange={(e) => setNewMaxSelect(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400">1 = single choice, &gt;1 = multi</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isRequiredCheckbox"
                  checked={newIsRequired}
                  onChange={(e) => setNewIsRequired(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="isRequiredCheckbox" className="text-slate-300 text-xs">
                  Mandatory selection before customer can add dish to cart
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingGroup(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ FOOTER BRANDING ═══ */}
      <div className="text-center py-4 border-t border-slate-800/60 text-xs text-slate-500">
        FlowMart Merchant Recipe Studio • Chowdeck-Grade Kitchen Architecture © 2026 FlowMart Inc.
      </div>
    </div>
  );
}
