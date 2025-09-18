import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaDumbbell, FaSpa } from 'react-icons/fa';

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
    motivation: '',
    resumeUrl: ''
  });
  const [resumeUploading, setResumeUploading] = useState(false);
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
          motivation: formData.motivation,
          resumeUrl: formData.resumeUrl
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

  // Match YogaIndexPage hero background
  const heroBg = 'https://images6.alphacoders.com/126/thumb-1920-1263719.jpg';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative text-white"
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 25%'
      }}
    >
      {/* Overlays to match YogaIndexPage */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/70" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.7) 100%)'
        }}
      />

      {/* Top header brand + Back button */}
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaSpa className="text-orange-400 text-2xl" />
            <span className="text-2xl font-extrabold tracking-wide">
              FIT<span className="text-orange-400">HUB</span>
            </span>
          </div>

          <button
            onClick={handleBackToHome}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-secondary-700 rounded-lg hover:bg-white hover:text-secondary-900 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Home
          </button>
        </div>
      </header>

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/70 to-black/70 border border-white/10 shadow-2xl backdrop-blur-md">
          {/* Glow accents */}
          <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />

          <div className="relative p-6 sm:p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-extrabold">
                Join <span className="text-orange-400">FITHUB</span>
              </h1>
              <p className="text-gray-300 mt-2">Create your account to start your wellness journey</p>
            </div>

            {errors.submit && (
              <div className="mb-6 p-4 bg-red-950/40 text-red-200 border border-red-900/40 rounded-lg text-sm">
                {errors.submit}
              </div>
            )}

            {!isOtpStep && (
            <form onSubmit={handleSignup} className="space-y-8">
              {/* Personal Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-200 border-b border-white/10 pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-200 mb-2">
                      First Name <span className="text-orange-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${errors.firstName ? 'border-red-400 focus:ring-red-500' : ''}`}
                      placeholder="Enter your first name"
                    />
                    {errors.firstName && <span className="text-sm text-red-400 mt-1 block">{errors.firstName}</span>}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-200 mb-2">
                      Last Name <span className="text-orange-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${errors.lastName ? 'border-red-400 focus:ring-red-500' : ''}`}
                      placeholder="Enter your last name"
                    />
                    {errors.lastName && <span className="text-sm text-red-400 mt-1 block">{errors.lastName}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">Email Address <span className="text-orange-400">*</span></label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${errors.email ? 'border-red-400 focus:ring-red-500' : ''}`}
                      placeholder="Enter your email address"
                    />
                    {errors.email && <span className="text-sm text-red-400 mt-1 block">{errors.email}</span>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-200 mb-2">Phone Number <span className="text-orange-400">*</span></label>
                    <div className="relative">
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 pr-10 ${errors.phone ? 'border-red-400 focus:ring-red-500' : ''}`}
                        placeholder="Enter your 10-digit Indian number"
                        maxLength="10"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {validationStatus.phone === 'valid' && <span className="text-green-400">✓</span>}
                        {validationStatus.phone === 'invalid' && <span className="text-red-400">✗</span>}
                        {validationStatus.phone === 'partial' && <span className="text-yellow-400">⏳</span>}
                      </div>
                    </div>
                    {errors.phone && <span className="text-sm text-red-400 mt-1 block">{errors.phone}</span>}
                    {!errors.phone && formData.phone.length > 0 && validationStatus.phone === 'valid' && (
                      <span className="text-sm text-green-400 mt-1 block">✓ Valid Indian phone number</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-200 mb-2">Date of Birth <span className="text-orange-400">*</span></label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${errors.dateOfBirth ? 'border-red-400 focus:ring-red-500' : ''}`}
                    />
                    {errors.dateOfBirth && <span className="text-sm text-red-400 mt-1 block">{errors.dateOfBirth}</span>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-200 mb-2">Gender <span className="text-orange-400">*</span></label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${errors.gender ? 'border-red-400 focus:ring-red-500' : ''}`}
                    >
                      <option value="" className="bg-gray-800 text-white">Select your gender</option>
                      <option value="male" className="bg-gray-800 text-white">Male</option>
                      <option value="female" className="bg-gray-800 text-white">Female</option>
                      <option value="other" className="bg-gray-800 text-white">Other</option>
                      <option value="prefer-not-to-say" className="bg-gray-800 text-white">Prefer not to say</option>
                    </select>
                    {errors.gender && <span className="text-sm text-red-400 mt-1 block">{errors.gender}</span>}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="block text-sm font-medium text-gray-200 mb-2">Account Type <span className="text-orange-400">*</span></label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="tablist" aria-label="Account type">
                      <button
                        type="button"
                        className={`p-4 border-2 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                          formData.role === 'user'
                            ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                            : 'border-white/20 bg-white/10 text-gray-200 hover:border-white/30 hover:bg-white/15'
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
                            ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                            : 'border-white/20 bg-white/10 text-gray-200 hover:border-white/30 hover:bg-white/15'
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
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex gap-2">
                        <span className="text-orange-400">ℹ️</span>
                        <span className="text-orange-200 text-sm">
                          As a trainer, you'll be able to create tutorials, upload content, and help users with their fitness questions.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
        </div>

              {/* Trainer-Specific Information */}
              {formData.role === 'trainer' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-200 border-b border-white/10 pb-2">Professional Information</h3>
                  <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-lg p-4 flex gap-3">
                    <div className="text-2xl">🏋️</div>
                    <div className="flex-1">
                      <strong className="text-orange-300">Trainer Application</strong>
                      <p className="text-orange-200 text-sm mt-1">Please provide your professional details to help us review your application.</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="block text-sm font-medium text-gray-200 mb-2">Upload Resume (PDF/DOC/DOCX)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={async (e) => {
                          const file = e.target.files && e.target.files[0];
                          if (!file) return;
                          setResumeUploading(true);
                          try {
                            const form = new FormData();
                            form.append('file', file);
                            form.append('email', formData.email || '');
                            const res = await axios.post('http://localhost:5000/upload/resume', form, {
                              headers: { 'Content-Type': 'multipart/form-data' }
                            });
                            if (res.data?.success && res.data?.url) {
                              setFormData((prev) => ({ ...prev, resumeUrl: res.data.url }));
                            }
                          } catch (_) {
                            alert('Resume upload failed. Please try again.');
                          } finally {
                            setResumeUploading(false);
                          }
                        }}
                        className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-500/20 file:text-orange-200 hover:file:bg-orange-500/30"
                      />
                      {resumeUploading && <span className="text-orange-300 text-sm">Uploading…</span>}
                    </div>
                    {formData.resumeUrl && (
                      <a
                        href={(function(){
                          const url = formData.resumeUrl || '';
                          if (/^https?:\/\//.test(url)) return url;
                          const apiBase = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
                          if (url.startsWith('/uploads/')) return `${apiBase}${url}`;
                          return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
                        })()}
                        target="_blank" rel="noreferrer" className="text-orange-300 text-sm underline">
                        View uploaded resume
                      </a>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="experience" className="block text-sm font-medium text-gray-200 mb-2">Professional Experience <span className="text-orange-400">*</span></label>
                    <textarea
                      id="experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${errors.experience ? 'border-red-400 focus:ring-red-500' : ''}`}
                      placeholder="Describe your fitness/training experience, background, and qualifications. Include years of experience, types of training you've done, and any relevant work history. (Minimum 50 characters)"
                      rows="4"
                    />
                    {errors.experience && <span className="text-sm text-red-400 mt-1 block">{errors.experience}</span>}
                    <div className="text-xs text-gray-400">
                      {formData.experience.length}/50 minimum
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="certifications" className="block text-sm font-medium text-gray-200 mb-2">Certifications & Qualifications <span className="text-orange-400">*</span></label>
                    <textarea
                      id="certifications"
                      name="certifications"
                      value={formData.certifications}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${errors.certifications ? 'border-red-400 focus:ring-red-500' : ''}`}
                      placeholder="List your fitness certifications, degrees, and qualifications. Include certification bodies, dates, and any specializations. (e.g., NASM-CPT, ACE, ACSM, etc.)"
                      rows="3"
                    />
                    {errors.certifications && <span className="text-sm text-red-400 mt-1 block">{errors.certifications}</span>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="specializations" className="block text-sm font-medium text-gray-200 mb-2">Training Specializations <span className="text-orange-400">*</span></label>
                    <input
                      type="text"
                      id="specializations"
                      name="specializations"
                      value={formData.specializations}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${errors.specializations ? 'border-red-400 focus:ring-red-500' : ''}`}
                      placeholder="e.g., Strength Training, Weight Loss, Yoga, HIIT, Sports Performance, Rehabilitation"
                    />
                    {errors.specializations && <span className="text-sm text-red-400 mt-1 block">{errors.specializations}</span>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-200 mb-2">Professional Bio <span className="text-orange-400">*</span></label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${errors.bio ? 'border-red-400 focus:ring-red-500' : ''}`}
                      placeholder="Write a brief professional bio that will be shown to users. Describe your training philosophy, approach, and what makes you unique as a trainer. (Minimum 30 characters)"
                      rows="3"
                    />
                    {errors.bio && <span className="text-sm text-red-400 mt-1 block">{errors.bio}</span>}
                    <div className="text-xs text-gray-400">
                      {formData.bio.length}/30 minimum
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="motivation" className="block text-sm font-medium text-gray-200 mb-2">Why do you want to join Fit-Hub? <span className="text-orange-400">*</span></label>
                    <textarea
                      id="motivation"
                      name="motivation"
                      value={formData.motivation}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${errors.motivation ? 'border-red-400 focus:ring-red-500' : ''}`}
                      placeholder="Tell us why you want to become a trainer on our platform and how you plan to help our users achieve their fitness goals."
                      rows="3"
                    />
                    {errors.motivation && <span className="text-sm text-red-400 mt-1 block">{errors.motivation}</span>}
                  </div>
                </div>
              )}

              {/* Account Security */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-200 border-b border-white/10 pb-2">Account Security</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">Password <span className="text-orange-400">*</span></label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${errors.password ? 'border-red-400 focus:ring-red-500' : ''}`}
                      placeholder="Create a strong password"
                    />
                    {errors.password && <span className="text-sm text-red-400 mt-1 block">{errors.password}</span>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200 mb-2">Confirm Password <span className="text-orange-400">*</span></label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${errors.confirmPassword ? 'border-red-400 focus:ring-red-500' : ''}`}
                      placeholder="Confirm your password"
                    />
                    {errors.confirmPassword && <span className="text-sm text-red-400 mt-1 block">{errors.confirmPassword}</span>}
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="space-y-4">
                <div className="space-y-4">
                  <label className="flex items-start gap-3 text-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className="mt-1 w-4 h-4 text-orange-600 border-white/30 rounded focus:ring-orange-500 bg-white/10"
                    />
                    <span className="text-sm">
                      I agree to the <a href="/terms" target="_blank" className="text-orange-400 hover:text-orange-300 underline">Terms and Conditions</a> and <a href="/privacy" target="_blank" className="text-orange-400 hover:text-orange-300 underline">Privacy Policy</a> <span className="text-orange-400">*</span>
                    </span>
                  </label>
                  {errors.agreeToTerms && <span className="text-sm text-red-400 block">{errors.agreeToTerms}</span>}
                </div>

                <div className="space-y-2">
                  <label className="flex items-start gap-3 text-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      name="subscribeNewsletter"
                      checked={formData.subscribeNewsletter}
                      onChange={handleInputChange}
                      className="mt-1 w-4 h-4 text-orange-600 border-white/30 rounded focus:ring-orange-500 bg-white/10"
                    />
                    <span className="text-sm">
                      Subscribe to our newsletter for fitness tips and updates
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-black font-semibold shadow-lg shadow-orange-900/30 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
            )}

            {isOtpStep && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-200">Verify Your Email</h3>
                <p className="text-gray-300">We sent a 6-digit verification code to <strong className="text-orange-400">{formData.email}</strong>. Enter it below to activate your account.</p>
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-200 mb-2">Verification Code</label>
                  <input
                    id="otp"
                    name="otp"
                    inputMode="numeric"
                    maxLength={6}
                    className={`w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${errors.submit ? 'border-red-400 focus:ring-red-500' : ''}`}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                </div>
                <button type="submit" className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-black font-semibold shadow-lg shadow-orange-900/30 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all duration-200" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify Email'}
                </button>
                <div className="flex items-center justify-between text-sm text-gray-300">
                  <button type="button" className="text-orange-400 hover:text-orange-300" onClick={() => setIsOtpStep(false)}>Go back</button>
                  <button
                    type="button"
                    className="text-orange-400 hover:text-orange-300"
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

            {/* Footer link */}
            <div className="text-center mt-6">
              <p className="text-gray-300">
                Already have an account?{' '}
                <Link to="/login" state={{ from: location.state?.from || '/' }} className="text-orange-300 hover:text-orange-200 font-medium">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;