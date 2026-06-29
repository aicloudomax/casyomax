import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import PrivacyPolicy from './pages/PrivacyPolicy';
import DeleteAccount from './pages/DeleteAccount';

function App() {
  return (
    <Router>
      <div className="App min-h-screen bg-gray-50 flex flex-col">
        {/* Navigation Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <img src="/favicon.png" alt="Casyomax Logo" className="w-8 h-8 rounded-lg shadow-sm" />
              <span className="text-xl font-bold text-primary tracking-tight">Casyomax</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link to="/privacy-policy" className="text-sm font-medium text-gray-500 hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/delete-account" className="text-sm font-medium text-gray-500 hover:text-primary transition-colors">Delete Account</Link>
            </div>
          </div>
        </header>

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
              <Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/delete-account" className="hover:text-primary transition-colors">Delete Account</Link>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
