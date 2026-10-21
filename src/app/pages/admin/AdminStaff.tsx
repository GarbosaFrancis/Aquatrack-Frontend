// @ts-nocheck
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { UserPlus, Users, Trash2, Shield, Truck } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';

export function AdminStaff() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [staff, setStaff] = useState([]);
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
    phone_number: '',
    role: 'Rider', // Default role
    address: 'Station HQ',
    barangay: 'Station Barangay'
  });

  if (!user || user.role !== 'admin') {
    navigate('/');
    return null;
  }

  // Read: Fetch the current staff roster
  const fetchStaff = async () => {
    try {
      const response = await fetch('http://localhost/aquatrack_api/get_staff.php');
      const data = await response.json();
      setStaff(data);
    } catch (error) {
      toast.error('Failed to load staff list');
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Create: Add a new staff member
  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      // We can safely reuse the admin_add_rider.php file here if you update it to accept dynamic roles, 
      // OR you can use your standard register script if modified. Assuming the existing endpoint works:
      const response = await fetch('http://localhost/aquatrack_api/admin_add_rider.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Injecting the specific role selected by the Admin
        body: JSON.stringify({...formData}) 
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`${formData.role} ${formData.fullname} added successfully!`);
        setFormData({ fullname: '', email: '', password: '', phone_number: '', role: 'Rider', address: 'Station HQ', barangay: 'Station Barangay' });
        fetchStaff(); // Instantly refresh the table
      } else {
        toast.error(data.message || 'Failed to create account.');
      }
    } catch (error) {
      toast.error('Server error.');
    }
  };

  // Delete: Remove a staff member
  const handleDelete = async (userId, fullname) => {
    if (!window.confirm(`Are you sure you want to remove ${fullname}?`)) return;

    // Prevent Admin from deleting themselves
    if (userId == user.id || userId == user.user_id) {
      return toast.error("You cannot delete your own admin account.");
    }

    try {
      const response = await fetch('http://localhost/aquatrack_api/delete_staff.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(`${fullname} has been removed from the system.`);
        fetchStaff(); // Refresh table
      } else {
        toast.error(data.message || 'Failed to delete staff member.');
      }
    } catch (error) {
      toast.error('Server error.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <Users className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column: The Creation Form */}
          <div className="lg:col-span-1">
            <Card className="border-blue-200 shadow-md sticky top-8">
              <CardHeader className="bg-blue-50 border-b pb-4">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                  Add New Employee
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleAddStaff} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Assign Role</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value) => setFormData({...formData, role: value})}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Rider">Delivery Rider</SelectItem>
                        <SelectItem value="Admin">Station Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input required placeholder="Juan Dela Cruz" value={formData.fullname} onChange={e => setFormData({...formData, fullname: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input required placeholder="09191234567" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input required type="email" placeholder="employee@aquatrack.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                    <Label>Temporary Password</Label>
                    <Input required type="text" placeholder="Create a password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  </div>

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 mt-6">
                    Create Account
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: The Current Staff Roster */}
          <div className="lg:col-span-2">
            <Card className="shadow-md">
              <CardHeader className="border-b pb-4">
                <CardTitle>Current Staff Roster</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr className="border-b">
                        <th className="text-left py-4 px-4 font-semibold text-gray-600">Employee</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-600">Contact</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-600">Role</th>
                        <th className="text-right py-4 px-4 font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.map((employee) => (
                        <tr key={employee.user_id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-bold text-gray-900">{employee.fullname}</div>
                            <div className="text-xs text-gray-400">Joined: {new Date(employee.created_at).toLocaleDateString()}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-gray-600">{employee.email}</div>
                            <div className="text-sm text-gray-500">{employee.phone_number}</div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="outline" className={`flex w-fit items-center gap-1 ${employee.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                              {employee.role === 'Admin' ? <Shield className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                              {employee.role}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => handleDelete(employee.user_id, employee.fullname)}
                              disabled={employee.user_id == user.id || employee.user_id == user.user_id} // Disable delete for the currently logged-in admin
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {staff.length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center py-8 text-gray-500">No staff members found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}