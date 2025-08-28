import React, { useState, useEffect } from 'react';
import { XMarkIcon, CogIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import devHelpers from '../../utils/devHelpers';

const DevPanel = ({ isOpen, onClose }) => {
    const [status, setStatus] = useState({});
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Only show in development
        setIsVisible(process.env.NODE_ENV === 'development');
        updateStatus();
    }, []);

    const updateStatus = () => {
        setStatus(devHelpers.getStatus());
    };

    const handleRateLimitBypass = (enable) => {
        if (enable) {
            devHelpers.enableRateLimitBypass();
        } else {
            devHelpers.disableRateLimitBypass();
        }
        updateStatus();
    };

    const handleClearRateLimits = () => {
        devHelpers.clearRateLimits();
        updateStatus();
    };

    if (!isVisible) return null;

    return (
        <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <CogIcon className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Development Panel</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {/* Rate Limiting Section */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Rate Limiting</h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Bypass Enabled:</span>
                                <span className={`text-sm font-medium ${status.rateLimitBypass ? 'text-green-600' : 'text-red-600'}`}>
                                    {status.rateLimitBypass ? 'Yes' : 'No'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Min Interval:</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {status.rateLimiterStatus?.minInterval}ms
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Active Endpoints:</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {status.rateLimiterStatus?.activeEndpoints}
                                </span>
                            </div>

                            <div className="flex space-x-2 pt-2">
                                <button
                                    onClick={() => handleRateLimitBypass(!status.rateLimitBypass)}
                                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${status.rateLimitBypass
                                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                        }`}
                                >
                                    {status.rateLimitBypass ? 'Disable Bypass' : 'Enable Bypass'}
                                </button>
                                <button
                                    onClick={handleClearRateLimits}
                                    className="px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h4>
                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    console.log('🔧 Development helpers available at window.devHelpers');
                                    console.log('🔧 Status:', devHelpers.getStatus());
                                }}
                                className="w-full px-3 py-2 text-sm font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                                Log Status to Console
                            </button>

                            <button
                                onClick={() => {
                                    window.devHelpers?.clearRateLimits();
                                    updateStatus();
                                }}
                                className="w-full px-3 py-2 text-sm font-medium bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                            >
                                Force Clear Rate Limits
                            </button>
                        </div>
                    </div>

                    {/* Environment Info */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Environment</h4>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Mode:</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {process.env.NODE_ENV}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">API URL:</span>
                                <span className="text-sm font-medium text-gray-900 truncate ml-2">
                                    {process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Help */}
                    <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                            <ExclamationTriangleIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-blue-700">
                                <p className="font-medium mb-1">Development Tips:</p>
                                <ul className="space-y-1">
                                    <li>• Use bypass to avoid rate limiting during testing</li>
                                    <li>• Check console for detailed API logs</li>
                                    <li>• Use window.devHelpers for advanced control</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DevPanel;
