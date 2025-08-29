import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

// Components
import Header from "./components/Header";
import Login from "./components/Login";
import Register from "./components/Register";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import BookingFlow from "./components/BookingFlow";
import BookingConfirmation from "./components/BookingConfirmation";
import { Toaster } from "./components/ui/sonner";

// Auth Context
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/admin/login" />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user && user.role === 'admin') {
    return <Navigate to="/admin" />;
  }
  if (user && user.role === 'customer') {
    return <Navigate to="/" />;
  }
  return children;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="App">
      {user?.role !== 'admin' && <Header />}
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={
          <PublicRoute>
            <AdminLogin />
          </PublicRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute adminOnly={true}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        {/* Customer Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <BookingFlow />
          </ProtectedRoute>
        } />
        <Route path="/confirmation/:bookingId" element={
          <ProtectedRoute>
            <BookingConfirmation />
          </ProtectedRoute>
        } />
      </Routes>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;