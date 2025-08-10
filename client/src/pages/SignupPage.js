import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/SignupPage.css';

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
  const navigate = useNavigate();

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

      const response = await axios.post('http://localhost:5000/signup', signupData);
      
      // Handle different success messages
      if (formData.role === 'trainer') {
        alert('Trainer application submitted! Please wait for admin approval.');
      } else {
        alert('Account created successfully! Please log in.');
      }
      navigate('/');
    } catch (err) {
      console.error('Signup error:', err);
      setErrors({
        submit: err.response?.data?.msg || err.response?.data?.message || 'Signup failed. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-header">
        <h2>Join Fit-Hub Portal</h2>
        <p>Create your account to get started</p>
      </div>

      {errors.submit && <div className="error-message">{errors.submit}</div>}

      <form onSubmit={handleSignup} className="signup-form">
        {/* Personal Information */}
        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={errors.firstName ? 'error' : ''}
                placeholder="Enter your first name"
              />
              {errors.firstName && <span className="error-text">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={errors.lastName ? 'error' : ''}
                placeholder="Enter your last name"
              />
              {errors.lastName && <span className="error-text">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={errors.email ? 'error' : ''}
                placeholder="Enter your email address"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <div className="phone-input-container">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`phone-input ${errors.phone ? 'error' : ''} ${validationStatus.phone || ''}`}
                  placeholder="Enter your 10-digit Indian number"
                  maxLength="10"
                />
                <div className="phone-validation-indicator">
                  {validationStatus.phone === 'valid' && <span className="valid-icon">✓</span>}
                  {validationStatus.phone === 'invalid' && <span className="invalid-icon">✗</span>}
                  {validationStatus.phone === 'partial' && <span className="partial-icon">⏳</span>}
                </div>
              </div>
              {errors.phone && <span className="error-text">{errors.phone}</span>}
              {!errors.phone && formData.phone.length > 0 && validationStatus.phone === 'valid' && (
                <span className="success-text">✓ Valid Indian phone number</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth *</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                onBlur={handleBlur}
                max={new Date().toISOString().split('T')[0]}
                className={errors.dateOfBirth ? 'error' : ''}
              />
              {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender *</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={errors.gender ? 'error' : ''}
              >
                <option value="">Select your gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
              {errors.gender && <span className="error-text">{errors.gender}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="role">Account Type *</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={errors.role ? 'error' : ''}
              >
                <option value="user">User - Access fitness content and ask questions</option>
                <option value="trainer">Trainer - Create tutorials and answer user queries</option>
              </select>
              {errors.role && <span className="error-text">{errors.role}</span>}
              {formData.role === 'trainer' && (
                <div className="info-text">
                  <span className="info-icon">ℹ️</span>
                  As a trainer, you'll be able to create tutorials, upload content, and help users with their fitness questions.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trainer-Specific Information */}
        {formData.role === 'trainer' && (
          <div className="form-section trainer-section">
            <h3>Professional Information</h3>
            <div className="trainer-info-banner">
              <div className="banner-icon">🏋️</div>
              <div className="banner-content">
                <strong>Trainer Application</strong>
                <p>Please provide your professional details to help us review your application.</p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="experience">Professional Experience *</label>
              <textarea
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={errors.experience ? 'error' : ''}
                placeholder="Describe your fitness/training experience, background, and qualifications. Include years of experience, types of training you've done, and any relevant work history. (Minimum 50 characters)"
                rows="4"
              />
              {errors.experience && <span className="error-text">{errors.experience}</span>}
              <div className="char-counter">
                {formData.experience.length}/50 minimum
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="certifications">Certifications & Qualifications *</label>
              <textarea
                id="certifications"
                name="certifications"
                value={formData.certifications}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={errors.certifications ? 'error' : ''}
                placeholder="List your fitness certifications, degrees, and qualifications. Include certification bodies, dates, and any specializations. (e.g., NASM-CPT, ACE, ACSM, etc.)"
                rows="3"
              />
              {errors.certifications && <span className="error-text">{errors.certifications}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="specializations">Training Specializations *</label>
              <input
                type="text"
                id="specializations"
                name="specializations"
                value={formData.specializations}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={errors.specializations ? 'error' : ''}
                placeholder="e.g., Strength Training, Weight Loss, Yoga, HIIT, Sports Performance, Rehabilitation"
              />
              {errors.specializations && <span className="error-text">{errors.specializations}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="bio">Professional Bio *</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={errors.bio ? 'error' : ''}
                placeholder="Write a brief professional bio that will be shown to users. Describe your training philosophy, approach, and what makes you unique as a trainer. (Minimum 30 characters)"
                rows="3"
              />
              {errors.bio && <span className="error-text">{errors.bio}</span>}
              <div className="char-counter">
                {formData.bio.length}/30 minimum
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="motivation">Why do you want to join Fit-Hub? *</label>
              <textarea
                id="motivation"
                name="motivation"
                value={formData.motivation}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={errors.motivation ? 'error' : ''}
                placeholder="Tell us why you want to become a trainer on our platform and how you plan to help our users achieve their fitness goals."
                rows="3"
              />
              {errors.motivation && <span className="error-text">{errors.motivation}</span>}
            </div>
          </div>
        )}

        {/* Account Security */}
        <div className="form-section">
          <h3>Account Security</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={errors.password ? 'error' : ''}
                placeholder="Create a strong password"
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={errors.confirmPassword ? 'error' : ''}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="form-section">
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                onBlur={handleBlur}
              />
              <span className="checkmark"></span>
              I agree to the <a href="/terms" target="_blank">Terms and Conditions</a> and <a href="/privacy" target="_blank">Privacy Policy</a> *
            </label>
            {errors.agreeToTerms && <span className="error-text">{errors.agreeToTerms}</span>}
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="subscribeNewsletter"
                checked={formData.subscribeNewsletter}
                onChange={handleInputChange}
              />
              <span className="checkmark"></span>
              Subscribe to our newsletter for fitness tips and updates
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="signup-button"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="login-link">
        <p>Already have an account? <Link to="/">Sign In</Link></p>
      </div>
    </div>
  );
};

export default SignupPage;
