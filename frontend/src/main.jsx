import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast';
import './index.css'
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  

// ... inside your render:
<AuthProvider>
  <SocketProvider>
    <App />
    <Toaster position="top-right" />
  </SocketProvider>
</AuthProvider>
)
