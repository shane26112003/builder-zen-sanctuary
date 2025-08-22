import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  userType: 'general' | 'women' | 'elderly' | 'disabled' | 'pregnant';
  hasLuggage: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUserType: (userType: User['userType'], hasLuggage: boolean) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('metroUser');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simple demo authentication - in real app this would call an API
    if (password.length >= 6) {
      const newUser: User = {
        id: Date.now().toString(),
        email,
        userType: 'general',
        hasLuggage: false
      };
      setUser(newUser);
      setIsAuthenticated(true);
      localStorage.setItem('metroUser', JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('metroUser');
    localStorage.removeItem('userBookings');
  };

  const updateUserType = (userType: User['userType'], hasLuggage: boolean) => {
    if (user) {
      const updatedUser = { ...user, userType, hasLuggage };
      setUser(updatedUser);
      localStorage.setItem('metroUser', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      updateUserType,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};
