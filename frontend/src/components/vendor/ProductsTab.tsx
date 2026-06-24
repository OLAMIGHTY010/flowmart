import { useState } from 'react';
import { useVendorProducts } from '@/hooks/vendor/useVendorQueries';
import { useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/vendor/useVendorMutations';
import { Loader2, Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import { VendorInput } from '@/components/ui/input';
import { VendorButton } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  // Food vs Non-Consumable Specific State
  const [productType, setProductType] = useState<'food' | 'retail'>('retail');
  const [preparationTime, setPreparationTime] = useState('');
  const [modifiers, setModifiers] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [dietaryTags, setDietaryTags] = useState<string[]>([]);

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
    setProductType('retail');
    setPreparationTime('');
    setModifiers([]);
    setVariants([]);
    setDietaryTags([]);
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
    setStockQuantity(prod.stockQuantity ? prod.stockQuantity.toString() : '0');
    setDescription(prod.description || '');
    setImageUrl(prod.imageUrl || '');
    setSku(prod.sku || '');
    setBrand(prod.brand || '');
    setWeight(prod.weight ? prod.weight.toString() : '');
    setOldPrice(prod.oldPrice ? prod.oldPrice.toString() : '');
    setImages(Array.isArray(prod.images) ? prod.images.join(', ') : (prod.images || ''));
    setProductType(prod.productType || 'retail');
    setPreparationTime(prod.preparationTime ? prod.preparationTime.toString() : '');
    setModifiers(Array.isArray(prod.modifiers) ? prod.modifiers : []);
    setVariants(Array.isArray(prod.variants) ? prod.variants : []);
    setDietaryTags(Array.isArray(prod.dietaryTags) ? prod.dietaryTags : []);
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
      stockQuantity: productType === 'food' ? undefined : (parseInt(stockQuantity) || 0),
      description,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=60', // Default beautiful fallback food image
      sku: productType === 'food' ? undefined : (sku || undefined),
      brand: productType === 'food' ? undefined : (brand || undefined),
      weight: productType === 'food' ? undefined : (weight ? parseFloat(weight) : undefined),
      oldPrice: oldPrice ? parseFloat(oldPrice) : undefined,
      images: images ? images.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      productType,
      preparationTime: productType === 'food' ? (parseInt(preparationTime) || undefined) : undefined,
      modifiers: productType === 'food' ? modifiers.map(m => ({
        ...m,
        options: m.options.map((o: any) => ({
          name: o.name,
          price: o.price ? parseFloat(o.price) : 0
        }))
      })) : undefined,
      variants: productType === 'retail' ? variants.map(v => ({
        name: v.name,
        value: v.value,
        price: v.price ? parseFloat(v.price) : 0,
        stock: v.stock ? parseInt(v.stock) : 0
      })) : undefined,
      dietaryTags: productType === 'food' ? dietaryTags : undefined
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
            const isOut = p.productType !== 'food' && p.stockQuantity === 0;
            const isLow = p.productType !== 'food' && p.stockQuantity > 0 && p.stockQuantity <= 10;
            
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
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground truncate">{p.category || 'Food & Catering'}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 font-semibold uppercase text-muted-foreground">
                      {p.productType === 'food' ? '🍔 Food' : '🛍️ Retail'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-foreground mt-1.5">₦{parseFloat(p.price).toLocaleString()}</p>
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
                    {p.productType === 'food' ? 'Unlimited' : `${p.stockQuantity} units`}
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

              {/* Product Type Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Product Type</label>
                <div className="grid grid-cols-2 gap-2 bg-[#f3f4f6] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setProductType('food');
                      setCategory('Food & Catering');
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      productType === 'food'
                        ? 'bg-[#064e3b] text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    🍔 Prepared Food
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProductType('retail');
                      setCategory('Merchandise');
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      productType === 'retail'
                        ? 'bg-[#064e3b] text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    🛍️ Retail & Groceries
                  </button>
                </div>
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

              {/* Dynamic Content: Food vs Retail */}
              {productType === 'food' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <VendorInput 
                      label="Prep Time (mins)"
                      placeholder="e.g. 15"
                      type="number"
                      value={preparationTime}
                      onChange={(e) => setPreparationTime(e.target.value)}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-foreground">Category</label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="w-full h-12 bg-input border-border rounded-xl">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Food & Catering">Food & Catering</SelectItem>
                          <SelectItem value="Beverages">Beverages</SelectItem>
                          <SelectItem value="Snacks">Snacks</SelectItem>
                          <SelectItem value="Others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Dietary Tags */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Dietary Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {['Vegan', 'Vegetarian', 'Gluten-Free', 'Halal', 'Contains Nuts'].map((tag) => {
                        const isSelected = dietaryTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setDietaryTags(dietaryTags.filter(t => t !== tag));
                              } else {
                                setDietaryTags([...dietaryTags, tag]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                              isSelected
                                ? 'bg-[#064e3b]/10 border-[#064e3b] text-[#064e3b]'
                                : 'border-border text-muted-foreground hover:bg-[#f3f4f6]'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Modifiers Builder */}
                  <div className="flex flex-col gap-2 border border-border/80 rounded-xl p-3 bg-[#f9fafb]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">Modifiers & Add-ons</span>
                      <button
                        type="button"
                        onClick={() => {
                          setModifiers([
                            ...modifiers,
                            { name: '', type: 'single', required: false, options: [{ name: '', price: '' }] }
                          ]);
                        }}
                        className="text-xs text-[#064e3b] font-bold flex items-center gap-1 hover:underline"
                      >
                        <Plus size={14} className="inline mr-1" /> Add Group
                      </button>
                    </div>

                    {modifiers.map((group, gIdx) => (
                      <div key={gIdx} className="border border-border/70 rounded-xl p-3 bg-white flex flex-col gap-3 relative">
                        <button
                          type="button"
                          onClick={() => {
                            setModifiers(modifiers.filter((_, idx) => idx !== gIdx));
                          }}
                          className="absolute top-2 right-2 text-destructive hover:bg-destructive/10 p-1 rounded-lg transition-all"
                        >
                          <X size={14} />
                        </button>

                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-muted-foreground">Group Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Choose Protein"
                              value={group.name}
                              onChange={(e) => {
                                const newMods = [...modifiers];
                                newMods[gIdx].name = e.target.value;
                                setModifiers(newMods);
                              }}
                              className="border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-muted-foreground">Selection</label>
                              <select
                                value={group.type}
                                onChange={(e) => {
                                  const newMods = [...modifiers];
                                  newMods[gIdx].type = e.target.value;
                                  setModifiers(newMods);
                                }}
                                className="border border-border rounded-lg px-2 py-1.5 text-xs bg-white outline-none focus:border-primary"
                              >
                                <option value="single">Single</option>
                                <option value="multiple">Multiple</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-1 items-center justify-center pt-4">
                              <label className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={group.required}
                                  onChange={(e) => {
                                    const newMods = [...modifiers];
                                    newMods[gIdx].required = e.target.checked;
                                    setModifiers(newMods);
                                  }}
                                  className="rounded border-border text-primary focus:ring-primary/20"
                                />
                                Required
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-1">
                          <span className="text-[10px] font-bold text-muted-foreground">Options</span>
                          {group.options.map((opt: any, oIdx: number) => (
                            <div key={oIdx} className="flex gap-2 items-center">
                              <input
                                type="text"
                                placeholder="Option name (e.g. Chicken)"
                                value={opt.name}
                                onChange={(e) => {
                                  const newMods = [...modifiers];
                                  newMods[gIdx].options[oIdx].name = e.target.value;
                                  setModifiers(newMods);
                                }}
                                className="flex-grow border border-border rounded-lg px-2.5 py-1 text-xs outline-none focus:border-primary"
                                required
                              />
                              <input
                                type="number"
                                placeholder="+ Price (₦)"
                                value={opt.price}
                                onChange={(e) => {
                                  const newMods = [...modifiers];
                                  newMods[gIdx].options[oIdx].price = e.target.value;
                                  setModifiers(newMods);
                                }}
                                className="w-24 border border-border rounded-lg px-2.5 py-1 text-xs outline-none focus:border-primary"
                              />
                              {group.options.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newMods = [...modifiers];
                                    newMods[gIdx].options = newMods[gIdx].options.filter((_: any, idx: number) => idx !== oIdx);
                                    setModifiers(newMods);
                                  }}
                                  className="text-muted-foreground hover:text-destructive transition-all"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newMods = [...modifiers];
                              newMods[gIdx].options.push({ name: '', price: '' });
                              setModifiers(newMods);
                            }}
                            className="text-[10px] text-[#064e3b] font-bold self-start flex items-center gap-1 hover:underline mt-0.5"
                          >
                            <Plus size={10} className="inline" /> Add Option
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Category</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="w-full h-12 bg-input border-border rounded-xl">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Food & Catering">Food & Catering</SelectItem>
                        <SelectItem value="Beverages">Beverages</SelectItem>
                        <SelectItem value="Merchandise">Merchandise</SelectItem>
                        <SelectItem value="Snacks">Snacks</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
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

                  {/* Variants Builder */}
                  <div className="flex flex-col gap-2 border border-border/80 rounded-xl p-3 bg-[#f9fafb]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">Product Variants</span>
                      <button
                        type="button"
                        onClick={() => {
                          setVariants([
                            ...variants,
                            { name: '', value: '', price: '', stock: '' }
                          ]);
                        }}
                        className="text-xs text-[#064e3b] font-bold flex items-center gap-1 hover:underline"
                      >
                        <Plus size={14} className="inline mr-1" /> Add Variant
                      </button>
                    </div>

                    {variants.map((v, vIdx) => (
                      <div key={vIdx} className="border border-border/70 rounded-xl p-2 bg-white flex gap-2 items-center relative pr-8">
                        <button
                          type="button"
                          onClick={() => {
                            setVariants(variants.filter((_, idx) => idx !== vIdx));
                          }}
                          className="absolute top-2 right-2 text-destructive hover:bg-destructive/10 p-1 rounded-lg transition-all"
                        >
                          <X size={14} />
                        </button>

                        <div className="grid grid-cols-4 gap-1.5 flex-grow">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-bold text-muted-foreground">Type</span>
                            <input
                              type="text"
                              placeholder="Size"
                              value={v.name}
                              onChange={(e) => {
                                const newVars = [...variants];
                                newVars[vIdx].name = e.target.value;
                                setVariants(newVars);
                              }}
                              className="border border-border rounded px-1.5 py-1 text-xs outline-none"
                              required
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-bold text-muted-foreground">Value</span>
                            <input
                              type="text"
                              placeholder="XL"
                              value={v.value}
                              onChange={(e) => {
                                const newVars = [...variants];
                                newVars[vIdx].value = e.target.value;
                                setVariants(newVars);
                              }}
                              className="border border-border rounded px-1.5 py-1 text-xs outline-none"
                              required
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-bold text-muted-foreground">Price (₦)</span>
                            <input
                              type="number"
                              placeholder="Price"
                              value={v.price}
                              onChange={(e) => {
                                const newVars = [...variants];
                                newVars[vIdx].price = e.target.value;
                                setVariants(newVars);
                              }}
                              className="border border-border rounded px-1.5 py-1 text-xs outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-bold text-muted-foreground">Stock</span>
                            <input
                              type="number"
                              placeholder="Stock"
                              value={v.stock}
                              onChange={(e) => {
                                const newVars = [...variants];
                                newVars[vIdx].stock = e.target.value;
                                setVariants(newVars);
                              }}
                              className="border border-border rounded px-1.5 py-1 text-xs outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

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
