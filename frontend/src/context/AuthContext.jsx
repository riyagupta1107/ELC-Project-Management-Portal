import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase.js'; 
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';
import axiosInstance from '../api/axiosInstance.js';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // axiosInstance automatically attaches the token and base URL!
          const response = await axiosInstance.get("/users/profile"); 
          setUserRole(response.data.role.toUpperCase()); 
        } catch (error) {
            console.error("Error fetching role:", error);
            setUserRole(null);
          }
        }
      else {
        setUserRole(null);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userRole, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};