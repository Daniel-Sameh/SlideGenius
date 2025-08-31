'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie';
import axios from "axios";
import apiClient from "@/services/api-client";
import presentationService from "@/services/presentation-service";
import { useToast } from "@/hooks/use-toast";

// Use same API pattern as presentation service
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? '/api'
  : `${process.env.NEXT_PUBLIC_API_URL}/api`;

export type UserType = {
  id: string;
  email: string;
  name: string;
} | null;

interface AuthContextType {
  user: UserType;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // This effect rehydrates the user state from localStorage on page load
    // so the UI updates instantly without waiting for an API call.
    try {
      const storedUser = localStorage.getItem("user");
      const token = Cookies.get("token");
      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      // If parsing fails, clear the invalid data
      localStorage.removeItem("user");
      Cookies.remove("token");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      // Use axios directly here because the content-type is different
      const response = await axios.post(`${API_BASE_URL}/auth/token`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const data = response.data;
      const token = data.access_token;

      // Set the token in a cookie
      Cookies.set('token', token, { expires: 7, path: '/' });

      const userPayload = {
        id: data.user_id,
        email: data.email,
        name: data.full_name || data.email.split('@')[0]
      };
      
      setUser(userPayload);
      // Store user info in localStorage for quick UI updates on refresh
      localStorage.setItem("user", JSON.stringify(userPayload));
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Incorrect email or password. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      
      await apiClient.post('/auth/register', {
        email,
        password,
        name
      });

      // Automatically log the user in after successful registration
      return await login(email, password);
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage = error.response?.data?.detail || "An unknown error occurred.";
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    Cookies.remove("token", { path: '/' });
    presentationService.clearCache();
    // Redirect to home page after logout
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};