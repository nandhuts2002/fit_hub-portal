// Comprehensive form validation utilities for community features

export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateMinLength = (value, minLength, fieldName) => {
  if (value && value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  return null;
};

export const validateMaxLength = (value, maxLength, fieldName) => {
  if (value && value.length > maxLength) {
    return `${fieldName} must be no more than ${maxLength} characters`;
  }
  return null;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const validateUrl = (url, fieldName = 'URL') => {
  try {
    new URL(url);
    return null;
  } catch {
    return `Please enter a valid ${fieldName}`;
  }
};

export const validateFutureDate = (dateString, fieldName = 'Date') => {
  const date = new Date(dateString);
  const now = new Date();
  
  if (date <= now) {
    return `${fieldName} must be in the future`;
  }
  return null;
};

export const validateNumber = (value, min = null, max = null, fieldName = 'Value') => {
  const num = Number(value);
  
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  
  if (min !== null && num < min) {
    return `${fieldName} must be at least ${min}`;
  }
  
  if (max !== null && num > max) {
    return `${fieldName} must be no more than ${max}`;
  }
  
  return null;
};

export const validatePositiveInteger = (value, fieldName = 'Value') => {
  const num = Number(value);
  
  if (!Number.isInteger(num) || num <= 0) {
    return `${fieldName} must be a positive integer`;
  }
  
  return null;
};

// Challenge form validation
export const validateChallenge = (formData) => {
  const errors = {};
  
  // Name validation
  const nameError = validateRequired(formData.name, 'Challenge name') ||
                   validateMinLength(formData.name, 3, 'Challenge name') ||
                   validateMaxLength(formData.name, 100, 'Challenge name');
  if (nameError) errors.name = nameError;
  
  // Description validation
  const descError = validateRequired(formData.description, 'Description') ||
                   validateMinLength(formData.description, 10, 'Description') ||
                   validateMaxLength(formData.description, 500, 'Description');
  if (descError) errors.description = descError;
  
  // Goal value validation
  const goalError = validateRequired(formData.goalValue, 'Goal value') ||
                   validatePositiveInteger(formData.goalValue, 'Goal value');
  if (goalError) errors.goalValue = goalError;
  
  // Duration validation
  const durationError = validateRequired(formData.duration, 'Duration') ||
                       validateNumber(formData.duration, 1, 365, 'Duration');
  if (durationError) errors.duration = durationError;
  
  return errors;
};

// Q&A Session form validation
export const validateQASession = (formData) => {
  const errors = {};
  
  // Title validation
  const titleError = validateRequired(formData.title, 'Title') ||
                    validateMinLength(formData.title, 5, 'Title') ||
                    validateMaxLength(formData.title, 200, 'Title');
  if (titleError) errors.title = titleError;
  
  // Description validation
  const descError = validateRequired(formData.description, 'Description') ||
                   validateMinLength(formData.description, 10, 'Description') ||
                   validateMaxLength(formData.description, 1000, 'Description');
  if (descError) errors.description = descError;
  
  // Scheduled date validation
  const dateError = validateRequired(formData.scheduledAt, 'Scheduled date and time') ||
                   validateFutureDate(formData.scheduledAt, 'Scheduled time');
  if (dateError) errors.scheduledAt = dateError;
  
  return errors;
};

// Spotlight form validation
export const validateSpotlight = (formData) => {
  const errors = {};
  
  // Title validation
  const titleError = validateRequired(formData.title, 'Title') ||
                    validateMinLength(formData.title, 5, 'Title') ||
                    validateMaxLength(formData.title, 150, 'Title');
  if (titleError) errors.title = titleError;
  
  // Caption validation
  const captionError = validateRequired(formData.caption, 'Story') ||
                      validateMinLength(formData.caption, 20, 'Story') ||
                      validateMaxLength(formData.caption, 2000, 'Story');
  if (captionError) errors.caption = captionError;
  
  // Before image validation
  const beforeError = validateRequired(formData.beforeImage, 'Before image') ||
                     validateUrl(formData.beforeImage, 'Before image URL');
  if (beforeError) errors.beforeImage = beforeError;
  
  // After image validation
  const afterError = validateRequired(formData.afterImage, 'After image') ||
                    validateUrl(formData.afterImage, 'After image URL');
  if (afterError) errors.afterImage = afterError;
  
  return errors;
};

// Badge form validation (for admin)
export const validateBadge = (formData) => {
  const errors = {};
  
  // Name validation
  const nameError = validateRequired(formData.name, 'Badge name') ||
                   validateMinLength(formData.name, 3, 'Badge name') ||
                   validateMaxLength(formData.name, 50, 'Badge name');
  if (nameError) errors.name = nameError;
  
  // Description validation
  const descError = validateRequired(formData.description, 'Description') ||
                   validateMinLength(formData.description, 10, 'Description') ||
                   validateMaxLength(formData.description, 200, 'Description');
  if (descError) errors.description = descError;
  
  // Icon validation
  const iconError = validateRequired(formData.icon, 'Icon');
  if (iconError) errors.icon = iconError;
  
  // Criteria validation
  if (!formData.criteria || !formData.criteria.type) {
    errors.criteria = 'Criteria type is required';
  } else if (!formData.criteria.value || formData.criteria.value <= 0) {
    errors.criteriaValue = 'Criteria value must be a positive number';
  }
  
  return errors;
};

// Question validation
export const validateQuestion = (questionText) => {
  const errors = {};
  
  const questionError = validateRequired(questionText, 'Question') ||
                       validateMinLength(questionText, 10, 'Question') ||
                       validateMaxLength(questionText, 500, 'Question');
  if (questionError) errors.question = questionError;
  
  return errors;
};

// Answer validation
export const validateAnswer = (answerText) => {
  const errors = {};
  
  const answerError = validateRequired(answerText, 'Answer') ||
                     validateMinLength(answerText, 5, 'Answer') ||
                     validateMaxLength(answerText, 2000, 'Answer');
  if (answerError) errors.answer = answerError;
  
  return errors;
};

// Post validation (for enhanced posts with polls)
export const validatePost = (formData) => {
  const errors = {};
  
  // Either text or image is required
  if (!formData.text?.trim() && !formData.imageUrl?.trim()) {
    errors.content = 'Post must have either text or an image';
  }
  
  // Text validation (if provided)
  if (formData.text && formData.text.length > 2000) {
    errors.text = 'Post text must be no more than 2000 characters';
  }
  
  // Poll validation (if provided)
  if (formData.poll) {
    const pollQuestionError = validateRequired(formData.poll.question, 'Poll question') ||
                             validateMinLength(formData.poll.question, 5, 'Poll question') ||
                             validateMaxLength(formData.poll.question, 200, 'Poll question');
    if (pollQuestionError) errors.pollQuestion = pollQuestionError;
    
    if (!formData.poll.options || formData.poll.options.length < 2) {
      errors.pollOptions = 'Poll must have at least 2 options';
    } else if (formData.poll.options.length > 6) {
      errors.pollOptions = 'Poll can have at most 6 options';
    } else {
      // Validate each option
      for (let i = 0; i < formData.poll.options.length; i++) {
        const option = formData.poll.options[i];
        if (!option?.trim()) {
          errors.pollOptions = `Option ${i + 1} cannot be empty`;
          break;
        }
        if (option.length > 100) {
          errors.pollOptions = `Option ${i + 1} must be no more than 100 characters`;
          break;
        }
      }
    }
  }
  
  return errors;
};

// Generic form validation helper
export const validateForm = (formData, validationRules) => {
  const errors = {};
  
  Object.keys(validationRules).forEach(field => {
    const rules = validationRules[field];
    const value = formData[field];
    
    for (const rule of rules) {
      const error = rule(value, field);
      if (error) {
        errors[field] = error;
        break; // Stop at first error for this field
      }
    }
  });
  
  return errors;
};

// Real-time validation helper for form inputs
export const createFieldValidator = (validationFn) => {
  return (value, setErrors, fieldName) => {
    const error = validationFn(value, fieldName);
    setErrors(prev => {
      if (error) {
        return { ...prev, [fieldName]: error };
      } else {
        const { [fieldName]: removed, ...rest } = prev;
        return rest;
      }
    });
  };
};

export default {
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateEmail,
  validateUrl,
  validateFutureDate,
  validateNumber,
  validatePositiveInteger,
  validateChallenge,
  validateQASession,
  validateSpotlight,
  validateBadge,
  validateQuestion,
  validateAnswer,
  validatePost,
  validateForm,
  createFieldValidator
};
