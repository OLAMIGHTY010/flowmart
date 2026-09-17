import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, HeadphonesIcon, Search, MessageCircle, Mail, Phone, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { UserInput } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { coreServices } from "@/services/CoreServices";

export default function HelpSupport() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["faqs"],
    queryFn: () => coreServices.getFaqs(),
  });

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 md:px-0 md:py-0 md:max-w-none pb-24 md:pb-0 relative min-h-screen flex flex-col">
      {/* Header Banner */}
      <div className="relative mb-6 rounded-2xl bg-green-100 p-6 pt-10 border border-green-200">
        <button
          onClick={() => navigate(-1)}
          className="md:hidden absolute left-4 top-4 text-green-800 hover:text-green-900 transition"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-4 mt-2">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-green-500 text-white shadow-sm">
            <HeadphonesIcon size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-green-900">How can we help?</h1>
            <p className="mt-1 text-xs font-medium text-green-700">
              Search our FAQ or contact support directly.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-8">
        <UserInput
          icon={<Search size={18} />}
          placeholder="Search help articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Contact Grid */}
      <div className="mb-8">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
          Contact Us
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <button className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-green-300 hover:bg-green-50 cursor-pointer">
            <MessageCircle size={24} className="text-gray-700" />
            <span className="text-xs font-bold text-gray-900">Live Chat</span>
            <span className="text-[10px] font-semibold text-green-600">Online now</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-green-300 hover:bg-green-50 cursor-pointer">
            <Mail size={24} className="text-gray-700" />
            <span className="text-xs font-bold text-gray-900">Email</span>
            <span className="text-[10px] font-semibold text-gray-500 truncate w-full text-center">support@...</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-green-300 hover:bg-green-50 cursor-pointer">
            <Phone size={24} className="text-gray-700" />
            <span className="text-xs font-bold text-gray-900">Call</span>
            <span className="text-[10px] font-semibold text-gray-500 truncate w-full text-center">+234 800...</span>
          </button>
        </div>
      </div>

      {/* FAQs */}
      <div className="flex-grow">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : faqs.map((faq: any, idx: number) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div
                key={faq.id || idx}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all"
              >
                <button
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  className="flex w-full items-center justify-between p-4 text-left cursor-pointer hover:bg-gray-50 transition"
                >
                  <span className="text-sm font-semibold text-gray-900">{faq.question}</span>
                  {isExpanded ? (
                    <ChevronUp size={18} className="text-gray-500 flex-shrink-0 ml-4" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-500 flex-shrink-0 ml-4" />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1">
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 flex justify-center md:relative md:bg-transparent md:border-0 md:p-0 md:mt-8 md:block">
        <button className="w-full max-w-lg rounded-xl bg-green-600 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-green-700 cursor-pointer md:max-w-none">
          Submit a Ticket
        </button>
      </div>
    </div>
  );
}
