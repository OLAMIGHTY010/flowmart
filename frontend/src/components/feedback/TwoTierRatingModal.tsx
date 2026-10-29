import React, { useState } from "react";
import { 
  Star, 
  Bike, 
  Utensils, 
  Heart, 
  CheckCircle2, 
  X, 
  ThumbsUp, 
  Sparkles, 
  Send 
} from "lucide-react";
import { apiClient } from "@/services/api";

interface TwoTierRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderRef?: string;
  riderName?: string;
  vendorName?: string;
  onSuccess?: () => void;
}

const RIDER_PRESET_TAGS = [
  "Super Fast ⚡",
  "Polite & Friendly 🤝",
  "Handled with Care 🛡️",
  "Followed Instructions 📍",
  "Great Communication 📞",
];

const VENDOR_PRESET_TAGS = [
  "Steaming Hot 🔥",
  "Delicious Taste 😋",
  "Generous Portions 🍲",
  "Neatly Packaged 📦",
  "Exactly as Ordered ✨",
];

const TIP_OPTIONS = [200, 500, 1000];

export const TwoTierRatingModal: React.FC<TwoTierRatingModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderRef,
  riderName = "FlowMart Courier",
  vendorName = "Merchant Kitchen",
  onSuccess,
}) => {
  // Tier 1: Rider
  const [riderRating, setRiderRating] = useState(5);
  const [selectedRiderTags, setSelectedRiderTags] = useState<string[]>([]);
  const [selectedTip, setSelectedTip] = useState<number | null>(null);

  // Tier 2: Vendor
  const [vendorRating, setVendorRating] = useState(5);
  const [selectedVendorTags, setSelectedVendorTags] = useState<string[]>([]);
  const [reviewComment, setReviewComment] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const toggleRiderTag = (tag: string) => {
    setSelectedRiderTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleVendorTag = (tag: string) => {
    setSelectedVendorTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiClient.post(`/orders/${orderId}/rate`, {
        riderRating,
        riderTags: selectedRiderTags,
        riderTip: selectedTip || 0,
        vendorRating,
        vendorTags: selectedVendorTags,
        reviewComment: reviewComment.trim() || undefined,
      });

      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      console.error("Error submitting rating:", err);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          backgroundColor: "var(--color-bg-primary, #ffffff)",
          borderRadius: 24,
          overflowY: "auto",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          position: "relative",
          animation: "scaleUp 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--color-border, #e2e8f0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--color-bg-secondary, #f8fafc)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: "var(--color-primary-surface, #eef2ff)",
                color: "var(--color-primary, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 800, margin: 0, color: "var(--color-text-primary, #0f172a)" }}>
                How was your delivery?
              </h3>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted, #64748b)", margin: "2px 0 0 0" }}>
                Order #{orderRef || orderId.slice(0, 8)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-text-muted, #64748b)",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {isSubmitted ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "#ecfdf5",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h4 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#065f46", marginBottom: 8 }}>
              Thank You for Your Feedback!
            </h4>
            <p style={{ fontSize: "0.875rem", color: "#047857", maxWidth: 360, margin: "0 auto" }}>
              Your ratings help our riders and local kitchens maintain 5-star FlowMart standards.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
            {/* ═══ TIER 1: RIDER FEEDBACK ═══ */}
            <div
              style={{
                padding: 16,
                borderRadius: 16,
                backgroundColor: "var(--color-bg-secondary, #f8fafc)",
                border: "1px solid var(--color-border, #e2e8f0)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Bike size={18} style={{ color: "var(--color-primary, #4f46e5)" }} />
                <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--color-text-primary, #0f172a)" }}>
                  Rate Courier: {riderName}
                </span>
              </div>

              {/* Stars */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRiderRating(star)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 2,
                    }}
                  >
                    <Star
                      size={28}
                      className={star <= riderRating ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                      style={{
                        fill: star <= riderRating ? "#fbbf24" : "none",
                        color: star <= riderRating ? "#fbbf24" : "#cbd5e1",
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Rider Tag Chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {RIDER_PRESET_TAGS.map((tag) => {
                  const isSelected = selectedRiderTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleRiderTag(tag)}
                      style={{
                        padding: "5px 10px",
                        borderRadius: 9999,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        border: `1px solid ${isSelected ? "var(--color-primary, #4f46e5)" : "var(--color-border, #cbd5e1)"}`,
                        backgroundColor: isSelected ? "var(--color-primary-surface, #eef2ff)" : "#ffffff",
                        color: isSelected ? "var(--color-primary, #4f46e5)" : "var(--color-text-secondary, #475569)",
                        cursor: "pointer",
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Courier Tipping Shortcut */}
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-secondary, #475569)", marginBottom: 6 }}>
                  Add a Tip for {riderName}?
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  {TIP_OPTIONS.map((tip) => (
                    <button
                      key={tip}
                      type="button"
                      onClick={() => setSelectedTip(selectedTip === tip ? null : tip)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 10,
                        fontSize: "0.813rem",
                        fontWeight: 700,
                        border: `1.5px solid ${selectedTip === tip ? "var(--color-primary, #4f46e5)" : "var(--color-border, #cbd5e1)"}`,
                        backgroundColor: selectedTip === tip ? "var(--color-primary, #4f46e5)" : "#ffffff",
                        color: selectedTip === tip ? "#ffffff" : "var(--color-text-primary, #0f172a)",
                        cursor: "pointer",
                      }}
                    >
                      ₦{tip}
                    </button>
                  ))}
                  {selectedTip && (
                    <button
                      type="button"
                      onClick={() => setSelectedTip(null)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 10,
                        fontSize: "0.75rem",
                        color: "var(--color-text-muted, #64748b)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ TIER 2: VENDOR & MEAL FEEDBACK ═══ */}
            <div
              style={{
                padding: 16,
                borderRadius: 16,
                backgroundColor: "var(--color-bg-secondary, #f8fafc)",
                border: "1px solid var(--color-border, #e2e8f0)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Utensils size={18} style={{ color: "var(--color-primary, #4f46e5)" }} />
                <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--color-text-primary, #0f172a)" }}>
                  Rate Food & Packaging: {vendorName}
                </span>
              </div>

              {/* Stars */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setVendorRating(star)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 2,
                    }}
                  >
                    <Star
                      size={28}
                      style={{
                        fill: star <= vendorRating ? "#fbbf24" : "none",
                        color: star <= vendorRating ? "#fbbf24" : "#cbd5e1",
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Vendor Tag Chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {VENDOR_PRESET_TAGS.map((tag) => {
                  const isSelected = selectedVendorTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleVendorTag(tag)}
                      style={{
                        padding: "5px 10px",
                        borderRadius: 9999,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        border: `1px solid ${isSelected ? "var(--color-primary, #4f46e5)" : "var(--color-border, #cbd5e1)"}`,
                        backgroundColor: isSelected ? "var(--color-primary-surface, #eef2ff)" : "#ffffff",
                        color: isSelected ? "var(--color-primary, #4f46e5)" : "var(--color-text-secondary, #475569)",
                        cursor: "pointer",
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Optional Text Comment */}
              <textarea
                placeholder="Write a quick note for the kitchen (e.g. food was fresh, sauce was spicy)..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={2}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid var(--color-border, #cbd5e1)",
                  fontSize: "0.813rem",
                  fontFamily: "inherit",
                  resize: "none",
                  outline: "none",
                  backgroundColor: "#ffffff",
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: 14,
                backgroundColor: "var(--color-primary, #4f46e5)",
                color: "#ffffff",
                fontSize: "0.938rem",
                fontWeight: 700,
                border: "none",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 4px 14px rgba(79, 70, 229, 0.3)",
              }}
            >
              <Send size={16} />
              {isSubmitting ? "Submitting Ratings..." : "Submit Ratings"}
            </button>
          </form>
        )}
      </div>

      <style>{`
        @keyframes scaleUp {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default TwoTierRatingModal;
