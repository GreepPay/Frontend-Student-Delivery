import React, { useState, useEffect } from 'react';
import {
    WifiIcon,
    SignalSlashIcon,
    DevicePhoneMobileIcon,
    CheckCircleIcon,
    XCircleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import pwaService from '../../services/pwaService';

const PWAStatus = ({ showDetails = false, className = '' }) => {
    const [pwaInfo, setPwaInfo] = useState({
        canInstall: false,
        isInstalled: false,
        isOnline: true,
        hasServiceWorker: false,
        displayMode: 'browser'
    });

    useEffect(() => {
        // Get initial PWA info
        setPwaInfo(pwaService.getPWAInfo());

        // Listen for PWA events
        const handleInstallAvailable = () => {
            setPwaInfo(pwaService.getPWAInfo());
        };

        const handleInstalled = () => {
            setPwaInfo(pwaService.getPWAInfo());
        };

        const handleOnline = () => {
            setPwaInfo(pwaService.getPWAInfo());
        };

        const handleOffline = () => {
            setPwaInfo(pwaService.getPWAInfo());
        };

        window.addEventListener('pwa-install-available', handleInstallAvailable);
        window.addEventListener('pwa-installed', handleInstalled);
        window.addEventListener('pwa-online', handleOnline);
        window.addEventListener('pwa-offline', handleOffline);

        return () => {
            window.removeEventListener('pwa-install-available', handleInstallAvailable);
            window.removeEventListener('pwa-installed', handleInstalled);
            window.removeEventListener('pwa-online', handleOnline);
            window.removeEventListener('pwa-offline', handleOffline);
        };
    }, []);

    const getStatusColor = () => {
        if (!pwaInfo.isOnline) return 'text-red-500';
        if (pwaInfo.isInstalled) return 'text-green-500';
        if (pwaInfo.canInstall) return 'text-blue-500';
        return 'text-gray-500';
    };

    const getStatusText = () => {
        if (!pwaInfo.isOnline) return 'Offline';
        if (pwaInfo.isInstalled) return 'Installed';
        if (pwaInfo.canInstall) return 'Can Install';
        return 'Browser Mode';
    };

    const getStatusIcon = () => {
        if (!pwaInfo.isOnline) {
            return <SignalSlashIcon className="h-4 w-4" />;
        }
        if (pwaInfo.isInstalled) {
            return <CheckCircleIcon className="h-4 w-4" />;
        }
        if (pwaInfo.canInstall) {
            return <DevicePhoneMobileIcon className="h-4 w-4" />;
        }
        return <InformationCircleIcon className="h-4 w-4" />;
    };

    if (!showDetails) {
        return (
            <div className={`flex items-center space-x-2 ${className}`}>
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 ${getStatusColor()}`}>
                    <div className="relative">
                        {getStatusIcon()}
                        {pwaInfo.isOnline && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        )}
                    </div>
                    <span className="text-sm font-medium">{getStatusText()}</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-xl p-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <DevicePhoneMobileIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900">PWA Status</h3>
                    <p className="text-sm text-gray-600">Progressive Web App Information</p>
                </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Connection Status */}
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${pwaInfo.isOnline ? 'bg-green-100' : 'bg-red-100'
                                }`}>
                                {pwaInfo.isOnline ? (
                                    <WifiIcon className="h-5 w-5 text-green-600" />
                                ) : (
                                    <SignalSlashIcon className="h-5 w-5 text-red-600" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Connection</p>
                                <p className={`text-xs ${pwaInfo.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                                    {pwaInfo.isOnline ? 'Online' : 'Offline'}
                                </p>
                            </div>
                        </div>
                        {pwaInfo.isOnline && (
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        )}
                    </div>
                </div>

                {/* Installation Status */}
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${pwaInfo.isInstalled ? 'bg-green-100' : 'bg-gray-100'
                                }`}>
                                {pwaInfo.isInstalled ? (
                                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                ) : (
                                    <XCircleIcon className="h-5 w-5 text-gray-400" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Installation</p>
                                <p className={`text-xs ${pwaInfo.isInstalled ? 'text-green-600' : 'text-gray-600'}`}>
                                    {pwaInfo.isInstalled ? 'Installed' : 'Not Installed'}
                                </p>
                            </div>
                        </div>
                        {pwaInfo.isInstalled && (
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        )}
                    </div>
                </div>

                {/* Service Worker Status */}
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${pwaInfo.hasServiceWorker ? 'bg-blue-100' : 'bg-gray-100'
                                }`}>
                                <CheckCircleIcon className={`h-5 w-5 ${pwaInfo.hasServiceWorker ? 'text-blue-600' : 'text-gray-400'}`} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Service Worker</p>
                                <p className={`text-xs ${pwaInfo.hasServiceWorker ? 'text-blue-600' : 'text-gray-600'}`}>
                                    {pwaInfo.hasServiceWorker ? 'Active' : 'Inactive'}
                                </p>
                            </div>
                        </div>
                        {pwaInfo.hasServiceWorker && (
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        )}
                    </div>
                </div>

                {/* Display Mode */}
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <DevicePhoneMobileIcon className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Display Mode</p>
                                <p className="text-xs text-purple-600 capitalize">
                                    {pwaInfo.displayMode}
                                </p>
                            </div>
                        </div>
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* Install Availability */}
            {pwaInfo.canInstall && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200 mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <DevicePhoneMobileIcon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">Install Available</p>
                            <p className="text-xs text-gray-600">You can install this app for a better experience</p>
                        </div>
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                </div>
            )}

            {/* PWA Features */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">PWA Features</h4>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircleIcon className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-xs text-gray-700">Offline Support</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircleIcon className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-xs text-gray-700">App Installation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircleIcon className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-xs text-gray-700">Push Notifications</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircleIcon className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-xs text-gray-700">Background Sync</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PWAStatus;
