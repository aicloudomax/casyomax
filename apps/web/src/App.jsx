import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PrivacyPolicy from './pages/PrivacyPolicy';
import DeleteAccount from './pages/DeleteAccount';

function App() {
  return (
    <Router>
      <div className="App min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/delete-account" element={<DeleteAccount />} />
          </Routes>
        </div>

        {/* Simple Footer */}
        <footer className="bg-white border-t border-gray-200 py-6 text-center text-gray-500 text-sm">
          <div className="max-w-7xl mx-auto px-4">
            <p className="mb-2">&copy; {new Date().getFullYear()} Casyomax. All rights reserved.</p>
            <div className="space-x-4">
              <a href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="/delete-account" className="hover:text-primary transition-colors">Delete Account</a>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
