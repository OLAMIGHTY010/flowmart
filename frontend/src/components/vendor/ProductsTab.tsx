import { useState } from 'react';
import { useVendorProducts } from '@/hooks/useVendorQueries';
import { useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useVendorMutations';
import { Loader2, Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import { VendorInput } from '@/components/ui/input';
import { VendorButton } from '@/components/ui/button';

export default function ProductsTab() {
  const { data: products = [], isLoading } = useVendorProducts();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_stock'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Food & Catering');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('');
  const [weight, setWeight] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [images, setImages] = useState('');

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory('Food & Catering');
    setPrice('');
    setStockQuantity('10');
    setDescription('');
    setImageUrl('');
    setSku('');
    setBrand('');
    setWeight('');
    setOldPrice('');
    setImages('');
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Str = reader.result as string;
        // Compress image
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 800;
          let { width, height } = img;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            setImageUrl(canvas.toDataURL('image/jpeg', 0.6));
          } else {
            setImageUrl(base64Str);
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const openEditModal = (prod: any) => {
    setEditingProduct(prod);
    setName(prod.name);
    setCategory(prod.category || 'Food & Catering');
    setPrice(prod.price);
    setStockQuantity(prod.stockQuantity.toString());
    setDescription(prod.description || '');
    setImageUrl(prod.imageUrl || '');
    setSku(prod.sku || '');
    setBrand(prod.brand || '');
    setWeight(prod.weight ? prod.weight.toString() : '');
    setOldPrice(prod.oldPrice ? prod.oldPrice.toString() : '');
    setImages(Array.isArray(prod.images) ? prod.images.join(', ') : (prod.images || ''));
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error('Delete error', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name,
      category,
      price,
      stockQuantity: parseInt(stockQuantity) || 0,
      description,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=60', // Default beautiful fallback food image
      sku: sku || undefined,
      brand: brand || undefined,
      weight: weight ? parseFloat(weight) : undefined,
      oldPrice: oldPrice ? parseFloat(oldPrice) : undefined,
      images: images ? images.split(',').map(s => s.trim()).filter(Boolean) : undefined
    };

    try {
      if (editingProduct) {
        await updateMutation.mutateAsync({ id: editingProduct.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Save error', err);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (filter === 'in_stock') return p.stockQuantity > 10;
    if (filter === 'low_stock') return p.stockQuantity > 0 && p.stockQuantity <= 10;
    if (filter === 'out_stock') return p.stockQuantity === 0;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-background font-body pb-24">
      {/* Products Top Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="text-xl font-headings font-extrabold text-foreground" style={{ fontWeight: 800 }}>Products</h1>
        <button 
          onClick={openAddModal}
          className="w-10 h-10 bg-[#064e3b] text-white rounded-xl flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Search Input */}
      <div className="px-5 mb-4">
        <div className="relative flex items-center">
          <Search size={18} className="absolute left-3.5 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f3f4f6] border-none rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
        {[
          { id: 'all', label: 'All' },
          { id: 'in_stock', label: 'In Stock' },
          { id: 'low_stock', label: 'Low Stock' },
          { id: 'out_stock', label: 'Out of Stock' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as any)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filter === t.id
                ? 'bg-[#064e3b] text-white'
                : 'bg-[#f3f4f6] text-muted-foreground hover:bg-[#e5e7eb]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="flex-grow px-5 flex flex-col gap-3 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((p: any) => {
            const isOut = p.stockQuantity === 0;
            const isLow = p.stockQuantity > 0 && p.stockQuantity <= 10;
            
            // stock badge styles
            let badgeClass = 'bg-[#dcfce7] text-[#15803d]'; // in stock
            if (isLow) badgeClass = 'bg-[#fef9c3] text-[#a16207]'; // low stock
            if (isOut) badgeClass = 'bg-[#fee2e2] text-[#b91c1c]'; // out of stock

            return (
              <div 
                key={p.id} 
                className="bg-surface border border-border/70 rounded-2xl p-3 flex items-center gap-3 shadow-xs hover:border-primary/30 transition-all"
              >
                {/* Product Thumbnail */}
                <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                  <img 
                    src={p.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=60'} 
                    alt={p.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>

                {/* Details */}
                <div className="flex-grow min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{p.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{p.category || 'Food & Catering'}</p>
                  <p className="text-sm font-bold text-foreground mt-1">₦{parseFloat(p.price).toLocaleString()}</p>
                </div>

                {/* Actions and Stock */}
                <div className="flex flex-col items-end gap-2.5">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openEditModal(p)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/40 transition-all cursor-pointer"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${badgeClass}`}>
                    {p.stockQuantity} units
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-sm text-muted-foreground bg-surface border border-dashed border-border/80 rounded-2xl">
            No products found
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-bold text-base text-foreground font-headings">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted/65 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              <VendorInput 
                label="Product Name"
                placeholder="Enter product name (e.g. Jollof Rice Pack)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="Food & Catering">Food & Catering</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Merchandise">Merchandise</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <VendorInput 
                  label="SKU (Optional)"
                  placeholder="e.g. JOL-RICE-01"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
                <VendorInput 
                  label="Brand (Optional)"
                  placeholder="e.g. Flowmart"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <VendorInput 
                  label="Price (₦)"
                  placeholder="2500"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
                <VendorInput 
                  label="Old Price (₦)"
                  placeholder="3000"
                  type="number"
                  value={oldPrice}
                  onChange={(e) => setOldPrice(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <VendorInput 
                  label="Stock Quantity"
                  placeholder="50"
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  required
                />
                <VendorInput 
                  label="Weight (kg)"
                  placeholder="0.5"
                  type="number"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Description</label>
                <textarea 
                  placeholder="Enter short description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Product Image Upload</label>
                <div className="flex items-center gap-4">
                  {imageUrl && (
                    <div className="w-12 h-12 rounded-lg border border-border overflow-hidden flex-shrink-0">
                      <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/20 focus:border-primary file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                  />
                </div>
              </div>

              <VendorButton type="submit" className="mt-2" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />}
                {editingProduct ? 'Update Product' : 'Add Product'}
              </VendorButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
