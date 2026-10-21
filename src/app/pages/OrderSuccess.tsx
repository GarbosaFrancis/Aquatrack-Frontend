// @ts-nocheck
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { CheckCircle, ArrowRight, Package } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';

export function OrderSuccess() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`http://localhost/aquatrack_api/get_order_details.php?order_id=${orderId}`);
        const data = await response.json();
        
        if (data.success) {
          setOrder(data.order);
        } else {
          toast.error(data.message || 'Order not found');
        }
      } catch (error) {
        toast.error('Server error while fetching order details');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 text-gray-500">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-600 mb-6">Order not found</p>
          <Link to="/services">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Order Details
          </h1>
          <p className="text-lg text-gray-600">
            Thank you for choosing AquaTrack.
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Order ID</p>
                <p className="font-bold text-lg">#{order.order_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <p className="font-bold text-lg text-blue-600 capitalize">{order.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Order Type</p>
                <p className="font-bold text-lg capitalize">{order.order_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="font-bold text-lg text-blue-600">₱{Number(order.total_amount).toFixed(2)}</p>
              </div>
            </div>

            <div className="border-t pt-4 mb-4">
              <h3 className="font-bold mb-3">Contact Information</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-600 font-medium w-24 inline-block">Name:</span> {order.fullname}</p>
                <p><span className="text-gray-600 font-medium w-24 inline-block">Email:</span> {order.email}</p>
                <p><span className="text-gray-600 font-medium w-24 inline-block">Phone:</span> {order.phone_number}</p>
                {order.order_type === 'Delivery' && (
                  <>
                    <p><span className="text-gray-600 font-medium w-24 inline-block">Address:</span> {order.address}</p>
                    <p><span className="text-gray-600 font-medium w-24 inline-block">Barangay:</span> {order.barangay}</p>
                    {order.landmark && (
                      <p><span className="text-gray-600 font-medium w-24 inline-block">Landmark:</span> {order.landmark}</p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="border-t pt-4 mb-4">
              <h3 className="font-bold mb-3">Order Items</h3>
              <div className="space-y-2">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.service_name} x{item.quantity}
                      </span>
                      <span className="font-medium">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic">No items found for this order.</p>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>₱{Number(order.subtotal || order.total_amount).toFixed(2)}</span>
                </div>
                {order.order_type === 'Delivery' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee:</span>
                    <span>₱{Number(order.delivery_fee || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between font-bold text-lg mt-3 pt-3 border-t">
                <span>Total Amount</span>
                <span className="text-blue-600">₱{Number(order.total_amount).toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Payment Status: {order.payment_status}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/orders" className="flex-1">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <Package className="mr-2 h-5 w-5" />
              View My Orders
            </Button>
          </Link>
          <Link to="/services" className="flex-1">
            <Button variant="outline" className="w-full">
              Continue Shopping
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}