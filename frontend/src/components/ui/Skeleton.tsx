import React from "react";
import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
  variant?: "circular" | "rectangular" | "text" | "card";
}

export function Skeleton({ className = "", variant = "rectangular" }: SkeletonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "circular":
        return "rounded-full h-12 w-12";
      case "text":
        return "h-4 w-3/4 rounded-md";
      case "card":
        return "h-48 w-full rounded-2xl";
      default:
        return "rounded-xl";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{
        repeat: Infinity,
        repeatType: "reverse",
        duration: 1,
        ease: "easeInOut",
      }}
      className={`bg-gray-200 dark:bg-gray-800 ${getVariantStyles()} ${className}`}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-32 h-6" />
          <Skeleton variant="text" className="w-24 h-3" />
        </div>
        <Skeleton variant="circular" />
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-2 gap-4">
        <Skeleton variant="rectangular" className="h-24 w-full rounded-2xl" />
        <Skeleton variant="rectangular" className="h-24 w-full rounded-2xl" />
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        <Skeleton variant="text" className="w-40 h-5" />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    </div>
  );
}
