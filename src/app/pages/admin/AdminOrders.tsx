// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Eye, Filter } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';

export function AdminOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  if (!user || user.role !== 'admin') {
    navigate('/');
    return null;
  }

  // 1. Fetch live orders from the database
  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost/aquatrack_api/get_admin_orders.php');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      toast.error('Failed to load orders from database');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter logic
  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status.toLowerCase() === statusFilter.toLowerCase());

  const getStatusColor = (status) => {
    const s = status.toLowerCase();
    if (s === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (s === 'processing' || s === 'ready for pickup') return 'bg-purple-100 text-purple-800';
    if (s === 'out for delivery') return 'bg-orange-100 text-orange-800';
    if (s === 'completed') return 'bg-green-100 text-green-800';
    if (s === 'cancelled') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  // 2. Handle Status Updates via PHP API
  const handleStatusChange = async (orderId, newStatus, paymentStatus) => {
    try {
      const response = await fetch('http://localhost/aquatrack_api/update_order_status.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          order_id: orderId, 
          status: newStatus,
          payment_status: paymentStatus || 'Pending' 
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(`Order #${orderId} status updated to ${newStatus}`);
        fetchOrders(); // Refresh table instantly
        
        // Update the modal if it's currently open
        if (selectedOrder && selectedOrder.order_id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus, payment_status: paymentStatus });
        }
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('Server error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Order Management</h1>
          
          {/* Filter */}
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] bg-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="ready for pickup">Ready for Pickup</SelectItem>
                <SelectItem value="out for delivery">Out for Delivery</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-gray-600 text-sm">
              {filteredOrders.length} order(s) found
            </span>
          </div>
        </div>

        {/* Orders Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="text-left py-4 px-4 font-semibold text-gray-600">Order ID</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-600">Customer</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-600">Type</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-600">Date</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-600">Total</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-600">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-600">Assigned Rider</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order.order_id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 font-bold">#{order.order_id}</td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{order.customer_name}</div>
                        <div className="text-sm text-gray-500">{order.phone_number || 'No phone'}</div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="outline" className="capitalize">
                          {order.order_type}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(order.order_date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 font-bold text-blue-600">
                        ₱{Number(order.total_amount).toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={`${getStatusColor(order.status)} border-none shadow-none font-semibold px-3 py-1`}>
                          {order.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        {order.rider_name ? (
                          <span className="text-sm font-medium text-gray-700">{order.rider_name}</span>
                        ) : (
                          <span className="text-sm text-gray-400">
                            {order.order_type === 'Delivery' ? 'Waiting for Rider' : '-'}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredOrders.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No orders found matching this filter.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Details Dialog (The View Modal) */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Order #{selectedOrder?.order_id}</DialogTitle>
              <DialogDescription>
                Placed on {new Date(selectedOrder?.order_date).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6 mt-4">
                {/* Status & Type */}
                <div className="flex gap-4">
                  <div>
                    <h3 className="font-bold text-sm text-gray-500 mb-2 uppercase">Order Type</h3>
                    <Badge variant="outline" className="text-base px-4 py-1">{selectedOrder.order_type}</Badge>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-500 mb-2 uppercase">Current Status</h3>
                    <Badge className={`${getStatusColor(selectedOrder.status)} text-base px-4 py-1 border-none`}>
                      {selectedOrder.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <hr />

                {/* Customer Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-lg mb-3">Customer Details</h3>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <p><span className="text-gray-500 font-medium w-24 inline-block">Name:</span> {selectedOrder.customer_name}</p>
                    <p><span className="text-gray-500 font-medium w-24 inline-block">Phone:</span> {selectedOrder.phone_number}</p>
                    <p><span className="text-gray-500 font-medium w-24 inline-block">Email:</span> {selectedOrder.email}</p>
                    
                    {selectedOrder.order_type === 'Delivery' && (
                      <div className="col-span-2 mt-2 pt-2 border-t">
                        <p><span className="text-gray-500 font-medium w-24 inline-block">Address:</span> {selectedOrder.address}, {selectedOrder.barangay}</p>
                        {selectedOrder.landmark && (
                          <p><span className="text-gray-500 font-medium w-24 inline-block">Landmark:</span> {selectedOrder.landmark}</p>
                        )}
                        {selectedOrder.delivery_notes && (
                          <p className="mt-2 text-yellow-800 bg-yellow-50 p-2 rounded">
                            <span className="font-semibold">Note: </span>{selectedOrder.delivery_notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Totals */}
                <div>
                  <h3 className="font-bold text-lg mb-3">Financials</h3>
                  <div className="space-y-2 border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span>₱{Number(selectedOrder.subtotal || selectedOrder.total_amount).toFixed(2)}</span>
                    </div>
                    {selectedOrder.order_type === 'Delivery' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span>₱{Number(selectedOrder.delivery_fee || 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold pt-2 border-t text-lg">
                      <span>Total Amount</span>
                      <span className="text-blue-600">₱{Number(selectedOrder.total_amount).toFixed(2)}</span>
                    </div>
                    
                    <div className="pt-4 mt-4 border-t flex justify-between items-center">
                      <span className="text-gray-600">Payment Method: <span className="font-semibold text-gray-900">{selectedOrder.payment_method || 'Cash / POS'}</span></span>
                      <Badge variant={selectedOrder.payment_status === 'Paid' ? 'default' : 'destructive'} className="text-sm">
                        {selectedOrder.payment_status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Admin Controls */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="font-bold text-blue-900 mb-3">Admin Overrides</h3>
                  
                  {selectedOrder.order_type === 'Walk-in' && (
                    <p className="text-sm text-blue-600 mb-4 bg-blue-100 p-2 rounded">
                      🔒 Status overrides are disabled for Walk-in POS transactions.
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-blue-800 mb-2 block">Force Status Update</Label>
                      <Select
                        value={selectedOrder.status}
                        onValueChange={(value) => handleStatusChange(selectedOrder.order_id, value, selectedOrder.payment_status)}
                        disabled={selectedOrder.order_type === 'Walk-in'}
                      >
                        <SelectTrigger className="bg-white disabled:opacity-50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Processing">Processing</SelectItem>
                          <SelectItem value="Ready for Pickup">Ready for Pickup</SelectItem>
                          <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-blue-800 mb-2 block">Force Payment Status</Label>
                      <Select
                        value={selectedOrder.payment_status}
                        onValueChange={(value) => handleStatusChange(selectedOrder.order_id, selectedOrder.status, value)}
                        disabled={selectedOrder.order_type === 'Walk-in'}
                      >
                        <SelectTrigger className="bg-white disabled:opacity-50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Unpaid</SelectItem>
                          <SelectItem value="Paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}