// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, PackageSearch, X, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';

const emptyForm = {
  service_name: '',
  price: '',
  image_url: '/products/placeholder.jpg',
  is_active: true,
};

export function AdminProducts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [formMode, setFormMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  if (!user || user.role !== 'admin') {
    navigate('/');
    return null;
  }

  // 1. Fetch live products from DB
  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost/aquatrack_api/get_all_services.php');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast.error('Failed to load catalog');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.service_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddForm = () => { setForm(emptyForm); setEditingId(null); setFormMode('add'); };
  const closeForm = () => { setFormMode(null); setEditingId(null); setForm(emptyForm); };

  const openEditForm = (product) => {
    setForm({
      service_name: product.service_name,
      price: product.price.toString(),
      image_url: product.image_url,
      is_active: product.is_active == 1,
    });
    setEditingId(product.service_id);
    setFormMode('edit');
  };

  // 2. Handle Add / Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = formMode === 'add' ? 'add_service.php' : 'update_service.php';
    const payload = { ...form, price: parseFloat(form.price) };
    if (formMode === 'edit') payload.service_id = editingId;

    try {
      const response = await fetch(`http://localhost/aquatrack_api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        toast.success(formMode === 'add' ? 'Product added!' : 'Product updated!');
        fetchProducts(); // Refresh list
        closeForm();
      } else {
        toast.error('Failed to save product');
      }
    } catch (error) {
      toast.error('Server error');
    }
  };

 // 3. Handle Delete
  const handleDelete = async (id) => {
    try {
      const response = await fetch('http://localhost/aquatrack_api/delete_service.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: id })
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Product deleted!');
        fetchProducts();
      } else {
        // This will pop up the specific safeguard message we just wrote!
        toast.error(data.message || 'Failed to delete product');
      }
    } catch (error) {
      toast.error('Server error');
    }
    setDeleteConfirmId(null);
  };

  // 4. Handle Stock Toggle
  const toggleStock = async (product) => {
    const payload = {
      service_id: product.service_id,
      service_name: product.service_name,
      price: parseFloat(product.price),
      image_url: product.image_url,
      is_active: product.is_active == 1 ? false : true // Flip the current status
    };
    
    try {
      await fetch('http://localhost/aquatrack_api/update_service.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      fetchProducts();
      toast.success('Stock status updated!');
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  const inStockCount = products.filter(p => p.is_active == 1).length;
  const outOfStockCount = products.filter(p => p.is_active == 0).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Products / Services</h1>
            <p className="text-gray-600">Manage your water refilling station's offerings</p>
          </div>
          <Button onClick={openAddForm} className="bg-blue-600 hover:bg-blue-700 w-fit">
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Total Products</p><p className="text-2xl font-bold text-blue-600">{products.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-gray-500">In Stock</p><p className="text-2xl font-bold text-green-600">{inStockCount}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Out of Stock</p><p className="text-2xl font-bold text-red-500">{outOfStockCount}</p></CardContent></Card>
        </div>

        {/* Add / Edit Form */}
        {formMode && (
          <Card className="mb-8 border-blue-200 shadow-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xl text-blue-700">{formMode === 'add' ? 'Add New Product' : 'Edit Product'}</CardTitle>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Product Name *</Label>
                  <Input value={form.service_name} onChange={e => setForm({...form, service_name: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <Label>Price (₱) *</Label>
                  <Input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <Label>Image URL Path</Label>
                  <Input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="/products/image.jpg" />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Label>In Stock</Label>
                  <button type="button" onClick={() => setForm({...form, is_active: !form.is_active})}>
                    {form.is_active ? <ToggleRight className="h-7 w-7 text-green-500" /> : <ToggleLeft className="h-7 w-7 text-gray-400" />}
                  </button>
                </div>
                <div className="sm:col-span-2 flex gap-3 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save Product</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="mb-6"><Input placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="sm:w-64" /></div>

        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <Card key={product.service_id} className={`overflow-hidden flex flex-col transition-shadow hover:shadow-lg ${product.is_active == 0 ? 'opacity-70' : ''}`}>
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                <img src={product.image_url} alt={product.service_name} className="w-full h-full object-cover" />
                {product.is_active == 0 && (
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <Badge variant="destructive" className="text-sm">Out of Stock</Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-4 flex-1 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-600">₱{parseFloat(product.price).toFixed(2)}</span>
                </div>
                <h3 className="font-semibold text-gray-800 leading-tight">{product.service_name}</h3>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 mt-auto border-t border-gray-100">
                  <button onClick={() => toggleStock(product)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md border text-xs text-gray-600 hover:text-blue-600">
                    {product.is_active == 1 ? <><ToggleRight className="h-4 w-4 text-green-500" /> In Stock</> : <><ToggleLeft className="h-4 w-4 text-gray-400" /> Out of Stock</>}
                  </button>
                  <button onClick={() => openEditForm(product)} className="p-1.5 rounded-md border text-gray-500 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                  
                  {deleteConfirmId === product.service_id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(product.service_id)} className="p-1.5 rounded-md bg-red-500 text-white"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteConfirmId(null)} className="p-1.5 rounded-md border text-gray-500"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirmId(product.service_id)} className="p-1.5 rounded-md border text-gray-500 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}