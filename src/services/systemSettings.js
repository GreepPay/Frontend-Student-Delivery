// System settings and utilities
export const systemSettings = {
  currency: 'TRY',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm',
  timezone: 'Europe/Istanbul',
  language: 'en',
  theme: 'light',
  notifications: {
    email: true,
    push: true,
    sms: false
  }
};

export const formatCurrency = (amount, currency = 'TRY') => {
  if (amount === null || amount === undefined) return '₺0.00';

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return '₺0.00';

  // Use Turkish Lira symbol instead of TRY code
  if (currency === 'TRY') {
    return `₺${numAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount);
};

// Enhanced formatCurrency that uses system settings
export const formatCurrencyWithSettings = async (amount) => {
  try {
    // Try to get currency from system settings
    const response = await fetch(`${process.env.REACT_APP_API_URL}/system-settings/public`);
    const data = await response.json();
    const currency = data.success ? data.data.display?.currency : 'TRY';

    return formatCurrency(amount, currency);
  } catch (error) {
    console.error('Error getting currency from settings:', error);
    return formatCurrency(amount, 'TRY'); // Fallback
  }
};

export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

export const formatDateTime = (date) => {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export const formatTime = (date) => {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
};

export const getStatusColor = (status) => {
  const statusColors = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'active': 'bg-green-100 text-green-800',
    'completed': 'bg-blue-100 text-blue-800',
    'cancelled': 'bg-red-100 text-red-800',
    'in_progress': 'bg-orange-100 text-orange-800',
    'online': 'bg-green-100 text-green-800',
    'offline': 'bg-gray-100 text-gray-800',
    'busy': 'bg-red-100 text-red-800',
    'suspended': 'bg-red-100 text-red-800',
    'inactive': 'bg-gray-100 text-gray-600'
  };

  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

export const getStatusText = (status) => {
  const statusTexts = {
    'pending': 'Pending',
    'active': 'Active',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'in_progress': 'In Progress',
    'online': 'Online',
    'offline': 'Offline',
    'busy': 'Busy',
    'suspended': 'Suspended',
    'inactive': 'Inactive'
  };

  return statusTexts[status] || 'Unknown';
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

const systemSettingsService = {
  systemSettings,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
  getStatusColor,
  getStatusText,
  validateEmail,
  validatePhone,
  debounce,
  throttle
};

export default systemSettingsService;
