// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { ShoppingCart, Plus, Minus, Calculator } from 'lucide-react';

export function POS() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  // Secure the page for Admins only
  if (!user || user.role !== 'admin') {
    navigate('/');
    return null;
  }

  // Reuse your existing product fetcher!
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost/aquatrack_api/get_all_services.php');
        const data = await response.json();
        // Only show products that are actually in stock
        setProducts(data.filter(p => p.is_active == 1));
      } catch (error) {
        toast.error('Failed to load products');
      }
    };
    fetchProducts();
  }, []);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.service_id === product.service_id);
      if (existing) {
        return prev.map(item => 
          item.service_id === product.service_id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (serviceId) => {
    setCart(prev => prev.filter(item => item.service_id !== serviceId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error("Cart is empty!");

    try {
      const response = await fetch('http://localhost/aquatrack_api/submit_walkin_order.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cart: cart,
          total_amount: totalAmount
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Walk-In Order #${data.order_id} Completed & Paid!`);
        setCart([]); // Clear the cart for the next customer
      } else {
        toast.error('Failed to process order');
      }
    } catch (error) {
      toast.error('Server error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <Calculator className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Point of Sale (Walk-In)</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Side: Product Buttons */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Select Services</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {products.map(product => (
                <Card 
                  key={product.service_id} 
                  className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all active:scale-95"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <img src={product.image_url} alt={product.service_name} className="w-16 h-16 object-cover rounded bg-gray-100" />
                    <div>
                      <h3 className="font-bold text-gray-900">{product.service_name}</h3>
                      <p className="text-blue-600 font-semibold">₱{parseFloat(product.price).toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Side: The Register */}
          <div>
            <Card className="sticky top-8 border-blue-200 shadow-lg">
              <CardHeader className="bg-blue-50 border-b pb-4">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" /> Current Order
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {cart.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    No items added yet.
                  </div>
                ) : (
                  <div className="divide-y max-h-[400px] overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.service_id} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{item.service_name}</p>
                          <p className="text-gray-500 text-xs">₱{parseFloat(item.price).toFixed(2)} x {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-sm">₱{(item.price * item.quantity).toFixed(2)}</p>
                          <button onClick={() => removeFromCart(item.service_id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                            <Minus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="p-4 bg-gray-50 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-gray-700">Total Amount:</span>
                    <span className="font-bold text-2xl text-blue-600">₱{totalAmount.toFixed(2)}</span>
                  </div>
                  <Button 
                    onClick={handleCheckout} 
                    disabled={cart.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg font-bold"
                  >
                    Complete Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}