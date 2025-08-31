// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL;

// Dashboard data service
export const getDashboardData = async (period = 'today') => {
  try {
    const token = localStorage.getItem('token');

    console.log('📊 DashboardService: Fetching dashboard data for period:', period);

    // Map frontend period values to backend expected values
    const periodMapping = {
      'today': 'today',
      'thisWeek': 'thisWeek',
      'currentPeriod': 'month',  // Map currentPeriod to month
      'thisMonth': 'thisMonth',
      'allTime': 'allTime'
    };

    const mappedPeriod = periodMapping[period] || 'today';
    console.log('📊 DashboardService: Mapped period:', period, 'to:', mappedPeriod);

    // Send only the period parameter to avoid parameter conflicts
    let url = `${API_BASE_URL}/admin/dashboard?period=${mappedPeriod}`;
    console.log('📊 DashboardService: Calling URL:', url);

    // Call the correct endpoint with period parameter
    let response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Note: We'll check the period after getting the response

    if (!response.ok) {
      console.error('❌ DashboardService: API error response:', response.status, response.statusText);
      throw new Error(`Dashboard API error: ${response.status}`);
    }

    const data = await response.json();

    // Log the response to see what period the backend actually used
    console.log('📊 DashboardService: Backend returned period:', data.data?.analytics?.period);
    console.log('📊 DashboardService: Requested period:', mappedPeriod);
    console.log('📊 DashboardService: Period match:', data.data?.analytics?.period === mappedPeriod ? '✅' : '❌');

    console.log('✅ DashboardService: Dashboard data received:', data);

    // Return the full response so the component can extract what it needs
    return data;
  } catch (error) {
    console.error('❌ DashboardService: Error fetching dashboard data:', error);
    throw error; // Remove fallback, let the component handle the error
  }
};

// Enhanced recent deliveries service with meaningful data
export const getRecentDeliveries = async (limit = 6, period = 'today') => {
  try {
    const token = localStorage.getItem('token');

    console.log('📦 DashboardService: Fetching recent deliveries with limit:', limit, 'period:', period);

    // Map frontend period values to backend expected values
    const periodMapping = {
      'today': 'today',
      'thisWeek': 'thisWeek',
      'currentPeriod': 'month',  // Map currentPeriod to month
      'thisMonth': 'thisMonth',
      'allTime': 'allTime'
    };

    const mappedPeriod = periodMapping[period] || 'today';

    // Get recent deliveries from the main dashboard endpoint with period
    const response = await fetch(`${API_BASE_URL}/admin/dashboard?period=${mappedPeriod}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ DashboardService: Recent deliveries API error:', response.status, response.statusText);
      throw new Error(`Recent deliveries API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ DashboardService: Recent deliveries data received:', data);

    // Extract recent deliveries from the dashboard response
    const deliveries = data.data?.recentDeliveries || data.recentDeliveries || [];

    // Enhance delivery data with meaningful information
    const enhancedDeliveries = deliveries.map(delivery => {
      // Calculate delivery priority based on various factors
      let priority = delivery.priority || 'normal';
      if (delivery.fee > 100) priority = 'high';
      if (delivery.status === 'pending' && delivery.createdAt) {
        const timeSinceCreation = Date.now() - new Date(delivery.createdAt).getTime();
        if (timeSinceCreation > 30 * 60 * 1000) priority = 'high'; // 30 minutes
      }

      // Format delivery code
      const deliveryCode = delivery.deliveryCode || delivery.code || delivery.id || `#${delivery._id?.slice(-6)}`;

      // Calculate estimated time if not provided
      let estimatedTime = delivery.estimatedTime;
      if (!estimatedTime && delivery.createdAt) {
        const created = new Date(delivery.createdAt);
        const now = new Date();
        const diffMinutes = Math.floor((now - created) / (1000 * 60));
        estimatedTime = `${diffMinutes}m ago`;
      }

      return {
        ...delivery,
        priority,
        deliveryCode,
        estimatedTime,
        // Ensure all required fields exist
        customerName: delivery.customerName || delivery.customer?.name || 'Customer',
        pickupAddress: delivery.pickupAddress || delivery.pickupLocation || delivery.pickup || 'Pickup Location',
        deliveryAddress: delivery.deliveryAddress || delivery.deliveryLocation || delivery.delivery || 'Delivery Location',
        amount: delivery.amount || delivery.fee || 0,
        status: delivery.status || 'pending',
        driver: delivery.driver || delivery.driverName || null,
        paymentMethod: delivery.paymentMethod || 'card',
        createdAt: delivery.createdAt || new Date().toISOString()
      };
    });

    return enhancedDeliveries;
  } catch (error) {
    console.error('❌ DashboardService: Error fetching recent deliveries:', error);
    throw error; // Remove fallback, let the component handle the error
  }
};

// Enhanced function to get driver earnings data with better debugging
const getDriverEarningsData = async (driverId, period = 'month') => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ No token available for driver earnings fetch');
      return null;
    }

    console.log('💰 Fetching earnings for driver:', driverId, 'period:', period);

    // Map period to backend format
    const periodMapping = {
      'today': 'today',
      'thisWeek': 'week',
      'currentPeriod': 'month',
      'allTime': 'all-time'
    };

    const mappedPeriod = periodMapping[period] || 'month';

    // Try the driver-specific earnings endpoint
    const response = await fetch(`${API_BASE_URL}/admin/drivers/${driverId}/earnings?period=${mappedPeriod}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('💰 Driver earnings response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('💰 Driver earnings data received:', data);

      // Enhanced debugging for earnings data structure
      console.log('💰 Earnings data structure analysis:', {
        hasData: !!data.data,
        hasDirectEarnings: !!data.earnings,
        hasTotalEarnings: !!data.totalEarnings,
        hasSummary: !!data.summary,
        allKeys: Object.keys(data),
        dataKeys: data.data ? Object.keys(data.data) : [],
        summaryKeys: data.summary ? Object.keys(data.summary) : [],
        rawData: data
      });

      return data.data || data;
    } else {
      console.warn('⚠️ Driver earnings endpoint failed:', response.status);

      // Try to get error details
      try {
        const errorData = await response.text();
        console.warn('⚠️ Driver earnings error response:', errorData);
      } catch (e) {
        console.warn('⚠️ Could not read error response');
      }

      return null;
    }
  } catch (error) {
    console.warn('⚠️ Error fetching driver earnings:', error);
    return null;
  }
};

export const getTopDrivers = async (period = 'today', limit = 5) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ DashboardService: No authentication token found');
      throw new Error('Authentication required');
    }

    // Map period to backend format
    const periodMapping = {
      'today': 'today',
      'thisWeek': 'week',
      'currentPeriod': 'month',
      'allTime': 'all-time'
    };

    const mappedPeriod = periodMapping[period] || 'today';

    console.log('🏆 DashboardService: Fetching top drivers for period:', mappedPeriod);
    console.log('🏆 DashboardService: Original period:', period, 'Mapped to:', mappedPeriod);

    // Get top drivers from the main dashboard endpoint with period
    const response = await fetch(`${API_BASE_URL}/admin/dashboard?period=${mappedPeriod}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ DashboardService: Top drivers API error:', response.status, response.statusText);

      // Handle specific HTTP errors
      if (response.status === 401) {
        throw new Error('Authentication failed - please log in again');
      } else if (response.status === 403) {
        throw new Error('Access denied - insufficient permissions');
      } else if (response.status >= 500) {
        throw new Error('Server error - please try again later');
      } else {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    console.log('✅ DashboardService: Dashboard data received:', data);
    console.log('🔍 DashboardService: Full API response structure:', JSON.stringify(data, null, 2));

    // Try to extract top drivers from the dashboard response
    let drivers = data.data?.topDrivers || data.topDrivers || [];

    console.log('🔍 DashboardService: Initial drivers extraction:', {
      hasData: !!data.data,
      hasTopDrivers: !!data.data?.topDrivers,
      hasDirectTopDrivers: !!data.topDrivers,
      driversCount: drivers.length,
      driversSample: drivers.slice(0, 2).map(d => ({
        name: d.name,
        totalEarnings: d.totalEarnings,
        earnings: d.earnings,
        totalDeliveries: d.totalDeliveries,
        deliveries: d.deliveries
      }))
    });

    // If no topDrivers in dashboard response, try to get drivers from a separate endpoint
    if (!drivers || drivers.length === 0) {
      console.log('⚠️ No topDrivers in dashboard response, trying drivers endpoint...');

      try {
        const driversResponse = await fetch(`${API_BASE_URL}/admin/drivers`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (driversResponse.ok) {
          const driversData = await driversResponse.json();
          drivers = driversData.data || driversData.drivers || [];
          console.log('✅ DashboardService: Drivers data from drivers endpoint:', drivers);
          console.log('🔍 DashboardService: Drivers endpoint sample:', drivers.slice(0, 2).map(d => ({
            name: d.name,
            totalEarnings: d.totalEarnings,
            earnings: d.earnings,
            totalDeliveries: d.totalDeliveries,
            deliveries: d.deliveries
          })));
        } else {
          console.warn('⚠️ Drivers endpoint returned error:', driversResponse.status);
        }
      } catch (driversError) {
        console.warn('⚠️ Could not fetch drivers from drivers endpoint:', driversError);
      }
    }

    // If still no drivers, create mock data for demonstration
    if (!drivers || drivers.length === 0) {
      console.log('⚠️ No drivers data available, creating mock data for demonstration');

      drivers = [
        {
          _id: 'mock1',
          name: 'John Doe',
          email: 'john@example.com',
          totalDeliveries: 45,
          totalEarnings: 1250,
          rating: 4.8,
          completionRate: 95,
          activeHours: 40,
          isOnline: true,
          avgEarningsPerDelivery: 27.8,
          avgDeliveryTime: 25
        },
        {
          _id: 'mock2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          totalDeliveries: 38,
          totalEarnings: 980,
          rating: 4.9,
          completionRate: 98,
          activeHours: 35,
          isOnline: true,
          avgEarningsPerDelivery: 25.8,
          avgDeliveryTime: 22
        },
        {
          _id: 'mock3',
          name: 'Mike Johnson',
          email: 'mike@example.com',
          totalDeliveries: 52,
          totalEarnings: 1450,
          rating: 4.7,
          completionRate: 92,
          activeHours: 45,
          isOnline: false,
          avgEarningsPerDelivery: 27.9,
          avgDeliveryTime: 28
        }
      ];
    }

    // Debug: Log the raw driver data to see what fields are available
    console.log('🔍 Raw driver data from dashboard:', drivers);
    console.log('🔍 Driver earnings analysis:', drivers.map(driver => ({
      name: driver.name,
      totalEarnings: driver.totalEarnings,
      earnings: driver.earnings,
      hasTotalEarnings: 'totalEarnings' in driver,
      hasEarnings: 'earnings' in driver,
      allKeys: Object.keys(driver).filter(key => key.toLowerCase().includes('earn'))
    })));

    // Normalize driver data to ensure consistent field names
    const normalizedDrivers = drivers.map((driver) => {
      // Try multiple possible earnings field names
      const possibleEarningsFields = [
        'totalEarnings',
        'earnings',
        'total_earnings',
        'total_earning',
        'earning',
        'revenue',
        'totalRevenue',
        'income',
        'totalIncome',
        'amount',
        'totalAmount'
      ];

      let foundEarnings = 0;
      for (const field of possibleEarningsFields) {
        if (driver[field] !== undefined && driver[field] !== null && driver[field] > 0) {
          foundEarnings = driver[field];
          console.log('💰 Found earnings in field:', field, 'for driver:', driver.name, 'value:', foundEarnings);
          break;
        }
      }

      const normalized = {
        ...driver,
        // Normalize field names
        totalDeliveries: driver.totalDeliveries || driver.deliveries || driver.total_deliveries || 0,
        totalEarnings: foundEarnings || driver.totalEarnings || driver.earnings || 0,
        rating: driver.rating || driver.avgRating || 0,
        completionRate: driver.completionRate || driver.completion_rate || driver.successRate || 0,
        activeHours: driver.activeHours || driver.active_hours || driver.hoursWorked || 0,
        isOnline: driver.isOnline || driver.isActive || driver.online || false,
        name: driver.name || driver.fullNameComputed || driver.fullName || driver.displayName || 'Unknown Driver',
        avgEarningsPerDelivery: driver.avgEarningsPerDelivery || driver.avg_earnings_per_delivery || driver.averageEarnings || 0,
        avgDeliveryTime: driver.avgDeliveryTime || driver.avg_delivery_time || driver.averageDeliveryTime || 0,
        // Use existing profile data if available
        profilePicture: driver.profilePicture || driver.profileImage || driver.avatar || driver.image || driver.photo,
        // Generate avatar URL if no profile picture exists
        avatarUrl: driver.profilePicture || driver.profileImage || driver.avatar || driver.image || driver.photo ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name || driver.fullName || 'Driver')}&background=6366f1&color=ffffff&size=128&font-size=0.4&bold=true`
      };

      console.log('🔍 Normalized driver:', {
        name: normalized.name,
        originalTotalEarnings: driver.totalEarnings,
        originalEarnings: driver.earnings,
        foundEarnings: foundEarnings,
        normalizedTotalEarnings: normalized.totalEarnings,
        allEarningsFields: possibleEarningsFields.map(field => ({ field, value: driver[field] }))
      });

      return normalized;
    });

    // Enhanced driver data with individual earnings fetch and validation
    const enhancedDrivers = await Promise.all(normalizedDrivers.map(async (driver, index) => {
      // Try to fetch individual driver earnings if we have a driver ID and earnings are 0
      let enhancedEarnings = driver.totalEarnings;
      if (driver._id && (driver.totalEarnings === 0 || !driver.totalEarnings)) {
        console.log('💰 Attempting to fetch individual earnings for driver:', driver.name, driver._id);
        const earningsData = await getDriverEarningsData(driver._id, period);

        if (earningsData) {
          // Extract earnings from the earnings data
          const earnings = earningsData.totalEarnings || earningsData.earnings || earningsData.summary?.totalEarnings || 0;
          enhancedEarnings = earnings;
          console.log('💰 Enhanced earnings for driver:', driver.name, 'from', driver.totalEarnings, 'to', enhancedEarnings);
        }

        // If earnings are still 0, try to validate and fix using the earnings validation service
        if (enhancedEarnings === 0 && driver._id) {
          console.log('🔍 Earnings still 0, attempting validation for driver:', driver.name, driver._id);
          try {
            // Import the service dynamically to avoid circular dependencies
            const EarningsValidationService = (await import('./earningsValidationService.js')).default;

            // Validate the driver's earnings
            const validation = await EarningsValidationService.validateDriverEarnings(driver._id);
            console.log('🔍 Validation result for driver:', driver.name, validation);

            if (!validation.isValid && validation.actualTotals.totalEarnings > 0) {
              console.log('🔧 Earnings mismatch detected, attempting to fix for driver:', driver.name);
              const fixResult = await EarningsValidationService.fixDriverEarnings(driver._id);
              console.log('🔧 Fix result for driver:', driver.name, fixResult);

              if (fixResult.success) {
                enhancedEarnings = fixResult.newTotals.totalEarnings || validation.actualTotals.totalEarnings;
                console.log('💰 Fixed earnings for driver:', driver.name, 'to:', enhancedEarnings);
              }
            } else if (validation.isValid && validation.driverTotals.totalEarnings > 0) {
              enhancedEarnings = validation.driverTotals.totalEarnings;
              console.log('💰 Using validated earnings for driver:', driver.name, 'value:', enhancedEarnings);
            }
          } catch (validationError) {
            console.warn('⚠️ Earnings validation failed for driver:', driver.name, validationError);
          }
        }
      }

      // Calculate achievements based on performance
      const achievements = [];
      if ((driver.totalDeliveries) >= 100) achievements.push('🚀 Speed Demon');
      if ((driver.rating || 0) >= 4.8) achievements.push('⭐ Elite');
      if ((driver.completionRate || 0) >= 95) achievements.push('✅ Perfect');
      if (enhancedEarnings >= 5000) achievements.push('💰 High Earner');
      if ((driver.activeHours || 0) >= 40) achievements.push('⏰ Dedicated');

      // Calculate performance score for ranking
      const deliveries = driver.totalDeliveries || 0;
      const earnings = enhancedEarnings || 0;
      const rating = driver.rating || 0;
      const completionRate = driver.completionRate || 0;
      const activeHours = driver.activeHours || 0;

      const performanceScore = (
        (deliveries * 10) +
        (rating * 100) +
        (completionRate * 2) +
        (earnings / 100) +
        (activeHours * 5)
      );

      const enhanced = {
        ...driver,
        achievements,
        performanceScore,
        rank: index + 1,
        // Ensure all required fields exist with proper defaults
        totalDeliveries: deliveries,
        totalEarnings: earnings,
        rating: rating,
        completionRate: completionRate,
        activeHours: activeHours,
        isOnline: driver.isOnline || false
      };

      console.log('🔍 Enhanced driver:', {
        name: enhanced.name,
        totalEarnings: enhanced.totalEarnings,
        performanceScore: enhanced.performanceScore,
        achievements: enhanced.achievements
      });

      return enhanced;
    }));

    // Sort by performance score
    enhancedDrivers.sort((a, b) => b.performanceScore - a.performanceScore);

    // Limit to requested number
    const limitedDrivers = enhancedDrivers.slice(0, limit);

    console.log('✅ DashboardService: Enhanced drivers data:', limitedDrivers);
    console.log('💰 Final earnings summary:', limitedDrivers.map(d => ({
      name: d.name,
      totalEarnings: d.totalEarnings,
      rank: d.rank
    })));

    return limitedDrivers;
  } catch (error) {
    console.error('❌ DashboardService: Error fetching top drivers:', error);

    // Return empty array instead of throwing to prevent UI crashes
    console.log('⚠️ DashboardService: Returning empty drivers array due to error');
    return [];
  }
};

// Real-time driver status service
export const getRealTimeDriverStatus = async () => {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/admin/dashboard/driver-status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Driver status API error: ${response.status}`);
    }

    const data = await response.json();

    const responseData = data.data || data;
    const drivers = responseData.drivers || responseData;



    // Ensure drivers is an array
    const driversArray = Array.isArray(drivers) ? drivers : [];

    // Count statuses
    const counts = driversArray.reduce((acc, driver) => {
      // Handle both 'isActive' and 'isOnline' field names from backend
      const isOnline = driver.isOnline !== undefined ? driver.isOnline :
        driver.isActive !== undefined ? driver.isActive : false;

      const status = isOnline ? 'online' : 'offline';
      acc[status] = (acc[status] || 0) + 1;



      return acc;
    }, { online: 0, busy: 0, offline: 0 });

    const result = {
      online: counts.online,
      busy: counts.busy,
      offline: counts.offline,
      total: driversArray.length,
      drivers: driversArray
    };

    return result;
  } catch (error) {
    console.error('❌ DashboardService: Error fetching driver status:', error);
    console.error('❌ DashboardService: Error details:', {
      message: error.message,
      stack: error.stack
    });

    // Return empty status on error
    return {
      online: 0,
      busy: 0,
      offline: 0,
      total: 0,
      drivers: []
    };
  }
};

// Get all drivers
export const getDrivers = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams();

    if (filters.status && filters.status !== 'all') {
      queryParams.append('status', filters.status);
    }
    if (filters.search) {
      queryParams.append('search', filters.search);
    }
    if (filters.page) {
      queryParams.append('page', filters.page);
    }
    if (filters.limit) {
      queryParams.append('limit', filters.limit);
    }

    const response = await fetch(`${API_BASE_URL}/admin/drivers?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch drivers');

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching drivers:', error);
    throw error;
  }
};

// Delete driver
export const deleteDriver = async (driverId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/admin/drivers/${driverId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to delete driver');

    return { success: true };
  } catch (error) {
    console.error('Error deleting driver:', error);
    throw error;
  }
};

const dashboardService = {
  getDashboardData,
  getRecentDeliveries,
  getTopDrivers,
  getRealTimeDriverStatus,
  getDrivers,
  deleteDriver
};

export default dashboardService;
