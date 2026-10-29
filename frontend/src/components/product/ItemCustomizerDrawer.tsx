import { useState, useMemo } from "react";
import { X, Plus, Minus, Check, Sparkles, AlertCircle, ShoppingBag } from "lucide-react";
import type { Product } from "@/types/product";
import type { SelectedModifier } from "@/stores/cartStore";

interface Props {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (customizedItem: {
    product: Product;
    quantity: number;
    selectedModifiers: SelectedModifier[];
    specialInstructions: string;
    unitPriceWithModifiers: number;
  }) => void;
}

interface ModifierOption {
  id: string;
  name: string;
  price: number;
  isDefault?: boolean;
}

interface ModifierGroup {
  id: string;
  name: string;
  description?: string;
  required: boolean;
  min?: number;
  max?: number;
  options: ModifierOption[];
}

export default function ItemCustomizerDrawer({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: Props) {
  const isFood = product.productType === "food" || !product.productType;

  // Build modifier groups (use product.modifiers if available, otherwise generate smart Chowdeck-style defaults for food)
  const groups: ModifierGroup[] = useMemo(() => {
    if (product.modifiers && Array.isArray(product.modifiers) && product.modifiers.length > 0) {
      return product.modifiers;
    }

    if (isFood) {
      return [
        {
          id: "protein",
          name: "Choice of Protein / Main",
          description: "Select 1 required protein",
          required: true,
          min: 1,
          max: 1,
          options: [
            { id: "p1", name: "Crispy Fried Chicken", price: 1500, isDefault: true },
            { id: "p2", name: "Peppered Beef Chunk", price: 1800 },
            { id: "p3", name: "Smoked Golden Turkey", price: 2500 },
            { id: "p4", name: "Grilled Croaker Fish", price: 2200 },
            { id: "p5", name: "No Protein (Base Only)", price: 0 },
          ],
        },
        {
          id: "sides",
          name: "Add Delicious Extras & Sides",
          description: "Optional • Select any",
          required: false,
          max: 4,
          options: [
            { id: "s1", name: "Fried Sweet Plantain (Dodo)", price: 700 },
            { id: "s2", name: "Creamy Garden Coleslaw", price: 500 },
            { id: "s3", name: "Boiled Farm Egg", price: 400 },
            { id: "s4", name: "Extra Signature Pepper Sauce", price: 350 },
          ],
        },
        {
          id: "drinks",
          name: "Chilled Drink Pairing",
          description: "Optional • Refreshing beverage",
          required: false,
          max: 1,
          options: [
            { id: "d1", name: "Chilled Coca-Cola (50cl)", price: 500 },
            { id: "d2", name: "Chilled Fanta Orange (50cl)", price: 500 },
            { id: "d3", name: "Fresh Chapman Drink (Cup)", price: 1200 },
            { id: "d4", name: "Pure Bottled Water (75cl)", price: 300 },
          ],
        },
      ];
    }

    return [
      {
        id: "handling",
        name: "Special Packaging & Handling",
        description: "Custom dispatch preference",
        required: false,
        max: 2,
        options: [
          { id: "h1", name: "Extra Fragile Bubble Wrap", price: 300 },
          { id: "h2", name: "Gift Bag with Ribbon", price: 800 },
        ],
      },
    ];
  }, [product, isFood]);

  // Initial selection state
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    groups.forEach((g) => {
      const def = g.options.find((o) => o.isDefault);
      if (def) {
        initial[g.id] = [def.id];
      } else if (g.required && g.options.length > 0) {
        initial[g.id] = [g.options[0].id];
      } else {
        initial[g.id] = [];
      }
    });
    return initial;
  });

  const [specialInstructions, setSpecialInstructions] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Compute selected modifiers and unit price
  const { selectedModifiers, unitPriceWithModifiers } = useMemo(() => {
    let extraPrice = 0;
    const mods: SelectedModifier[] = [];

    groups.forEach((group) => {
      const selectedIds = selectedOptions[group.id] || [];
      selectedIds.forEach((optId) => {
        const opt = group.options.find((o) => o.id === optId);
        if (opt) {
          extraPrice += opt.price;
          mods.push({
            groupName: group.name,
            optionName: opt.name,
            price: opt.price,
          });
        }
      });
    });

    const basePrice = Number(product.price) || 0;
    return {
      selectedModifiers: mods,
      unitPriceWithModifiers: basePrice + extraPrice,
    };
  }, [groups, selectedOptions, product.price]);

  // Handle Radio Selection
  const handleSingleSelect = (groupId: string, optionId: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [groupId]: [optionId],
    }));
  };

  // Handle Multi-Checkbox Selection
  const handleMultiSelect = (groupId: string, optionId: string, max?: number) => {
    setSelectedOptions((prev) => {
      const current = prev[groupId] || [];
      if (current.includes(optionId)) {
        return {
          ...prev,
          [groupId]: current.filter((id) => id !== optionId),
        };
      } else {
        if (max && current.length >= max) {
          // Replace oldest or cap
          return prev;
        }
        return {
          ...prev,
          [groupId]: [...current, optionId],
        };
      }
    });
  };

  // Validation
  const isValid = useMemo(() => {
    for (const group of groups) {
      if (group.required) {
        const count = (selectedOptions[group.id] || []).length;
        if (count < (group.min || 1)) return false;
      }
    }
    return true;
  }, [groups, selectedOptions]);

  const handleAdd = () => {
    if (!isValid) return;
    onAddToCart({
      product,
      quantity,
      selectedModifiers,
      specialInstructions: specialInstructions.trim(),
      unitPriceWithModifiers,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl max-h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom duration-300"
        style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Hero */}
        <div className="relative border-b border-gray-100 bg-gradient-to-r from-indigo-900 to-indigo-950 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="pr-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-2">
              <Sparkles size={11} /> Customize Your Order
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {product.name}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/90 mt-1 line-clamp-2 leading-relaxed">
              {product.description || "Prepared fresh with premium ingredients by FlowMart merchants."}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-lg font-black text-white">
                Base: ₦{Number(product.price).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Modifier Options */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {groups.map((group) => {
            const isSingle = group.max === 1 || group.required;
            const currentSelected = selectedOptions[group.id] || [];

            return (
              <div key={group.id} className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{group.description}</p>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      group.required
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    {group.required ? "Required" : "Optional"}
                  </span>
                </div>

                <div className="space-y-2">
                  {group.options.map((option) => {
                    const isChecked = currentSelected.includes(option.id);

                    return (
                      <label
                        key={option.id}
                        onClick={() => {
                          if (isSingle) {
                            handleSingleSelect(group.id, option.id);
                          } else {
                            handleMultiSelect(group.id, option.id, group.max);
                          }
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? "bg-white border-indigo-600 shadow-sm ring-1 ring-indigo-600"
                            : "bg-white/80 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-5 w-5 items-center justify-center ${
                              isSingle ? "rounded-full" : "rounded-md"
                            } border transition ${
                              isChecked
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {isChecked && <Check size={12} strokeWidth={3} />}
                          </div>
                          <span className="text-sm font-bold text-gray-800">
                            {option.name}
                          </span>
                        </div>

                        <span
                          className={`text-xs font-bold ${
                            option.price > 0
                              ? "text-indigo-600"
                              : "text-gray-400"
                          }`}
                        >
                          {option.price > 0 ? `+₦${option.price.toLocaleString()}` : "Free"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Kitchen Special Instructions */}
          <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4">
            <h3 className="text-sm font-extrabold text-gray-900 mb-1">
              Special Instructions
            </h3>
            <p className="text-xs text-gray-500 mb-2">
              Any allergies, packing requests, or spice preferences?
            </p>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Please pack stew separately, mild pepper, extra serviettes..."
              rows={2}
              maxLength={200}
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>
        </div>

        {/* Sticky Floating Bottom Action Dock */}
        <div className="border-t border-gray-100 bg-white p-4 sm:p-5 flex items-center justify-between gap-4">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl p-1 bg-gray-50">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center text-sm font-black text-gray-900">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Add to Cart Button with Dynamic Running Total */}
          <button
            onClick={handleAdd}
            disabled={!isValid}
            style={{
              backgroundColor: isValid ? "var(--color-primary, #4f46e5)" : "#9ca3af",
            }}
            className="flex-1 py-3.5 px-6 rounded-xl text-white font-extrabold text-sm sm:text-base flex items-center justify-between shadow-lg shadow-indigo-600/25 transition hover:opacity-95 disabled:cursor-not-allowed cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} />
              <span>Add to Cart</span>
            </div>
            <span className="font-black text-white">
              ₦{(unitPriceWithModifiers * quantity).toLocaleString()}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
