import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Edit2, Trash2, EyeOff, Eye, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { productServices } from "@/services/ProductServices";
import type { Product } from "@/types/product";

const VendorProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Since the vendor is authenticated, calling /api/v1/products returns their products (handled in backend)
      const data = await productServices.getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    
    try {
      setDeletingId(id);
      await productServices.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert("Failed to delete product. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
          My Products
        </h1>
        <Link to="/vendor/products/new" className="btn-primary">
          <Plus size={18} /> Add New Product
        </Link>
      </div>

      <div className="card">
        {/* Filters & Search */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", backgroundColor: "var(--color-bg-secondary)", borderRadius: "var(--radius-md)", padding: "0 12px", width: "100%", maxWidth: 320 }}>
            <Search size={18} style={{ color: "var(--color-text-light)" }} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: "none", backgroundColor: "transparent", padding: "10px", width: "100%", outline: "none", fontSize: "0.875rem" }} 
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: 40, display: "flex", justifyContent: "center" }}>
              <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>
              No products found. Start by adding a new product!
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--color-bg-secondary)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ padding: "16px 24px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Product Info</th>
                  <th style={{ padding: "16px 24px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Price</th>
                  <th style={{ padding: "16px 24px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Stock</th>
                  <th style={{ padding: "16px 24px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Status</th>
                  <th style={{ padding: "16px 24px", fontWeight: 600, color: "var(--color-text-secondary)", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const outOfStock = product.stockQuantity !== null && product.stockQuantity <= 0;
                  
                  return (
                    <tr key={product.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {product.images ? (
                            <img 
                              src={product.images.split(',')[0]} 
                              alt={product.name} 
                              style={{ width: 48, height: 48, borderRadius: "var(--radius-sm)", objectFit: "cover" }} 
                            />
                          ) : (
                            <div style={{ width: 48, height: 48, backgroundColor: "var(--color-bg-tertiary)", borderRadius: "var(--radius-sm)" }} />
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>{product.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{product.category || 'Uncategorized'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px", fontWeight: 600 }}>₦{Number(product.price).toLocaleString()}</td>
                      <td style={{ padding: "16px 24px" }}>
                        {product.productType === 'food' && product.stockQuantity === null ? (
                          <span style={{ color: "var(--color-text-muted)" }}>Unlimited (Food)</span>
                        ) : (
                          <span style={{ color: outOfStock ? "var(--color-accent-red)" : "inherit", fontWeight: outOfStock ? 600 : 400 }}>
                            {product.stockQuantity} units
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        {!outOfStock ? (
                          <span className="badge badge-green">Active</span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: "#FEF2F2", color: "var(--color-accent-red)" }}>Out of Stock</span>
                        )}
                      </td>
                      <td style={{ padding: "16px 24px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16 }}>
                          <Link to={`/vendor/products/edit/${product.id}`} style={{ color: "var(--color-text-muted)" }}>
                            <Edit2 size={16} />
                          </Link>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            disabled={deletingId === product.id}
                            style={{ color: "var(--color-accent-red)", opacity: deletingId === product.id ? 0.5 : 1 }}
                          >
                            {deletingId === product.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorProducts;
