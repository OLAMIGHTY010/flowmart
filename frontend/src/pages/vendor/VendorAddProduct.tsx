import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/contexts/ToastContext";
import { Upload, ArrowLeft, Save } from "lucide-react";

const VendorAddProduct = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      showToast("Product added successfully", "success");
      navigate("/vendor/products");
    }, 1000);
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <Link to="/vendor/products" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: "var(--radius-md)", backgroundColor: "var(--color-bg-primary)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
          Add New Product
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        
        {/* Basic Details */}
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 24 }}>Basic Information</h2>
          <div style={{ display: "grid", gap: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: 8 }}>Product Name</label>
              <input required type="text" className="input-field" placeholder="e.g. Fresh Organic Tomatoes" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: 8 }}>Description</label>
              <textarea required className="input-field" rows={4} placeholder="Describe the product..." />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: 8 }}>Category</label>
                <select required className="input-field">
                  <option value="">Select Category</option>
                  <option value="groceries">Groceries</option>
                  <option value="electronics">Electronics</option>
                  <option value="fashion">Fashion</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 24 }}>Pricing & Inventory</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: 8 }}>Price (₦)</label>
              <input required type="number" min="0" className="input-field" placeholder="0.00" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: 8 }}>Compare at Price (₦) - Optional</label>
              <input type="number" min="0" className="input-field" placeholder="0.00" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: 8 }}>Stock Quantity</label>
              <input required type="number" min="0" className="input-field" placeholder="0" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: 8 }}>SKU (Stock Keeping Unit)</label>
              <input type="text" className="input-field" placeholder="e.g. TOM-001" />
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 8 }}>Product Images</h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: 24 }}>First image will be used as the thumbnail.</p>
          
          <label style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: 48, border: "2px dashed var(--color-border)", borderRadius: "var(--radius-lg)",
            backgroundColor: "var(--color-bg-secondary)", cursor: "pointer", transition: "border-color var(--transition-fast)"
          }}>
            <Upload size={32} style={{ color: "var(--color-text-muted)", marginBottom: 16 }} />
            <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-primary)", marginBottom: 4 }}>Click to upload images</span>
            <span style={{ fontSize: "0.813rem", color: "var(--color-text-muted)" }}>PNG, JPG or WEBP (Max 5MB per image)</span>
            <input type="file" required multiple accept="image/*" style={{ display: "none" }} />
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginBottom: 40 }}>
          <button type="button" onClick={() => navigate("/vendor/products")} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ minWidth: 160 }}>
            {isSubmitting ? "Saving..." : <><Save size={18} /> Save Product</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VendorAddProduct;
