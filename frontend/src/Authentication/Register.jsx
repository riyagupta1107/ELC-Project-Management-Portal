import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase.js';
import axios from 'axios';

import bgImage from '../assets/thapar-bg.jpeg';
import logo from '../assets/thapar-logo-new.png';

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    role: 'STUDENT',
    password: '',
    confirmPassword: '',
    agreed: false
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name] : type === 'checkbox' ? checked : value
    }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    let validationErrors = {};

    // Validation Logic
    if (!formData.firstName.trim()) validationErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) validationErrors.lastName = 'Last name is required';
    if (!formData.phone.trim()) validationErrors.phone = 'Phone number is required';
    if (!formData.email.trim()) validationErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) validationErrors.email = 'Invalid email';
    if (!formData.password) validationErrors.password = 'Password is required';
    else if (formData.password.length < 6) validationErrors.password = 'Minimum 6 characters';
    if (formData.confirmPassword !== formData.password) validationErrors.confirmPassword = 'Passwords do not match';
    if (!formData.agreed) validationErrors.agreed = 'You must agree to terms';

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      try {
        // 1. Create User in Firebase
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        // 2. Update Firebase Profile
        await updateProfile(user, {
          displayName: `${formData.firstName} ${formData.lastName}`,
        });

        // 3. Sync with MongoDB Backend (Essential for your app logic)
        await axios.post("http://localhost:5000/users/create", {
          firebaseUid: user.uid,
          email: user.email,
          role: formData.role, 
          firstName: formData.firstName,
          lastName: formData.lastName,
        });


        alert("Registration successful!");
        (formData.role == 'STUDENT') ? navigate('/student-dashboard') : navigate('/faculty-dashboard');
      } catch (error) {
        console.error("Registration Error:", error);
        if (error.code === 'auth/email-already-in-use') {
          alert('Email already in use');
        } else {
          alert('Registration failed: ' + error.message);
        }
      }      
    }
  }

  return (
    <div className="w-full min-h-screen bg-bgCustom flex items-center justify-center p-4 bg-[center_90%] bg-no-repeat" style={{ backgroundImage: `url(${bgImage})` }}>

      <form className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl bg-opacity-85" onSubmit={handleSubmit}>

        <img src={logo} className='w-44 h-44 mx-auto block mb-6' />
        {/* <h2 className="text-2xl font-bold mb-6 text-center text-customDarkText font-inter">Create an Account</h2> */}

        <div className="grid gap-6 mb-6 md:grid-cols-2 w-full">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-900 font-inter">First name</label>
            <input
              type="text"
              id="firstName"
              name="firstName" 
              value={formData.firstName} onChange={handleChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              placeholder="John"
            />
            {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
          </div>
          
          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block mb-2 text-sm font-medium text-gray-900 font-inter">Last name</label>
            <input
              type="text"
              id="lastName"
              name='lastName'
              value={formData.lastName} onChange={handleChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              placeholder="Doe"
            />
            {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-900 font-inter">Phone number</label>
            <input
              type="tel"
              id="phone"
              name='phone'
              value={formData.phone} onChange={handleChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              placeholder="123-456-7890"
            />
            {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
          </div>

          {/* Role Selection (New) */}
          <div>
            <label htmlFor="role" className="block mb-2 text-sm font-medium text-gray-900 font-inter">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            >
              <option value="STUDENT">Student</option>
              <option value="FACULTY">Faculty</option>
            </select>
          </div>
        </div>

        {/* Email */}
        <div className="mb-6">
          <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 font-inter">Email address</label>
          <input
            type="email"
            id="email"
            name='email'
            value={formData.email} onChange={handleChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            placeholder="john.doe@company.com"
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="mb-6">
          <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 font-inter">Password</label>
          <input
            type="password"
            id="password"
            name='password'
            value={formData.password} onChange={handleChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            placeholder="•••••••••"
          />
          {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-gray-900 font-inter">Confirm password</label>
          <input
            type="password"
            id="confirmPassword"
            name='confirmPassword'
            value={formData.confirmPassword} onChange={handleChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            placeholder="•••••••••"
          />
          {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start mb-6">
          <div className="flex items-center h-5">
            <input
              id="agreed"
              type="checkbox"
              name="agreed" 
              checked={formData.agreed} onChange={handleChange}
              className="w-4 h-4 border border-gray-300 rounded-sm bg-gray-50 focus:ring-3 focus:ring-blue-300"
            />
          </div>
          <label htmlFor="agreed" className="ms-2 text-sm font-medium text-gray-900">
            I agree with the <a href="#" className="text-blue-600 hover:underline">terms and conditions</a>.
          </label>
        </div>
        {errors.agreed && <p className="text-red-500 text-sm mb-4">{errors.agreed}</p>}

        <button
          type="submit"
          className="text-white bg-brickRed p-3 font-medium rounded-lg focus:outline-none text-center w-full text-md hover:bg-burntBrick transition-colors ease-out px-5 shadow-lg"
        >
          Register new account
        </button>

        {/* Link back to Login */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/" className="text-blue-600 hover:underline font-medium">
              Login
            </Link>
          </p>
        </div>

      </form>
    </div>
  );
}

export default Register;