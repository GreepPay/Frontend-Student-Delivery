import React, { useState, useEffect, useCallback } from 'react';
import { capitalizeName } from '../../utils/nameUtils';
import { getRealTimeDriverStatus } from '../../services/dashboardService';
import { getStatusColor, getStatusText } from '../../services/systemSettings';
import socketService from '../../services/socketService';
import { ArrowPathIcon, WifiIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';

const RealTimeDriverStatus = () => {
  const [driverStatus, setDriverStatus] = useState({
    online: 0,
    busy: 0,
    offline: 0,
    total: 0,
    drivers: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchDriverStatus = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);

    try {
      const data = await getRealTimeDriverStatus();
      setDriverStatus(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching driver status:', error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDriverStatus();

    // Set up auto-refresh every 60 seconds (reduced from 30)
    const interval = setInterval(() => {
      fetchDriverStatus(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchDriverStatus]);

  // Socket.IO event listeners for real-time updates
  useEffect(() => {
    // Check if socket is available
    const socket = socketService.getSocket();
    if (!socket || !socketService.isConnected()) {
      console.log('⚠️ RealTimeDriverStatus: Socket not available for real-time updates');
      return;
    }

    console.log('🔌 RealTimeDriverStatus: Setting up socket event listeners');

    const handleDriverOnline = (driver) => {
      console.log('🟢 RealTimeDriverStatus: Driver online event received:', driver);
      setDriverStatus(prev => {
        const updatedDrivers = prev.drivers.map(d =>
          d.id === driver.id ? { ...d, status: 'online', lastActive: new Date().toISOString() } : d
        );

        const counts = updatedDrivers.reduce((acc, d) => {
          acc[d.status] = (acc[d.status] || 0) + 1;
          return acc;
        }, { online: 0, busy: 0, offline: 0 });

        const newStatus = {
          ...prev,
          drivers: updatedDrivers,
          ...counts,
          total: updatedDrivers.length
        };

        console.log('📊 RealTimeDriverStatus: Updated status after online event:', newStatus);
        return newStatus;
      });
    };

    const handleDriverOffline = (driver) => {
      console.log('🔴 RealTimeDriverStatus: Driver offline event received:', driver);
      setDriverStatus(prev => {
        const updatedDrivers = prev.drivers.map(d =>
          d.id === driver.id ? { ...d, status: 'offline', lastActive: new Date().toISOString() } : d
        );

        const counts = updatedDrivers.reduce((acc, d) => {
          acc[d.status] = (acc[d.status] || 0) + 1;
          return acc;
        }, { online: 0, busy: 0, offline: 0 });

        const newStatus = {
          ...prev,
          drivers: updatedDrivers,
          ...counts,
          total: updatedDrivers.length
        };

        console.log('📊 RealTimeDriverStatus: Updated status after offline event:', newStatus);
        return newStatus;
      });
    };

    const handleDriverBusy = (driver) => {
      console.log('🟡 RealTimeDriverStatus: Driver busy event received:', driver);
      setDriverStatus(prev => {
        const updatedDrivers = prev.drivers.map(d =>
          d.id === driver.id ? { ...d, status: 'busy', lastActive: new Date().toISOString() } : d
        );

        const counts = updatedDrivers.reduce((acc, d) => {
          acc[d.status] = (acc[d.status] || 0) + 1;
          return acc;
        }, { online: 0, busy: 0, offline: 0 });

        const newStatus = {
          ...prev,
          drivers: updatedDrivers,
          ...counts,
          total: updatedDrivers.length
        };

        console.log('📊 RealTimeDriverStatus: Updated status after busy event:', newStatus);
        return newStatus;
      });
    };

    // Listen for real-time events
    socket.on('driver:online', handleDriverOnline);
    socket.on('driver:offline', handleDriverOffline);
    socket.on('driver:busy', handleDriverBusy);

    // Also listen for the driver-status-changed event that the driver emits
    socket.on('driver-status-changed', (data) => {
      console.log('🔄 RealTimeDriverStatus: Driver status changed event received:', data);

      // Map the driver status to our internal status
      let status = 'offline';
      if (data.isOnline && data.isActive) {
        status = 'online';
      } else if (data.isActive && !data.isOnline) {
        status = 'busy';
      }

      const driverData = {
        id: data.driverId,
        name: data.driverName,
        status: status,
        lastActive: data.timestamp
      };

      if (status === 'online') {
        handleDriverOnline(driverData);
      } else if (status === 'offline') {
        handleDriverOffline(driverData);
      } else if (status === 'busy') {
        handleDriverBusy(driverData);
      }
    });

    //console.log('✅ RealTimeDriverStatus: Socket event listeners set up successfully');

    return () => {
      if (socket) {
        //console.log('🧹 RealTimeDriverStatus: Cleaning up socket event listeners');
        socket.off('driver:online', handleDriverOnline);
        socket.off('driver:offline', handleDriverOffline);
        socket.off('driver:busy', handleDriverBusy);
        socket.off('driver-status-changed');
      }
    };
  }, []);

  const statusCards = [
    {
      title: 'Online',
      count: driverStatus.online,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: WifiIcon
    },
    {
      title: 'Busy',
      count: driverStatus.busy,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      icon: ClockIcon
    },
    {
      title: 'Offline',
      count: driverStatus.offline,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      icon: XCircleIcon
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="px-3 sm:px-2 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-xs font-semibold text-gray-900">Driver Status</h2>
            <p className="text-xs text-gray-600">
              Real-time driver availability
              {lastUpdate && (
                <span className="ml-1 text-xs text-gray-500">
                  • {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>

          {/* Refresh button removed - WebSocket provides real-time updates */}
        </div>
      </div>

      <div className="p-3 sm:p-2 flex-1 flex flex-col">
        <div className="grid grid-cols-3 gap-2 mb-3">
          {statusCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={`status-${card.title}-${index}`} className="bg-gray-50 rounded p-2 sm:p-1 text-center">
                <div className={`p-1 sm:p-0.5 rounded-lg ${card.bgColor} w-fit mx-auto mb-1`}>
                  <Icon className={`w-3 h-3 sm:w-2.5 sm:h-2.5 ${card.color}`} />
                </div>
                <p className="text-sm sm:text-xs font-bold text-gray-900">{card.count}</p>
                <p className="text-xs sm:text-xs text-gray-600">{card.title}</p>
              </div>
            );
          })}
        </div>

        <div className="space-y-2 flex-1">
          <h3 className="text-sm sm:text-xs font-medium text-gray-700">Recent Activity</h3>
          <div className="space-y-1 flex-1 overflow-y-auto">
            {driverStatus.drivers.slice(0, 4).map((driver, index) => {
              // Handle both 'isActive' and 'isOnline' field names
              const isOnline = driver.isOnline !== undefined ? driver.isOnline :
                driver.isActive !== undefined ? driver.isActive : false;
              const status = isOnline ? 'online' : 'offline';

              return (
                <div key={driver._id || driver.id || `driver-status-${index}`} className="flex items-start justify-between p-2 sm:p-1.5 bg-gray-50 rounded">
                  <div className="flex items-start space-x-2 min-w-0 flex-1">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(status).split(' ')[0]}`}></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-xs font-medium text-gray-900 truncate">{capitalizeName(driver.name)}</p>
                      <p className="text-xs text-gray-500 truncate">{driver.currentLocation || driver.area || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <p className={`text-xs px-1.5 py-0.5 rounded-full ${getStatusColor(status)}`}>
                      {getStatusText(status)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(driver.lastActive || driver.lastLogin || new Date()).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeDriverStatus;
