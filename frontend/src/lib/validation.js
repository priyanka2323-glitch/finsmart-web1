export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 8;
};

export const validatePasswordMatch = (password, password2) => {
  return password === password2;
};

export const validateName = (name) => {
  return name && name.trim().length >= 2;
};

export const validateLoginForm = (email, password) => {
  const errors = {};

  if (!email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!password.trim()) {
    errors.password = 'Password is required';
  }

  return { valid: Object.keys(errors).length === 0, errors };
};

export const validateSignupForm = (name, email, password, password2) => {
  const errors = {};

  if (!name.trim()) {
    errors.name = 'Full name is required';
  } else if (!validateName(name)) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!password.trim()) {
    errors.password = 'Password is required';
  } else if (!validatePassword(password)) {
    errors.password = 'Password must be at least 8 characters';
  }

  if (!password2.trim()) {
    errors.password2 = 'Please confirm your password';
  } else if (!validatePasswordMatch(password, password2)) {
    errors.password2 = 'Passwords do not match';
  }

  return { valid: Object.keys(errors).length === 0, errors };
};
