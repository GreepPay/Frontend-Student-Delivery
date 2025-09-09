import React, { useState, useEffect } from 'react';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XMarkIcon,
    SparklesIcon,
    RocketLaunchIcon
} from '@heroicons/react/24/outline';
import pwaService from '../../services/pwaService';

const PWANotification = ({
    type = 'info',
    title,
    message,
    duration = 5000,
    onClose = null,
    showIcon = true,
    className = ''
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [duration]);

    const handleClose = () => {
        setIsAnimating(true);
        setTimeout(() => {
            setIsVisible(false);
            onClose && onClose();
        }, 300);
    };

    const getNotificationStyles = () => {
        switch (type) {
            case 'success':
                return {
                    bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
                    border: 'border-green-200',
                    icon: 'bg-green-100',
                    iconColor: 'text-green-600',
                    titleColor: 'text-green-900',
                    messageColor: 'text-green-700'
                };
            case 'warning':
                return {
                    bg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
                    border: 'border-yellow-200',
                    icon: 'bg-yellow-100',
                    iconColor: 'text-yellow-600',
                    titleColor: 'text-yellow-900',
                    messageColor: 'text-yellow-700'
                };
            case 'error':
                return {
                    bg: 'bg-gradient-to-r from-red-50 to-rose-50',
                    border: 'border-red-200',
                    icon: 'bg-red-100',
                    iconColor: 'text-red-600',
                    titleColor: 'text-red-900',
                    messageColor: 'text-red-700'
                };
            case 'pwa':
                return {
                    bg: 'bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50',
                    border: 'border-blue-200',
                    icon: 'bg-gradient-to-br from-blue-500 to-purple-600',
                    iconColor: 'text-white',
                    titleColor: 'text-gray-900',
                    messageColor: 'text-gray-700'
                };
            default:
                return {
                    bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
                    border: 'border-blue-200',
                    icon: 'bg-blue-100',
                    iconColor: 'text-blue-600',
                    titleColor: 'text-blue-900',
                    messageColor: 'text-blue-700'
                };
        }
    };

    const getIcon = () => {
        if (!showIcon) return null;

        switch (type) {
            case 'success':
                return <CheckCircleIcon className="h-6 w-6" />;
            case 'warning':
                return <ExclamationTriangleIcon className="h-6 w-6" />;
            case 'error':
                return <ExclamationTriangleIcon className="h-6 w-6" />;
            case 'pwa':
                return <RocketLaunchIcon className="h-6 w-6" />;
            default:
                return <InformationCircleIcon className="h-6 w-6" />;
        }
    };

    const styles = getNotificationStyles();

    if (!isVisible) return null;

    return (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${className}`}>
            <div className={`
        ${styles.bg} ${styles.border} border rounded-2xl p-4 shadow-xl
        transform transition-all duration-300 ease-in-out
        ${isAnimating ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        hover:shadow-2xl hover:scale-105
      `}>
                <div className="flex items-start space-x-3">
                    {/* Icon */}
                    {showIcon && (
                        <div className={`flex-shrink-0 w-10 h-10 ${styles.icon} rounded-xl flex items-center justify-center ${styles.iconColor}`}>
                            {getIcon()}
                            {type === 'pwa' && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {title && (
                            <h4 className={`text-sm font-semibold ${styles.titleColor} mb-1`}>
                                {title}
                            </h4>
                        )}
                        {message && (
                            <p className={`text-sm ${styles.messageColor}`}>
                                {message}
                            </p>
                        )}

                        {/* PWA specific features */}
                        {type === 'pwa' && (
                            <div className="flex items-center space-x-3 mt-2 text-xs text-gray-600">
                                <div className="flex items-center space-x-1">
                                    <SparklesIcon className="h-3 w-3 text-blue-500" />
                                    <span>Offline Ready</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <SparklesIcon className="h-3 w-3 text-purple-500" />
                                    <span>Fast Loading</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1 hover:bg-white/50 rounded-lg transition-colors duration-200"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>

                {/* Progress Bar */}
                {duration > 0 && (
                    <div className="mt-3 w-full bg-white/30 rounded-full h-1 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"
                            style={{
                                animation: `shrink ${duration}ms linear forwards`
                            }}
                        />
                    </div>
                )}
            </div>

            <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
        </div>
    );
};

export default PWANotification;
