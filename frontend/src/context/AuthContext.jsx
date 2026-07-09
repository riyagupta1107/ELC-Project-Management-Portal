import { createContext, useState, useEffect, useContext } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on initial load
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // If token exists, fetch the user profile
          const response = await axiosInstance.get('/api/users/profile');
          setUser(response.data);
        } catch (error) {
          console.error("Token invalid or expired", error);
          localStorage.removeItem('token'); // Clear bad token
        }
      }
      setLoading(false);
    };
    checkUserLoggedIn();
  }, []);

  const login = async (email, password) => {
    const response = await axiosInstance.post('/api/users/login', { email, password });
    const { token, ...userData } = response.data;
    localStorage.setItem('token', token); // Save token
    setUser(userData); // Save user state (token excluded)
    return userData;
  };

  const register = async (userData) => {
    const response = await axiosInstance.post('/api/users/register', userData);
    const { token, ...newUserData } = response.data;
    localStorage.setItem('token', token);
    setUser(newUserData); // Save user state (token excluded)
    return newUserData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);