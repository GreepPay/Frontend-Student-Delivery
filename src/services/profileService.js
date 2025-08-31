// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL;

// Profile service for user profile management
export const getProfile = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/auth/profile/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch profile');

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

export const updateProfile = async (userId, profileData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/auth/profile/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) throw new Error('Failed to update profile');

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

export const uploadProfileImage = async (userId, imageFile) => {
  try {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('profilePicture', imageFile);

    const response = await fetch(`${API_BASE_URL}/auth/profile/${userId}/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) throw new Error('Failed to upload image');

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};

export const getDriverEarnings = async (driverId, period = 'month') => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/drivers/${driverId}/earnings?period=${period}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch earnings');

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching earnings:', error);
    throw error;
  }
};

export const getDriverDeliveries = async (driverId, filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams();

    if (filters.status) queryParams.append('status', filters.status);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);

    const response = await fetch(`${API_BASE_URL}/drivers/${driverId}/deliveries?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch deliveries');

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    throw error;
  }
};

export const updateDriverLocation = async (driverId, location) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/drivers/${driverId}/location`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(location)
    });

    if (!response.ok) throw new Error('Failed to update location');

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};

export const updateDriverStatus = async (driverId, status) => {
  try {
    const token = localStorage.getItem('token');

    // Convert status string to boolean fields
    const statusData = {
      isOnline: status === 'active',
      isActive: status === 'active'
    };

    const response = await fetch(`${API_BASE_URL}/drivers/${driverId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(statusData)
    });

    if (!response.ok) throw new Error('Failed to update status');

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating status:', error);
    throw error;
  }
};

const profileService = {
  getProfile,
  updateProfile,
  uploadProfileImage,
  getDriverEarnings,
  getDriverDeliveries,
  updateDriverLocation,
  updateDriverStatus
};

export default profileService;
