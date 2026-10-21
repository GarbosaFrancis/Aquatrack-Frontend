// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { MapPin, Package, Truck, LogOut, CheckCircle } from 'lucide-react';

export function RiderDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [allOrders, setAllOrders] = useState([]);

  // Fetch all orders using the Admin script so we get the full address details
  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost/aquatrack_api/get_admin_orders.php');
      const data = await response.json();
      setAllOrders(data);
    } catch (error) {
      toast.error('Failed to load orders');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter 1: Orders waiting to be claimed
  const availableDeliveries = allOrders.filter(o => 
    o.order_type === 'Delivery' && 
    o.status === 'Pending' && 
    !o.rider_id
  );

  // Filter 2: Orders currently assigned to THIS specific rider that aren't finished yet
  const myActiveRoute = allOrders.filter(o => 
    o.order_type === 'Delivery' && 
    o.status === 'Out for Delivery' && 
    o.rider_id == (user?.id || user?.user_id)
  );

  // Action 1: Accept the Order
  const handleAcceptOrder = async (orderId) => {
    try {
      const response = await fetch('http://localhost/aquatrack_api/accept_order.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          order_id: orderId, 
          rider_id: user?.id || user?.user_id 
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Order #${orderId} moved to your Active Route!`);
        fetchOrders(); // Refresh to move it to the next section
      }
    } catch (error) {
      toast.error('Server error.');
    }
  };

  // Action 2: Complete the Delivery (Reusing the Admin's update script!)
  const handleCompleteDelivery = async (orderId) => {
    try {
      const response = await fetch('http://localhost/aquatrack_api/update_order_status.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          order_id: orderId, 
          status: 'Completed',
          payment_status: 'Paid' // Automatically assumes cash was collected
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Delivery #${orderId} completed successfully!`);
        fetchOrders(); // Refresh to remove it from the screen
      }
    } catch (error) {
      toast.error('Server error.');
    }
  };

  const handleLogout = () => {
    if (logout) logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Truck className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Rider Dispatch Center</h1>
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2 border-gray-300 hover:bg-gray-100">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* SECTION 1: AVAILABLE DELIVERIES */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm">{availableDeliveries.length}</span>
              New Requests
            </h2>
            
            {availableDeliveries.length === 0 ? (
              <Card className="bg-white p-6 text-center border-dashed"><p className="text-gray-500 text-sm">No new requests.</p></Card>
            ) : (
              <div className="space-y-4">
                {availableDeliveries.map(order => (
                  <Card key={order.order_id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex justify-between items-center text-lg">
                        <span>Order #{order.order_id}</span>
                        <span className="text-blue-600 font-bold">₱{Number(order.total_amount).toFixed(2)}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm">
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-gray-500 mb-2">{order.phone_number}</p>
                        <div className="flex items-start gap-2 text-gray-600">
                          <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
                          <p>{order.address}, {order.barangay}</p>
                        </div>
                      </div>
                      <Button onClick={() => handleAcceptOrder(order.order_id)} className="w-full bg-blue-600 hover:bg-blue-700">
                        Accept Delivery
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: MY ACTIVE ROUTE */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
              <span className="bg-orange-100 text-orange-800 py-1 px-3 rounded-full text-sm">{myActiveRoute.length}</span>
              My Active Route
            </h2>

            {myActiveRoute.length === 0 ? (
              <Card className="bg-white p-6 text-center border-dashed"><p className="text-gray-500 text-sm">Your route is empty.</p></Card>
            ) : (
              <div className="space-y-4">
                {myActiveRoute.map(order => (
                  <Card key={order.order_id} className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500 bg-orange-50/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex justify-between items-center text-lg">
                        <span>Order #{order.order_id}</span>
                        <span className="text-orange-600 font-bold">₱{Number(order.total_amount).toFixed(2)}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm">
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-gray-500 mb-2">{order.phone_number}</p>
                        <div className="flex items-start gap-2 text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-orange-500" />
                          <div>
                            <p>{order.address}, {order.barangay}</p>
                            {order.landmark && <p className="text-xs text-gray-500 italic">Landmark: {order.landmark}</p>}
                          </div>
                        </div>
                        {order.delivery_notes && (
                          <div className="flex items-start gap-2 text-yellow-800 bg-yellow-100 p-2 rounded">
                            <span className="font-semibold">Note:</span> <span>{order.delivery_notes}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* The Final Completion Button */}
                      <Button onClick={() => handleCompleteDelivery(order.order_id)} className="w-full bg-green-600 hover:bg-green-700 mt-2">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Delivered & Paid
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}