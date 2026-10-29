import React, { useState } from "react";
import FoodieWrappedModal from "@/components/gamification/FoodieWrappedModal";
import { Sparkles, Trophy, Share2, Play, Award, Heart, Bike } from "lucide-react";

export default function FoodieWrapped() {
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-surface border border-border rounded-3xl p-8 shadow-xl space-y-6">
        <div className="w-16 h-16 mx-auto bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-sm">
          <Sparkles size={32} />
        </div>

        <div>
          <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-full uppercase tracking-wider">
            FlowMart 2026 Season
          </span>
          <h1 className="text-2xl font-black text-text-primary mt-2">
            Your Foodie Wrapped is Ready!
          </h1>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            Relive your favorite meals, top Lagos kitchens, courier kilometers, and discover your official 2026 Foodie Persona.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full py-3.5 px-6 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/25 transition active:scale-95 flex items-center justify-center gap-2"
        >
          <Play size={16} className="fill-white" />
          Watch Your Foodie Wrapped Story
        </button>

        <div className="pt-4 border-t border-border flex items-center justify-around text-xs text-text-muted">
          <span>42 Orders</span>
          <span>•</span>
          <span>186.4 km Traveled</span>
          <span>•</span>
          <span>Top 2% Foodie</span>
        </div>
      </div>

      <FoodieWrappedModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
