import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaDumbbell } from 'react-icons/fa';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: '',
    role: 'user',
    agreeToTerms: false,
    subscribeNewsletter: false,
    // Trainer-specific fields
    experience: '',
    certifications: '',
    specializations: '',
    bio: '',
    motivation: ''
  });
  const [errors, setErrors] = useState({});
  const [validationStatus, setValidationStatus] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Prefill selected role if navigated from homepage CTA
  useEffect(() => {
    const preselectedRole = location.state?.role;
    if (preselectedRole && (preselectedRole === 'user' || preselectedRole === 'trainer')) {
      setFormData(prev => ({ ...prev, role: preselectedRole }));
    }
  }, [location.state]);

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'firstName':
  if (!value.trim()) error = 'First name is required';
  else if (!/^[A-Za-z\s]+$/.test(value)) error = 'First name can only contain letters and spaces';
  break;

case 'lastName':
  if (!value.trim()) error = 'Last name is required';
  else if (!/^[A-Za-z\s]+$/.test(value)) error = 'Last name can only contain letters and spaces';
  break;

      case 'email':
        if (!value.trim()) error = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Please enter a valid email address';
        break;
      case 'phone':
        if (!value.trim()) {
          error = 'Phone number is required';
        } else if (value.length < 10) {
          if (value.length > 0 && !/^[6-9]/.test(value)) {
            error = 'Indian numbers must start with 6, 7, 8, or 9';
          } else if (value.length > 0 && !/^\d+$/.test(value)) {
            error = 'Phone number can only contain digits';
          } else if (value.length < 4) {
            error = 'Enter at least 4 digits to validate';
          } else {
            error = `Enter ${10 - value.length} more digits`;
          }
        } else if (value.length === 10) {
          const indianPhoneRegex = /^[6-9]\d{9}$/;
          if (!indianPhoneRegex.test(value)) {
            error = 'Invalid Indian phone number format';
          }
        } else if (value.length > 10) {
          error = 'Phone number cannot exceed 10 digits';
        }
        break;
      case 'password':
        if (!value) error = 'Password is required';
        else if (value.length < 8) error = 'Password must be at least 8 characters long';
        break;
      case 'confirmPassword':
        if (!value) error = 'Please confirm your password';
        else if (value !== formData.password) error = 'Passwords do not match';
        break;
      case 'dateOfBirth':
        if (!value) error = 'Date of birth is required';
        else {
          const today = new Date();
          const birthDate = new Date(value);
          const age = today.getFullYear() - birthDate.getFullYear();
          if (age < 13) error = 'You must be at least 13 years old to register';
        }
        break;
      case 'gender':
        if (!value) error = 'Please select your gender';
        break;
      case 'agreeToTerms':
        if (!formData.agreeToTerms) error = 'You must agree to the terms and conditions';
        break;
      // Trainer-specific validations
      case 'experience':
        if (formData.role === 'trainer' && !value.trim()) error = 'Experience is required for trainers';
        else if (formData.role === 'trainer' && value.trim().length < 50) error = 'Please provide at least 50 characters describing your experience';
        break;
      case 'certifications':
        if (formData.role === 'trainer' && !value.trim()) error = 'Certifications are required for trainers';
        break;
      case 'specializations':
        if (formData.role === 'trainer' && !value.trim()) error = 'Please specify your training specializations';
        break;
      case 'bio':
        if (formData.role === 'trainer' && !value.trim()) error = 'Bio is required for trainers';
        else if (formData.role === 'trainer' && value.trim().length < 30) error = 'Please provide at least 30 characters for your bio';
        break;
      case 'motivation':
        if (formData.role === 'trainer' && !value.trim()) error = 'Please explain your motivation to join as a trainer';
        break;
      default:
        break;
    }

    return error;
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setErrors({ submit: 'Enter the 6-digit OTP sent to your email.' });
      return;
    }
    setIsLoading(true);
    try {
      await axios.post('http://localhost:5000/signup-verify', {
        email: formData.email,
        otp: otp.trim()
      });
      alert('Email verified! You can now log in.');
      navigate('/login', { replace: true });
    } catch (err) {
      setErrors({ submit: err?.response?.data?.msg || 'OTP verification failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let updatedValue = type === 'checkbox' ? checked : value;

    // Special handling for phone number - only allow digits and limit to 10
    if (name === 'phone') {
      updatedValue = value.replace(/\D/g, '').slice(0, 10);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: updatedValue
    }));

    // Live validation on change for text inputs
    if (type !== 'checkbox') {
      const error = validateField(name, updatedValue);
      setErrors((prev) => ({
        ...prev,
        [name]: error
      }));

      // Set validation status for visual feedback
      if (name === 'phone') {
        let status = 'invalid';
        if (updatedValue.length === 0) {
          status = 'empty';
        } else if (updatedValue.length >= 1 && /^[6-9]/.test(updatedValue)) {
          if (updatedValue.length === 10 && /^[6-9]\d{9}$/.test(updatedValue)) {
            status = 'valid';
          } else if (updatedValue.length < 10) {
            status = 'partial';
          }
        }
        setValidationStatus((prev) => ({
          ...prev,
          [name]: status
        }));
      } else {
        // For other fields
        setValidationStatus((prev) => ({
          ...prev,
          [name]: error ? 'invalid' : 'valid'
        }));
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const signupData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        role: formData.role,
        subscribeNewsletter: formData.subscribeNewsletter,
        // Include trainer fields if role is trainer
        ...(formData.role === 'trainer' && {
          experience: formData.experience,
          certifications: formData.certifications,
          specializations: formData.specializations,
          bio: formData.bio,
          motivation: formData.motivation
        })
      };

      if (formData.role === 'trainer') {
        await axios.post('http://localhost:5000/signup', signupData);
        alert('Trainer application submitted! Please wait for admin approval.');
        navigate('/login');
      } else {
        await axios.post('http://localhost:5000/signup-init', signupData);
        setIsOtpStep(true);
        setErrors({});
      }
    } catch (err) {
      console.error('Signup error:', err);
      setErrors({
        submit: err.response?.data?.msg || err.response?.data?.message || 'Signup failed. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    const from = location.state?.from || '/';
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-slate-950 py-8 px-4 relative">
      {/* background accents */}
      <div className="pointer-events-none absolute inset-0 opacity-10" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(60rem_60rem_at_120%_-20%,rgba(255,255,255,0.08),transparent)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(50rem_50rem_at_-10%_120%,rgba(255,192,203,0.05),transparent)]"></div>
      </div>
      {/* Back to Home Button */}
      <button
        onClick={handleBackToHome}
        className="fixed top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-secondary-700 rounded-lg hover:bg-white hover:text-secondary-900 transition-all duration-200 shadow-sm hover:shadow-md z-10"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Home
      </button>

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-pink-200 to-purple-200 bg-clip-text text-transparent mb-2">Join Fit-Hub Portal</h2>
          <p className="text-gray-200">Create your account to get started</p>
        </div>

        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {errors.submit}
          </div>
        )}

        {!isOtpStep && (
        <form onSubmit={handleSignup} className="bg-white rounded-2xl shadow-xl p-8 space-y-8 border border-gray-200">
          {/* Personal Information */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-secondary-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`input-field ${errors.firstName ? 'border-red-300 focus:ring-red-500' : ''}`}
                  placeholder="Enter your first name"
                />
                {errors.firstName && <span className="text-sm text-red-600 mt-1 block">{errors.firstName}</span>}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-secondary-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`input-field ${errors.lastName ? 'border-red-300 focus:ring-red-500' : ''}`}
                  placeholder="Enter your last name"
                />
                {errors.lastName && <span className="text-sm text-red-600 mt-1 block">{errors.lastName}</span>}
              </div>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`input-field ${errors.email ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="Enter your email address"
              />
              {errors.email && <span className="text-sm text-red-600 mt-1 block">{errors.email}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 mb-2">Phone Number *</label>
              <div className="relative">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`input-field pr-10 ${errors.phone ? 'border-red-300 focus:ring-red-500' : ''}`}
                  placeholder="Enter your 10-digit Indian number"
                  maxLength="10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400">
                  {validationStatus.phone === 'valid' && <span className="text-green-600">✓</span>}
                  {validationStatus.phone === 'invalid' && <span className="text-red-600">✗</span>}
                  {validationStatus.phone === 'partial' && <span className="text-yellow-500">⏳</span>}
                </div>
              </div>
              {errors.phone && <span className="text-sm text-red-600 mt-1 block">{errors.phone}</span>}
              {!errors.phone && formData.phone.length > 0 && validationStatus.phone === 'valid' && (
                <span className="text-sm text-green-600 mt-1 block">✓ Valid Indian phone number</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-secondary-700 mb-2">Date of Birth *</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                onBlur={handleBlur}
                max={new Date().toISOString().split('T')[0]}
                className={`input-field ${errors.dateOfBirth ? 'border-red-300 focus:ring-red-500' : ''}`}
              />
              {errors.dateOfBirth && <span className="text-sm text-red-600 mt-1 block">{errors.dateOfBirth}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="gender" className="block text-sm font-medium text-secondary-700 mb-2">Gender *</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`input-field ${errors.gender ? 'border-red-300 focus:ring-red-500' : ''}`}
              >
                <option value="">Select your gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
              {errors.gender && <span className="text-sm text-red-600 mt-1 block">{errors.gender}</span>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-medium text-secondary-700 mb-2">Account Type *</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="tablist" aria-label="Account type">
                <button
                  type="button"
                  className={`p-4 border-2 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                    formData.role === 'user'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-secondary-200 bg-white text-secondary-700 hover:border-secondary-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, role: 'user' }))}
                  role="tab"
                  aria-selected={formData.role === 'user'}
                >
                  <span className="text-2xl" aria-hidden="true"><FaUser /></span>
                  <div className="text-left">
                    <span className="block font-semibold">User</span>
                    <span className="block text-sm opacity-75">Access fitness content</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`p-4 border-2 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                    formData.role === 'trainer'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-secondary-200 bg-white text-secondary-700 hover:border-secondary-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, role: 'trainer' }))}
                  role="tab"
                  aria-selected={formData.role === 'trainer'}
                >
                  <span className="text-2xl" aria-hidden="true"><FaDumbbell /></span>
                  <div className="text-left">
                    <span className="block font-semibold">Trainer</span>
                    <span className="block text-sm opacity-75">Create tutorials & help users</span>
                  </div>
                </button>
              </div>

              {formData.role === 'trainer' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                  <span className="text-blue-600">ℹ️</span>
                  <span className="text-blue-700 text-sm">
                    As a trainer, you'll be able to create tutorials, upload content, and help users with their fitness questions.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trainer-Specific Information */}
        {formData.role === 'trainer' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">Professional Information</h3>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 flex gap-3">
              <div className="text-2xl">🏋️</div>
              <div className="flex-1">
                <strong className="text-primary-900">Trainer Application</strong>
                <p className="text-primary-700 text-sm mt-1">Please provide your professional details to help us review your application.</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="experience" className="block text-sm font-medium text-secondary-700 mb-2">Professional Experience *</label>
              <textarea
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`input-field ${errors.experience ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="Describe your fitness/training experience, background, and qualifications. Include years of experience, types of training you've done, and any relevant work history. (Minimum 50 characters)"
                rows="4"
              />
              {errors.experience && <span className="text-sm text-red-600 mt-1 block">{errors.experience}</span>}
              <div className="text-xs text-secondary-500">
                {formData.experience.length}/50 minimum
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="certifications" className="block text-sm font-medium text-secondary-700 mb-2">Certifications & Qualifications *</label>
              <textarea
                id="certifications"
                name="certifications"
                value={formData.certifications}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`input-field ${errors.certifications ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="List your fitness certifications, degrees, and qualifications. Include certification bodies, dates, and any specializations. (e.g., NASM-CPT, ACE, ACSM, etc.)"
                rows="3"
              />
              {errors.certifications && <span className="text-sm text-red-600 mt-1 block">{errors.certifications}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="specializations" className="block text-sm font-medium text-secondary-700 mb-2">Training Specializations *</label>
              <input
                type="text"
                id="specializations"
                name="specializations"
                value={formData.specializations}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`input-field ${errors.specializations ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="e.g., Strength Training, Weight Loss, Yoga, HIIT, Sports Performance, Rehabilitation"
              />
              {errors.specializations && <span className="text-sm text-red-600 mt-1 block">{errors.specializations}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="bio" className="block text-sm font-medium text-secondary-700 mb-2">Professional Bio *</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`input-field ${errors.bio ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="Write a brief professional bio that will be shown to users. Describe your training philosophy, approach, and what makes you unique as a trainer. (Minimum 30 characters)"
                rows="3"
              />
              {errors.bio && <span className="text-sm text-red-600 mt-1 block">{errors.bio}</span>}
              <div className="text-xs text-secondary-500">
                {formData.bio.length}/30 minimum
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="motivation" className="block text-sm font-medium text-secondary-700 mb-2">Why do you want to join Fit-Hub? *</label>
              <textarea
                id="motivation"
                name="motivation"
                value={formData.motivation}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`input-field ${errors.motivation ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="Tell us why you want to become a trainer on our platform and how you plan to help our users achieve their fitness goals."
                rows="3"
              />
              {errors.motivation && <span className="text-sm text-red-600 mt-1 block">{errors.motivation}</span>}
            </div>
          </div>
        )}

        {/* Account Security */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">Account Security</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`input-field ${errors.password ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="Create a strong password"
              />
              {errors.password && <span className="text-sm text-red-600 mt-1 block">{errors.password}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700 mb-2">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`input-field ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && <span className="text-sm text-red-600 mt-1 block">{errors.confirmPassword}</span>}
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="space-y-4">
            <label className="flex items-start gap-3 text-secondary-700 cursor-pointer">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className="mt-1 w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm">
                I agree to the <a href="/terms" target="_blank" className="text-primary-600 hover:text-primary-700 underline">Terms and Conditions</a> and <a href="/privacy" target="_blank" className="text-primary-600 hover:text-primary-700 underline">Privacy Policy</a> *
              </span>
            </label>
            {errors.agreeToTerms && <span className="text-sm text-red-600 block">{errors.agreeToTerms}</span>}
          </div>

          <div className="space-y-2">
            <label className="flex items-start gap-3 text-secondary-700 cursor-pointer">
              <input
                type="checkbox"
                name="subscribeNewsletter"
                checked={formData.subscribeNewsletter}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm">
                Subscribe to our newsletter for fitness tips and updates
              </span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 text-base font-semibold bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-700 hover:to-purple-800 text-white rounded-xl shadow-md"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      )}

      {isOtpStep && (
        <form onSubmit={handleVerifyOtp} className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Verify Your Email</h3>
          <p className="text-secondary-700">We sent a 6-digit verification code to <strong>{formData.email}</strong>. Enter it below to activate your account.</p>
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-secondary-700 mb-2">Verification Code</label>
            <input
              id="otp"
              name="otp"
              inputMode="numeric"
              maxLength={6}
              className={`input-field ${errors.submit ? 'border-red-300 focus:ring-red-500' : ''}`}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </div>
          <button type="submit" className="w-full py-3 text-base font-semibold bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-700 hover:to-purple-800 text-white rounded-xl shadow-md" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </button>
          <div className="flex items-center justify-between text-sm text-secondary-600">
            <button type="button" className="text-primary-600 hover:text-primary-700" onClick={() => setIsOtpStep(false)}>Go back</button>
            <button
              type="button"
              className="text-primary-600 hover:text-primary-700"
              onClick={async () => {
                try {
                  setIsLoading(true);
                  await axios.post('http://localhost:5000/signup-resend', { email: formData.email });
                  setErrors({});
                  alert('Verification code resent to your email.');
                } catch (err) {
                  setErrors({ submit: err?.response?.data?.msg || 'Failed to resend OTP. Please try again.' });
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              Resend code
            </button>
          </div>
        </form>
      )}

        <div className="text-center mt-6">
          <p className="text-gray-200">
            Already have an account? <Link to="/login" state={{ from: location.state?.from || '/' }} className="text-pink-300 hover:text-pink-200 font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;