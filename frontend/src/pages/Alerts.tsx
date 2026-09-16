import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, PackageSearch, Info } from "lucide-react";

type AlertType = "order" | "promo" | "system";

interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

import { useQuery } from "@tanstack/react-query";
import { coreServices } from "@/services/CoreServices";
import { Loader2 } from "lucide-react";

const TABS = ["All", "Unread", "Orders", "Promos"];

export default function Alerts() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All");

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => coreServices.getAlerts(),
  });

  const [localAlerts, setLocalAlerts] = useState<AlertItem[]>([]);

  // Sync with fetched data
  if (alerts.length > 0 && localAlerts.length === 0) {
    setLocalAlerts(alerts);
  }

  const handleMarkAllRead = () => {
    setLocalAlerts(localAlerts.map((a) => ({ ...a, read: true })));
  };

  const filteredAlerts = localAlerts.filter((alert) => {
    if (activeTab === "Unread") return !alert.read;
    if (activeTab === "Orders") return alert.type === "order";
    if (activeTab === "Promos") return alert.type === "promo";
    return true; // All
  });

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case "order":
        return <PackageSearch size={20} className="text-blue-600" />;
      case "promo":
        return <AlertTriangle size={20} className="text-orange-600" />;
      case "system":
        return <Info size={20} className="text-gray-600" />;
    }
  };

  const getAlertBg = (type: AlertType) => {
    switch (type) {
      case "order":
        return "bg-blue-100 border-blue-200";
      case "promo":
        return "bg-orange-100 border-orange-200";
      case "system":
        return "bg-gray-100 border-gray-200";
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 md:max-w-none md:px-0 md:py-0">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 transition hover:bg-gray-50"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-extrabold text-gray-900 md:text-2xl">Alerts</h1>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="text-sm font-bold text-green-600 hover:text-green-700 hover:underline transition"
        >
          Mark all read
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-bold transition-all ${
              activeTab === tab
                ? "bg-green-600 text-white shadow-sm"
                : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p className="text-sm font-medium">No alerts to display.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-4 rounded-xl border p-4 transition-all ${
                alert.read ? "bg-white border-gray-100" : "bg-green-50 border-green-200 shadow-sm"
              }`}
            >
              {/* Icon */}
              <div
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border ${getAlertBg(
                  alert.type
                )}`}
              >
                {getAlertIcon(alert.type)}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className={`text-sm font-bold ${
                      alert.read ? "text-gray-900" : "text-green-900"
                    }`}
                  >
                    {alert.title}
                  </h3>
                  <span className="text-[10px] font-semibold text-gray-400 whitespace-nowrap">
                    {alert.time}
                  </span>
                </div>
                <p
                  className={`mt-1 text-xs leading-relaxed ${
                    alert.read ? "text-gray-500" : "text-green-800"
                  }`}
                >
                  {alert.message}
                </p>
              </div>

              {/* Unread dot */}
              {!alert.read && (
                <div className="mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-green-500 shadow-sm" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
