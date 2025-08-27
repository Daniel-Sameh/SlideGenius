import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import presentationService from "../services/presentationService";

const API_BASE_URL = 'https://slidegenius-production.up.railway.app/api';

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

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      presentationService.setToken(token);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      console.log("Logging in....")

      const response = await fetch(`${API_BASE_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      console.log("login res: ",response)

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      const token = data.access_token;

      // Set the token in the presentation service
      presentationService.setToken(token);

      // Create user object
      const user = {
        id: data.user_id || email,
        email,
        name: email.split('@')[0]
      };
      
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams({
        email,
        password,
        name
      });
      
      const response = await fetch(`${API_BASE_URL}/auth/register?${params.toString()}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      // After registration, log the user in
      return login(email, password);
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    presentationService.clearToken();
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
