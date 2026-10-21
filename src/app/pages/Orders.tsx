// @ts-nocheck
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Package, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

export function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch live orders from the database
  useEffect(() => {
    const fetchMyOrders = async () => {
      if (!user) return;
      try {
        const response = await fetch(`http://localhost/aquatrack_api/get_user_orders.php?user_id=${user.id}`);
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setOrders(data);
        } else {
          setOrders([]);
        }
      } catch (error) {
        toast.error('Failed to load your orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-600 mb-6">Please login to view your orders</p>
          <Link to="/login">
            <Button className="bg-blue-600 hover:bg-blue-700">Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (s === 'processing' || s === 'ready for pickup') return 'bg-purple-100 text-purple-800';
    if (s === 'out for delivery') return 'bg-orange-100 text-orange-800';
    if (s === 'completed') return 'bg-green-100 text-green-800';
    if (s === 'cancelled') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">My Orders</h1>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading your orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">Start shopping to place your first order!</p>
            <Link to="/products">
              <Button className="bg-blue-600 hover:bg-blue-700">Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Card key={order.order_id}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">Order #{order.order_id}</h3>
                        <Badge variant="outline" className="capitalize text-xs">
                          {order.order_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Placed on {new Date(order.order_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <Badge className={`w-fit font-bold border-none ${getStatusColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4 bg-gray-50 p-4 rounded">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-700 font-medium">
                            {item.service_name} <span className="text-gray-500">x{item.quantity}</span>
                          </span>
                          <span className="font-bold text-gray-700">
                            ₱{item.price ? (item.price * item.quantity).toFixed(2) : '0.00'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic text-center py-2">
                        Item details were not recorded for this transaction.
                      </p>
                    )}
                  </div>

                  <div className="border-t pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-xl font-bold text-blue-600">₱{Number(order.total_amount).toFixed(2)}</p>
                    </div>
                    <Link to={`/order-success/${order.order_id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}