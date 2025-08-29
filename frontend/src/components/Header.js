import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Home } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header-nav">
      <div className="container">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Home className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Maids of Cyfair</h1>
              <p className="text-sm text-gray-600">Professional Cleaning Services</p>
            </div>
          </Link>

          {/* User Menu */}
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="text-gray-600" size={20} />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="btn-hover"
              >
                <LogOut className="mr-2" size={16} />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="outline" size="sm" className="btn-hover">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="btn-hover bg-primary hover:bg-primary-light">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;