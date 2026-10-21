// @ts-nocheck
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, CartItem } from '../types';

// 1. The Blueprint (Updated to accept the new async Promise)
interface OrderContextType {
  orders: Order[];
  createOrder: (orderData: any) => Promise<any>;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  assignRider: (orderId: string, riderId: string) => void;
  updateEmptiesReturned: (orderId: string, emptiesReturned: number) => void;
  getOrderById: (orderId: string) => Order | undefined;
  getUserOrders: (userId: string) => Order[];
  getAllOrders: () => Order[];
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);

  // 2. Fetch real data from your PHP backend when the app loads
  useEffect(() => {
    const fetchOrdersFromDB = async () => {
      try {
        const response = await fetch('http://localhost/aquatrack_api/get_orders.php');
        const dbData = await response.json();

        const formattedOrders: Order[] = dbData.map((dbOrder: any) => ({
          id: dbOrder.order_id,             
          userId: dbOrder.user_id,          
          status: dbOrder.status,
          total: parseFloat(dbOrder.total_amount),
          createdAt: dbOrder.order_date,
          updatedAt: dbOrder.order_date,
          customerName: 'Customer', 
          customerEmail: 'N/A',
          customerPhone: 'N/A',
          deliveryAddress: 'N/A',
          orderType: 'delivery',
          items: [],
          subtotal: parseFloat(dbOrder.total_amount),
          deliveryFee: 0,
          paymentMethod: 'Cash'
        }));

        setOrders(formattedOrders);
        console.log("Successfully connected to database and loaded orders!");
      } catch (error) {
        console.error("Failed to fetch from backend:", error);
      }
    };

    fetchOrdersFromDB();
  }, []);

  // 3. The new Async Create Order function
  const createOrder = async (orderData: any) => {
    try {
      const response = await fetch('http://localhost/aquatrack_api/create_order.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.success) {
        // Combine the cart/customer data we sent with the new ID the database gave us
        const fullOrder = {
          ...orderData,
          id: data.newOrder.id,
          status: 'pending'
        };

        setOrders(prev => [fullOrder, ...prev]);
        return fullOrder;
      } else {
        console.error("Failed to save order to database.");
        return null;
      }
    } catch (error) {
      console.error("Error creating order:", error);
      return null;
    }
  };

  // 4. The rest of the UI update functions
  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId
          ? { ...order, status, updatedAt: new Date().toISOString() }
          : order
      )
    );
  };

  const assignRider = (orderId: string, riderId: string) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId
          ? { ...order, assignedRider: riderId, updatedAt: new Date().toISOString() }
          : order
      )
    );
  };

  const updateEmptiesReturned = (orderId: string, emptiesReturned: number) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId
          ? { ...order, emptiesReturned, updatedAt: new Date().toISOString() }
          : order
      )
    );
  };

  const getOrderById = (orderId: string) => {
  return orders.find(order => String(order.id) === String(orderId));
};

  const getUserOrders = (userId: string) => {
    return orders.filter(order => order.userId === userId);
  };

  const getAllOrders = () => {
    return orders;
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        createOrder,
        updateOrderStatus,
        assignRider,
        updateEmptiesReturned,
        getOrderById,
        getUserOrders,
        getAllOrders,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within OrderProvider');
  }
  return context;
}