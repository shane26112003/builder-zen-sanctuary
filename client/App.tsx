import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BookingProvider } from "@/contexts/BookingContext";

import Login from "./pages/Login";
import UserType from "./pages/UserType";
import Booking from "./pages/Booking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// User type route (requires authentication but not user type selection)
const UserTypeRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user && user.userType !== 'general') {
    return <Navigate to="/booking" replace />;
  }
  
  return <>{children}</>;
};

// Booking route (requires authentication and user type selection)
const BookingRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user && user.userType === 'general') {
    return <Navigate to="/user-type" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          isAuthenticated 
            ? (user && user.userType === 'general' 
                ? <Navigate to="/user-type" replace /> 
                : <Navigate to="/booking" replace />)
            : <Navigate to="/login" replace />
        } 
      />
      <Route path="/login" element={<Login />} />
      <Route 
        path="/user-type" 
        element={
          <UserTypeRoute>
            <UserType />
          </UserTypeRoute>
        } 
      />
      <Route 
        path="/booking" 
        element={
          <BookingRoute>
            <BookingProvider>
              <Booking />
            </BookingProvider>
          </BookingRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
