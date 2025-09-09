import React, { useState, useEffect } from 'react';
import {
    ArrowPathIcon,
    XMarkIcon,
    SparklesIcon,
    RocketLaunchIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import pwaService from '../../services/pwaService';

const PWAUpdateNotification = ({ className = '' }) => {
    const [showUpdate, setShowUpdate] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateProgress, setUpdateProgress] = useState(0);

    useEffect(() => {
        // Listen for PWA update events
        const handleUpdateAvailable = () => {
            setShowUpdate(true);
        };

        window.addEventListener('pwa-update-available', handleUpdateAvailable);

        return () => {
            window.removeEventListener('pwa-update-available', handleUpdateAvailable);
        };
    }, []);

    const handleUpdate = async () => {
        setIsUpdating(true);
        setUpdateProgress(0);

        // Simulate update progress
        const progressInterval = setInterval(() => {
            setUpdateProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                    return 100;
                }
                return prev + 10;
            });
        }, 200);

        try {
            await pwaService.updateServiceWorker();
            await pwaService.skipWaiting();
        } catch (error) {
            console.error('Update failed:', error);
            setIsUpdating(false);
            setUpdateProgress(0);
        }
    };

    const handleDismiss = () => {
        setShowUpdate(false);
    };

    if (!showUpdate) return null;

    return (
        <div className={`fixed top-4 left-4 right-4 z-50 max-w-2xl mx-auto ${className}`}>
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
                <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <RocketLaunchIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <SparklesIcon className="h-2 w-2 text-white" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            🎉 New Version Available!
                        </h3>
                        <p className="text-sm text-gray-700 mb-4">
                            A new version of Greep SDS is ready with improved features, better performance, and bug fixes.
                        </p>

                        {/* Update Progress */}
                        {isUpdating && (
                            <div className="mb-4">
                                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                    <span>Updating...</span>
                                    <span>{updateProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${updateProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Features */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 text-xs text-gray-600">
                            <div className="flex items-center space-x-2">
                                <CheckCircleIcon className="h-3 w-3 text-green-500" />
                                <span>Enhanced Performance</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CheckCircleIcon className="h-3 w-3 text-green-500" />
                                <span>Bug Fixes</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CheckCircleIcon className="h-3 w-3 text-green-500" />
                                <span>New Features</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CheckCircleIcon className="h-3 w-3 text-green-500" />
                                <span>Security Updates</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleUpdate}
                                disabled={isUpdating}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
                            >
                                {isUpdating ? (
                                    <>
                                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                        <span>Updating...</span>
                                    </>
                                ) : (
                                    <>
                                        <ArrowPathIcon className="h-4 w-4" />
                                        <span>Update Now</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleDismiss}
                                disabled={isUpdating}
                                className="text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-white/50 transition-colors duration-200 disabled:opacity-50"
                            >
                                Update Later
                            </button>
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={handleDismiss}
                        disabled={isUpdating}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-2 hover:bg-white/50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PWAUpdateNotification;
