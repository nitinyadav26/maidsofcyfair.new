import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

// Components
import BookingFlow from "./components/BookingFlow";
import BookingConfirmation from "./components/BookingConfirmation";
import { Toaster } from "./components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<BookingFlow />} />
          <Route path="/confirmation/:bookingId" element={<BookingConfirmation />} />
        </Routes>
        <Toaster />
      </Router>
    </div>
  );
}

export default App;