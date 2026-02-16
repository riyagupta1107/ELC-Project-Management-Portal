import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase.js';
import axios from 'axios';

import bgImage from '../assets/thapar-bg.jpeg'
import logo from '../assets/thapar-logo-new.png';

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);

      const user = userCredential.user;
      
      const response = await axios.get("http://localhost:5000/users/profile", {
        headers: {
          "Content-Type": "application/json",
          "x-firebase-uid": user.uid,
        },
      });
      const data = response.data;
      const role = data.role;

      if (role === "FACULTY") {
        navigate('/faculty-dashboard');
      } else {
        navigate('/student-dashboard');
      }
      
    } catch(err) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError("Invalid email or password.");
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else {
        setError('Login failed. Please try again.');
      }
    }
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 bg-[center_80%] bg-no-repeat" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="bg-gray-100 p-8 rounded-lg shadow-lg w-full max-w-2xl bg-opacity-85">
        
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <img src={logo} className='w-44 h-44 mx-auto block mb-6' />
          <div className='gap-6 mb-6'>
            <div className="mb-5">
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 font-inter">Email address</label>
              <input 
                type='email' 
                id='email' 
                name='email'
                value={formData.email}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                placeholder="john.doe@company.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 font-inter">Password</label>
              <input 
                type='password' 
                id='password' 
                name='password'
                value={formData.password}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                placeholder="•••••••••"
                required
              />
            </div>
          </div>
          
          <button 
            type="submit"
            className="text-white bg-brickRed p-3 font-medium rounded-lg focus:outline-none text-center w-full text-md hover:bg-burntBrick transition-colors ease-out px-5 shadow-lg"
          >
            Login
          </button>
        </form>

        {/* The Link to Sign Up */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              Sign Up
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Login;