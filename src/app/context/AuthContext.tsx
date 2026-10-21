// @ts-nocheck
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: 'customer' | 'admin' | 'rider') => Promise<{ success: boolean; message?: string }>;
  register: (userData: Omit<User, 'id' | 'role' | 'borrowedBottles'> & { password: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('aquatrack_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string, role?: 'customer' | 'admin' | 'rider') => {
    try {
      // Send login data to PHP
      const response = await fetch('http://localhost/aquatrack_api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      
      const data = await response.json();

      if (data.success) {
        setUser(data.user); // data.user must be sent back from your PHP script!
        localStorage.setItem('aquatrack_user', JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Invalid credentials' };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: 'Could not connect to server.' };
    }
  };

  const register = async (userData: Omit<User, 'id' | 'role' | 'borrowedBottles'> & { password: string }) => {
    try {
      // Send registration data to PHP
      const response = await fetch('http://localhost/aquatrack_api/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (data.success) {
        // Assuming your PHP script returns the newly created user object
        setUser(data.user); 
        localStorage.setItem('aquatrack_user', JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, message: 'Could not connect to server.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aquatrack_user');
  };

  // Profile updates would also need a POST fetch to an update_profile.php script eventually
  const updateProfile = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('aquatrack_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}