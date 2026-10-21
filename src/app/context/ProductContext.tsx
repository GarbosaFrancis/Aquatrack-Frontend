// @ts-nocheck
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../types';

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleStock: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);

  // 1. Fetch from database on load
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost/aquatrack_api/get_services.php');
        const dbData = await response.json();

        // 2. Map the MySQL 'services' table columns to the frontend 'Product' structure
        const formattedProducts: Product[] = dbData.map((dbService: any) => ({
          id: dbService.service_id.toString(),
          name: dbService.service_name,
          price: parseFloat(dbService.price),
          inStock: Number(dbService.is_active) === 1,
          
          // Fallback UI values for things not in your current database schema
          description: 'Water Refill Service',
          category: 'Refill',
          image: dbService.image_url || '/placeholder.jpg' 
        }));

        setProducts(formattedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  // Note: These functions currently only update the UI. 
  // You will need PHP POST requests here later if Admins can add/edit products from the website.
  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct: Product = { ...product, id: Date.now().toString() };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const toggleStock = (id: string) => {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, inStock: !p.inStock } : p)));
  };

  const getProductById = (id: string) => products.find(p => p.id === id);

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct, toggleStock, getProductById }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error('useProducts must be used within ProductProvider');
  return ctx;
}