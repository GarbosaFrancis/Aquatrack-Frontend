// @ts-nocheck
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { TrendingUp, FileText, DollarSign, Package } from 'lucide-react';

export function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  
  // Basic Sales Report Metrics
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    completedOrders: 0
  });

  const fetchAllOrders = async () => {
    try {
      const response = await fetch('http://localhost/aquatrack_api/get_admin_orders.php');
      const data = await response.json();
      setOrders(data);
      calculateReports(data);
    } catch (error) {
      toast.error('Failed to load admin data');
    }
  };

  const calculateReports = (orderData) => {
    let revenue = 0;
    let completed = 0;

    orderData.forEach(order => {
      // Only count revenue if it's actually Paid or Completed
      if (order.status === 'Completed' || order.payment_status === 'Paid') {
        revenue += parseFloat(order.total_amount);
      }
      if (order.status === 'Completed') {
        completed++;
      }
    });

    setMetrics({
      totalRevenue: revenue,
      totalOrders: orderData.length,
      completedOrders: completed
    });
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus, newPaymentStatus) => {
    try {
      const response = await fetch('http://localhost/aquatrack_api/update_order_status.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          order_id: orderId, 
          status: newStatus,
          payment_status: newPaymentStatus
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Transaction #${orderId} updated successfully!`);
        fetchAllOrders(); // Refresh the data to update the sales reports instantly
      } else {
        toast.error('Failed to update transaction.');
      }
    } catch (error) {
      toast.error('Server error.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Business Monitor & Sales Report</h1>

        {/* TOP SECTION: Basic Sales Reports */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="bg-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium text-blue-100">Total Revenue</CardTitle>
              <DollarSign className="h-6 w-6 text-blue-200" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">₱{metrics.totalRevenue.toFixed(2)}</div>
              <p className="text-sm text-blue-200 mt-1">From paid/completed orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Transactions</CardTitle>
              <FileText className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{metrics.totalOrders}</div>
              <p className="text-xs text-gray-500 mt-1">All time orders placed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed Orders</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{metrics.completedOrders}</div>
              <p className="text-xs text-gray-500 mt-1">Successfully fulfilled</p>
            </CardContent>
          </Card>
        </div>

        {/* BOTTOM SECTION: Transaction Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Manage Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Rider</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status Control</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.order_id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-4 font-bold">#{order.order_id}</td>
                      <td className="px-4 py-4">{order.customer_name}</td>
                      <td className="px-4 py-4 font-medium">{order.order_type}</td>
                      <td className="px-4 py-4 text-gray-500">
                        {order.rider_name ? order.rider_name : 'Unassigned'}
                      </td>
                      <td className="px-4 py-4 font-bold text-blue-600">
                        ₱{Number(order.total_amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2 items-center">
                          <select 
                            className="border rounded p-1 text-xs disabled:opacity-50 disabled:bg-gray-200 disabled:cursor-not-allowed"
                            defaultValue={order.status}
                            onChange={(e) => handleUpdateStatus(order.order_id, e.target.value, order.payment_status)}
                            disabled={order.order_type === 'Walk-in'}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Ready for Pickup">Ready for Pickup</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                          
                          <select 
                            className="border rounded p-1 text-xs bg-gray-50 disabled:opacity-50 disabled:bg-gray-200 disabled:cursor-not-allowed"
                            defaultValue={order.payment_status}
                            onChange={(e) => handleUpdateStatus(order.order_id, order.status, e.target.value)}
                            disabled={order.order_type === 'Walk-in'}
                          >
                            <option value="Pending">Unpaid</option>
                            <option value="Paid">Paid</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}