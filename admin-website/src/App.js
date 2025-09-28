import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import OrderDetail from './components/OrderDetail';
import PrintTest from './components/PrintTest';
import AccessDenied from './components/AccessDenied';
import api from './services/api';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = api.getToken();
      if (token) {
        // Verify token by getting user profile
        const userProfile = await api.getProfile();
        setUser(userProfile);
        setIsAuthenticated(true);
        
        // Check if user is admin
        const isUserAdmin = userProfile.role === 'ADMIN';
        setIsAdmin(isUserAdmin);
        
        console.log('User profile:', userProfile);
        console.log('Is admin:', isUserAdmin);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      api.clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (phone, password) => {
    try {
      console.log('App: Attempting login...');
      const response = await api.login(phone, password);
      console.log('App: Login response:', response);
      
      // Handle different response formats
      let userData = response.user || response;
      if (response && response.user) {
        userData = response.user;
      } else if (response && response.name) {
        userData = response;
      } else {
        userData = { name: 'Admin', phone: phone };
      }
      
      console.log('App: Setting user data:', userData);
      setUser(userData);
      setIsAuthenticated(true);
      
      // Check if user is admin
      const isUserAdmin = userData.role === 'ADMIN';
      setIsAdmin(isUserAdmin);
      console.log('Is admin:', isUserAdmin);
      
      return { success: true };
    } catch (error) {
      console.error('App: Login error:', error);
      console.error('App: Error response:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Login failed' 
      };
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#10b981',
              color: 'white',
            },
          }}
        />
        
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                <Navigate to="/" replace /> : 
                <Login onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
                (isAdmin ? 
                  <Dashboard user={user} onLogout={handleLogout} /> : 
                  <AccessDenied onLogout={handleLogout} />
                ) : 
                <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/order/:orderId" 
            element={
              isAuthenticated ? 
                (isAdmin ? 
                  <OrderDetail user={user} onLogout={handleLogout} /> : 
                  <AccessDenied onLogout={handleLogout} />
                ) : 
                <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/print-test" 
            element={
              isAuthenticated ? 
                (isAdmin ? 
                  <PrintTest /> : 
                  <AccessDenied onLogout={handleLogout} />
                ) : 
                <Navigate to="/login" replace />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
