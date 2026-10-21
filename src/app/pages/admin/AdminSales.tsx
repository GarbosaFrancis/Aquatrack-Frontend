// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Download, TrendingUp } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'sonner';

export function AdminSales() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Set default dates to May 2026 (the current month of your testing!)
  const [dateFrom, setDateFrom] = useState('2026-05-01');
  const [dateTo, setDateTo] = useState('2026-05-31');
  const [orders, setOrders] = useState([]);

  if (!user || user.role !== 'admin') {
    navigate('/');
    return null;
  }

  // 1. Fetch live data from the PHP backend
  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost/aquatrack_api/get_admin_orders.php');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      toast.error('Failed to load live sales data');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 2. Filter the live orders by the Date Picker
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.order_date);
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    // Include the entire end day
    to.setHours(23, 59, 59, 999);
    return orderDate >= from && orderDate <= to;
  });

  // 3. Calculate statistics accurately
  const totalSales = filteredOrders
    .filter(o => o.status === 'Completed' || o.payment_status === 'Paid')
    .reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
  
  const totalOrders = filteredOrders.length;
  const deliveredOrders = filteredOrders.filter(o => o.status === 'Completed').length;
  const averageOrderValue = deliveredOrders > 0 ? totalSales / deliveredOrders : 0;

  // 4. Transform data for the Bar Chart (The Walk-in Fix!)
  // We initialize both buckets at 0 so they always show up on the chart
  const typeSales = {
    'Delivery': { name: 'Delivery', count: 0, revenue: 0 },
    'Walk-in': { name: 'Walk-in', count: 0, revenue: 0 }
  };

  filteredOrders
    .filter(o => o.status === 'Completed' || o.payment_status === 'Paid')
    .forEach(order => {
      // Logic: If the order belongs to our dummy email, it's a Walk-in. Otherwise, it's Delivery.
      const isWalkIn = order.email === 'walkin@aquatrack.local' || order.order_type === 'Walk-in';
      const type = isWalkIn ? 'Walk-in' : 'Delivery';

      typeSales[type].count += 1;
      typeSales[type].revenue += parseFloat(order.total_amount);
    });

  const typeSalesData = Object.values(typeSales);

  // 5. Transform data for the Pie Chart (Status Distribution)
  const statusData = [
    { name: 'Completed', value: filteredOrders.filter(o => o.status === 'Completed').length },
    { name: 'Pending', value: filteredOrders.filter(o => o.status === 'Pending').length },
    { name: 'In Transit', value: filteredOrders.filter(o => ['Processing', 'Out for Delivery', 'Ready for Pickup'].includes(o.status)).length },
    { name: 'Cancelled', value: filteredOrders.filter(o => o.status === 'Cancelled').length },
  ].filter(item => item.value > 0); // Hide empty slices

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

  const handleDownloadReport = () => {
    const csvContent = [
      ['AquaTrack Sales Report', `${dateFrom} to ${dateTo}`],
      [],
      ['Summary'],
      ['Total Sales', `PHP ${totalSales.toFixed(2)}`],
      ['Total Orders', totalOrders],
      ['Completed Orders', deliveredOrders],
      ['Average Order Value', `PHP ${averageOrderValue.toFixed(2)}`],
      [],
      ['Sales by Order Type'],
      ['Order Type', 'Orders Completed', 'Revenue Generated'],
      ...typeSalesData.map(p => [p.name, p.count, `PHP ${p.revenue.toFixed(2)}`]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aquatrack-sales-${dateFrom}-to-${dateTo}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Sales Reports</h1>
          
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div>
                  <Label htmlFor="dateFrom">From Date</Label>
                  <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="dateTo">To Date</Label>
                  <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDownloadReport} className="bg-green-600 hover:bg-green-700 text-white">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Sales</p>
                  <p className="text-2xl font-bold text-blue-600">₱{totalSales.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card><CardContent className="p-6"><div><p className="text-sm text-gray-600 mb-1">Total Orders</p><p className="text-2xl font-bold">{totalOrders}</p></div></CardContent></Card>
          <Card><CardContent className="p-6"><div><p className="text-sm text-gray-600 mb-1">Completed Orders</p><p className="text-2xl font-bold text-green-600">{deliveredOrders}</p></div></CardContent></Card>
          <Card><CardContent className="p-6"><div><p className="text-sm text-gray-600 mb-1">Avg Order Value</p><p className="text-2xl font-bold text-purple-600">₱{averageOrderValue.toFixed(2)}</p></div></CardContent></Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader><CardTitle>Sales by Order Type</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeSalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₱${value}`} />
                  <Bar dataKey="revenue" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Order Status Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%" cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}