import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import axios from "axios";

// Components
import BookingFlow from "./components/BookingFlow";
import BookingConfirmation from "./components/BookingConfirmation";

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
      </Router>
    </div>
  );
}

export default App;