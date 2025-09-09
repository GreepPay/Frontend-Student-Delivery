import React, { useState, useEffect } from 'react';
import {
    DevicePhoneMobileIcon,
    ArrowDownTrayIcon,
    CheckCircleIcon,
    XMarkIcon,
    SparklesIcon,
    RocketLaunchIcon
} from '@heroicons/react/24/outline';
import pwaService from '../../services/pwaService';

const PWAInstallButton = ({
    className = '',
    showText = true,
    variant = 'default',
    onInstall = null,
    onDismiss = null
}) => {
    const [canInstall, setCanInstall] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Check initial state
        setCanInstall(pwaService.canInstall());
        setIsInstalled(pwaService.isAppInstalled());

        // Listen for PWA events
        const handleInstallAvailable = () => {
            setCanInstall(true);
            setShowPrompt(true);
        };

        const handleInstalled = () => {
            setIsInstalled(true);
            setCanInstall(false);
            setShowPrompt(false);
            setIsInstalling(false);
        };

        const handleOnline = () => {
            // App is back online
        };

        const handleOffline = () => {
            // App is offline
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

    const handleInstall = async () => {
        setIsInstalling(true);

        try {
            const success = await pwaService.showInstallPrompt();

            if (success) {
                onInstall && onInstall();
            } else {
                setIsInstalling(false);
            }
        } catch (error) {
            console.error('Install failed:', error);
            setIsInstalling(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        onDismiss && onDismiss();
    };

    // Don't show if already installed or can't install
    if (isInstalled || (!canInstall && !showPrompt)) {
        return null;
    }

    // Variant styles
    const getVariantStyles = () => {
        switch (variant) {
            case 'floating':
                return 'fixed bottom-6 right-6 z-50';
            case 'banner':
                return 'w-full bg-gradient-to-r from-blue-50 via-white to-purple-50 border border-blue-200 rounded-2xl p-6 mb-6 shadow-lg';
            case 'inline':
                return 'inline-flex items-center';
            default:
                return 'flex items-center justify-center';
        }
    };

    const getButtonStyles = () => {
        switch (variant) {
            case 'floating':
                return 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105';
            case 'banner':
                return 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200';
            case 'inline':
                return 'bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md transition-colors duration-200';
            default:
                return 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200';
        }
    };

    if (variant === 'banner' && showPrompt) {
        return (
            <div className={`${getVariantStyles()} ${className}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                            <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <RocketLaunchIcon className="h-6 w-6 text-white" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                    <SparklesIcon className="h-2 w-2 text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Install Greep SDS
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Get quick access, work offline, and enjoy a native app experience
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                    <CheckCircleIcon className="h-3 w-3 text-green-500" />
                                    <span>Offline Support</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <CheckCircleIcon className="h-3 w-3 text-green-500" />
                                    <span>Fast Loading</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <CheckCircleIcon className="h-3 w-3 text-green-500" />
                                    <span>Push Notifications</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleInstall}
                            disabled={isInstalling}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isInstalling ? (
                                <div className="flex items-center space-x-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    <span>Installing...</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <ArrowDownTrayIcon className="h-4 w-4" />
                                    <span>Install App</span>
                                </div>
                            )}
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (variant === 'floating' && showPrompt) {
        return (
            <div className={`${getVariantStyles()} ${className}`}>
                <div className="relative group">
                    <button
                        onClick={handleInstall}
                        disabled={isInstalling}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-2xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-3 min-w-[200px]"
                    >
                        {isInstalling ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                <span>Installing...</span>
                            </>
                        ) : (
                            <>
                                <div className="relative">
                                    <RocketLaunchIcon className="h-6 w-6" />
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-bold">Install App</div>
                                    <div className="text-xs opacity-90">Get native experience</div>
                                </div>
                            </>
                        )}
                    </button>

                    {/* Tooltip */}
                    <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                            Install Greep SDS for better experience
                            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Default inline button
    if (canInstall || showPrompt) {
        return (
            <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
            >
                {isInstalling ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Installing...</span>
                    </>
                ) : (
                    <>
                        <RocketLaunchIcon className="h-4 w-4" />
                        {showText && <span>Install App</span>}
                    </>
                )}
            </button>
        );
    }

    return null;
};

export default PWAInstallButton;
