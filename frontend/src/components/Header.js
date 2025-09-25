import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Home, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';

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
            <img src={logo} alt="Maids of Cyfair" className="w-20 h-20" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Maids of Cyfair</h1>
              <p className="text-sm text-gray-600">Professional Cleaning Services</p>
            </div>
          </Link>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
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
              </>
            ) : (
              <>
                <Link to="/admin/login">
                  <Button variant="outline" size="sm" className="btn-hover">
                    <Shield className="mr-2" size={16} />
                    Admin
                  </Button>
                </Link>
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
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;