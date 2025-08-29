import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

// Components
import Header from "./components/Header";
import Login from "./components/Login";
import Register from "./components/Register";
import BookingFlow from "./components/BookingFlow";
import BookingConfirmation from "./components/BookingConfirmation";
import { Toaster } from "./components/ui/sonner";

// Auth Context
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/" /> : children;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="App">
      <Header />
      <Routes>
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