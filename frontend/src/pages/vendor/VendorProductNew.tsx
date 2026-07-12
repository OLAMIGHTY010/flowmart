import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, UploadCloud, X } from "lucide-react";
import { uploadServices } from "@/services/UploadServices";
import { productServices } from "@/services/ProductServices";

export default function VendorProductNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [productType, setProductType] = useState<"retail" | "food">("retail");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stockQuantity: "",
    brand: "",
    weight: "",
    preparationTime: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadServices.uploadImageToCloudinary(imageFile, "flowmart_vendor_products");
      }

      await productServices.createProduct({
        name: formData.name,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        productType,
        images: imageUrl,
        ...(productType === "retail" ? {
          stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : 0,
          brand: formData.brand,
          weight: formData.weight,
        } : {
          preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : null,
          stockQuantity: null // unlimited for food
        })
      });

      navigate("/vendor/products");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <button onClick={() => navigate("/vendor/products")} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: "50%", backgroundColor: "var(--color-bg-secondary)", border: "none", cursor: "pointer", color: "var(--color-text-primary)" }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
          Add New Product
        </h1>
      </div>

      <div className="card" style={{ maxWidth: 800, padding: 32 }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Product Type Toggle */}
          <div style={{ display: "flex", gap: 16, backgroundColor: "var(--color-bg-secondary)", padding: 6, borderRadius: "var(--radius-lg)" }}>
            <button 
              type="button"
              onClick={() => setProductType("retail")}
              style={{ flex: 1, padding: "10px 0", borderRadius: "var(--radius-md)", fontWeight: 600, border: "none", cursor: "pointer", 
                backgroundColor: productType === "retail" ? "var(--color-primary)" : "transparent",
                color: productType === "retail" ? "white" : "var(--color-text-secondary)",
                transition: "all 0.2s"
              }}
            >
              Retail Product
            </button>
            <button 
              type="button"
              onClick={() => setProductType("food")}
              style={{ flex: 1, padding: "10px 0", borderRadius: "var(--radius-md)", fontWeight: 600, border: "none", cursor: "pointer", 
                backgroundColor: productType === "food" ? "var(--color-primary)" : "transparent",
                color: productType === "food" ? "white" : "var(--color-text-secondary)",
                transition: "all 0.2s"
              }}
            >
              Food & Restaurant
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Image Upload */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Product Image</label>
              {imagePreview ? (
                <div style={{ position: "relative", width: 200, height: 200, borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                  <img src={imagePreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "50%", padding: 6, cursor: "pointer" }}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: 200, border: "2px dashed var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", backgroundColor: "var(--color-bg-secondary)", transition: "all 0.2s" }}>
                  <UploadCloud size={40} color="var(--color-primary)" style={{ marginBottom: 12 }} />
                  <span style={{ fontWeight: 600, color: "var(--color-text-secondary)" }}>Click to upload image</span>
                  <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginTop: 4 }}>JPEG, PNG up to 5MB</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                </label>
              )}
            </div>

            {/* Basic Info */}
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Product Name *</label>
              <input required type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Fresh Tomatoes (1kg) or Double Cheeseburger" />
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Description</label>
              <textarea className="form-input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe your product..." rows={3} />
            </div>

            <div className="form-group">
              <label className="form-label">Price (₦) *</label>
              <input required type="number" min="0" className="form-input" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="e.g. 1500" />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <input type="text" className="form-input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="e.g. Groceries, Fast Food" />
            </div>

            {/* Conditional Fields */}
            {productType === "retail" && (
              <>
                <div className="form-group">
                  <label className="form-label">Stock Quantity</label>
                  <input required type="number" min="0" className="form-input" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: e.target.value})} placeholder="e.g. 50" />
                </div>
                <div className="form-group">
                  <label className="form-label">Brand</label>
                  <input type="text" className="form-input" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="e.g. Nestle" />
                </div>
              </>
            )}

            {productType === "food" && (
              <>
                <div className="form-group">
                  <label className="form-label">Preparation Time (Minutes)</label>
                  <input type="number" min="0" className="form-input" value={formData.preparationTime} onChange={e => setFormData({...formData, preparationTime: e.target.value})} placeholder="e.g. 20" />
                </div>
              </>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 16, paddingTop: 24, borderTop: "1px solid var(--color-border)" }}>
            <button type="button" onClick={() => navigate("/vendor/products")} className="btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ minWidth: 150 }}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
