import { Link } from "react-router-dom";
import { Plus, Search, Edit2, Trash2, MoreVertical, EyeOff, Eye } from "lucide-react";

const mockProducts = [
  { id: "1", name: "Fresh Tomatoes (1kg)", category: "Groceries", price: 1200, stock: 45, status: "active", sales: 12 },
  { id: "2", name: "Premium Rice 5kg", category: "Groceries", price: 7500, stock: 10, status: "active", sales: 34 },
  { id: "3", name: "Plantain Bunch", category: "Groceries", price: 1500, stock: 0, status: "out_of_stock", sales: 89 },
  { id: "4", name: "Local Honey 500ml", category: "Groceries", price: 3500, stock: 20, status: "hidden", sales: 5 },
];

const VendorProducts = () => {
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
            <input type="text" placeholder="Search products..." style={{ border: "none", backgroundColor: "transparent", padding: "10px", width: "100%", outline: "none", fontSize: "0.875rem" }} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <select className="input-field" style={{ width: "auto", padding: "8px 16px" }}>
              <option value="all">All Categories</option>
              <option value="groceries">Groceries</option>
            </select>
            <select className="input-field" style={{ width: "auto", padding: "8px 16px" }}>
              <option value="all">Status: All</option>
              <option value="active">Active</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--color-bg-secondary)", borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "16px 24px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Product Info</th>
                <th style={{ padding: "16px 24px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Price</th>
                <th style={{ padding: "16px 24px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Stock</th>
                <th style={{ padding: "16px 24px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Status</th>
                <th style={{ padding: "16px 24px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Sales</th>
                <th style={{ padding: "16px 24px", fontWeight: 600, color: "var(--color-text-secondary)", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockProducts.map((product) => (
                <tr key={product.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 48, height: 48, backgroundColor: "var(--color-bg-tertiary)", borderRadius: "var(--radius-sm)" }} />
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>{product.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{product.category}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "16px 24px", fontWeight: 600 }}>₦{product.price.toLocaleString()}</td>
                  <td style={{ padding: "16px 24px" }}>
                    <span style={{ color: product.stock === 0 ? "var(--color-accent-red)" : "inherit", fontWeight: product.stock === 0 ? 600 : 400 }}>
                      {product.stock} units
                    </span>
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    {product.status === "active" && <span className="badge badge-green">Active</span>}
                    {product.status === "out_of_stock" && <span className="badge" style={{ backgroundColor: "#FEF2F2", color: "var(--color-accent-red)" }}>Out of Stock</span>}
                    {product.status === "hidden" && <span className="badge" style={{ backgroundColor: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}>Hidden</span>}
                  </td>
                  <td style={{ padding: "16px 24px" }}>{product.sales}</td>
                  <td style={{ padding: "16px 24px", textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16 }}>
                      <button style={{ color: "var(--color-text-muted)" }}><Edit2 size={16} /></button>
                      <button style={{ color: "var(--color-text-muted)" }}>
                        {product.status === "hidden" ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button style={{ color: "var(--color-accent-red)" }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VendorProducts;
