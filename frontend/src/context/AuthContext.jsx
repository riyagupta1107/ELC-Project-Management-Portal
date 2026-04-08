import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase.js'; 
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';

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
          const token = await user.getIdToken();
          
          const response = await axios.get("http://localhost:5000/api/users/profile", {
            headers: {
              "Authorization": `Bearer ${token}` 
            }
          });
          
          // Save exactly as it comes from the database ("FACULTY" or "STUDENT")
          setUserRole(response.data.role.toUpperCase()); 
        } catch (error) {
          console.error("Error fetching role:", error);
          setUserRole(null);
        }
      } else {
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