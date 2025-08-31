import React, { useState, useEffect } from 'react';
import { WifiIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import socketService from '../../services/socketService';

const ConnectionStatus = () => {
    const [isOnline, setIsOnline] = useState(true);
    const [showOfflineMessage, setShowOfflineMessage] = useState(false);
    const [connectionCheckCount, setConnectionCheckCount] = useState(0);

    useEffect(() => {
        const checkConnection = async () => {
            try {
                // Check both socket and API connection
                const socketConnected = socketService.isConnected();

                // Also check API health endpoint
                const apiResponse = await fetch(`${process.env.REACT_APP_API_URL}/health`, {
                    method: 'GET',
                    timeout: 3000
                });

                const apiConnected = apiResponse.ok;
                const wasOnline = isOnline;
                const isCurrentlyOnline = socketConnected || apiConnected;

                setIsOnline(isCurrentlyOnline);

                // Show offline message if we just went offline
                if (wasOnline && !isCurrentlyOnline) {
                    setShowOfflineMessage(true);
                    // Hide message after 10 seconds
                    setTimeout(() => setShowOfflineMessage(false), 10000);
                }

                // Reset connection check count if we're online
                if (isCurrentlyOnline) {
                    setConnectionCheckCount(0);
                } else {
                    setConnectionCheckCount(prev => prev + 1);
                }

                console.log('🔍 Connection check:', {
                    socketConnected,
                    apiConnected,
                    isCurrentlyOnline,
                    checkCount: connectionCheckCount
                });

            } catch (error) {
                console.log('🔍 Connection check failed:', error.message);
                const wasOnline = isOnline;
                setIsOnline(false);

                if (wasOnline) {
                    setShowOfflineMessage(true);
                    setTimeout(() => setShowOfflineMessage(false), 10000);
                }
            }
        };

        // Initial check after a short delay to allow socket to initialize
        const initialCheck = setTimeout(checkConnection, 2000);

        // Check connection every 10 seconds (less frequent to avoid spam)
        const interval = setInterval(checkConnection, 10000);

        return () => {
            clearTimeout(initialCheck);
            clearInterval(interval);
        };
    }, [isOnline, connectionCheckCount]);

    if (isOnline) return null;

    return (
        <>
            {/* Persistent offline indicator */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-2 text-center text-sm font-medium">
                <div className="flex items-center justify-center space-x-2">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <span>OFFLINE - Backend server is not running</span>
                </div>
            </div>

            {/* Temporary detailed message */}
            {showOfflineMessage && (
                <div className="fixed top-12 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg max-w-md">
                    <div className="flex items-start space-x-3">
                        <ExclamationTriangleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold mb-1">Connection Lost</h3>
                            <p className="text-sm opacity-90">
                                The backend server is not running. Please ensure the server is started on the configured API_URL
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ConnectionStatus;
