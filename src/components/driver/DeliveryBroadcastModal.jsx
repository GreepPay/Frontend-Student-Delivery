import React, { useState, useEffect, useRef } from 'react';
import {
    TruckIcon, MapPinIcon, ClockIcon, UserIcon, PhoneIcon,
    CheckCircleIcon, XMarkIcon, FireIcon, BoltIcon, StarIcon
} from '@heroicons/react/24/outline';
import { useToast } from '../common/ToastProvider';
import apiService from '../../services/api';
import soundService from '../../services/soundService';
import { useSystemSettings } from '../../context/SystemSettingsContext';

const DeliveryBroadcastModal = ({ delivery, onAccept, onClose, onExpire }) => {
    const { showSuccess, showError } = useToast();
    const { formatCurrency, getCurrency } = useSystemSettings();
    const [timeRemaining, setTimeRemaining] = useState(delivery.broadcastDuration || 60);
    const [isAccepting, setIsAccepting] = useState(false);
    const [soundInterval, setSoundInterval] = useState(null);
    const intervalRef = useRef(null);

    // Calculate time remaining
    useEffect(() => {
        if (delivery?.broadcastEndTime) {
            const calculateTimeRemaining = () => {
                const now = new Date();
                const endTime = new Date(delivery.broadcastEndTime);
                const diff = Math.max(0, Math.floor((endTime - now) / 1000));

                if (diff <= 0) {
                    clearInterval(intervalRef.current);
                    onExpire && onExpire(delivery.deliveryId || delivery.id);
                    return;
                }
                setTimeRemaining(diff);
            };

            calculateTimeRemaining();
            intervalRef.current = setInterval(calculateTimeRemaining, 1000);

            return () => {
                if (intervalRef.current) clearInterval(intervalRef.current);
            };
        }
    }, [delivery?.broadcastEndTime, onExpire, delivery?.deliveryId, delivery?.id]);

    // Play persistent notification sound
    useEffect(() => {
        const playPersistentSound = () => {
            try {
                soundService.playSound('delivery');
            } catch (error) {
                console.warn('Could not play delivery sound:', error);
            }
        };

        playPersistentSound();
        const interval = setInterval(playPersistentSound, 3000);
        setSoundInterval(interval);

        return () => {
            if (interval) clearInterval(interval);
        };
    }, []);

    const stopSound = () => {
        if (soundInterval) {
            clearInterval(soundInterval);
            setSoundInterval(null);
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const getPriorityInfo = (priority) => {
        switch (priority) {
            case 'urgent':
                return {
                    color: 'bg-amber-50 text-amber-700 border-amber-200',
                    icon: <FireIcon className="h-4 w-4" />,
                    bgColor: 'bg-amber-500'
                };
            case 'high':
                return {
                    color: 'bg-orange-50 text-orange-700 border-orange-200',
                    icon: <BoltIcon className="h-4 w-4" />,
                    bgColor: 'bg-orange-500'
                };
            default:
                return {
                    color: 'bg-slate-50 text-slate-700 border-slate-200',
                    icon: <StarIcon className="h-4 w-4" />,
                    bgColor: 'bg-slate-500'
                };
        }
    };

    const handleAccept = async () => {
        try {
            setIsAccepting(true);
            stopSound();
            const deliveryId = delivery.deliveryId || delivery.id;
            const response = await apiService.acceptBroadcastDelivery(deliveryId);

            if (response.success) {
                showSuccess('Delivery accepted successfully!');
                soundService.playSound('success');
                onAccept && onAccept(deliveryId);
            } else {
                showError(response.message || 'Failed to accept delivery');
            }
        } catch (error) {
            console.error('Error accepting delivery:', error);
            showError('Failed to accept delivery');
        } finally {
            setIsAccepting(false);
        }
    };

    const handleClose = () => {
        stopSound();
        const deliveryId = delivery.deliveryId || delivery.id;
        onClose && onClose(deliveryId);
    };

    if (!delivery) return null;

    const priorityInfo = getPriorityInfo(delivery.priority);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
                {/* Header */}
                <div className={`${priorityInfo.bgColor} p-6 text-white relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                                    <TruckIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold tracking-tight">New Delivery</h2>
                                    <p className="text-white/80 text-sm font-medium">Available for pickup</p>
                                </div>
                            </div>
                            <div className="bg-white/20 px-3 py-2 rounded-xl backdrop-blur-sm">
                                <div className="flex items-center space-x-2">
                                    <ClockIcon className="h-4 w-4" />
                                    <span className="font-mono font-semibold text-sm">{formatTime(timeRemaining)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Delivery Info */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <span className="font-mono text-sm bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700">
                                #{delivery.deliveryCode}
                            </span>
                            <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1.5 border ${priorityInfo.color}`}>
                                {priorityInfo.icon}
                                <span>{delivery.priority?.toUpperCase()}</span>
                            </span>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                                {formatCurrency(delivery.fee, getCurrency())}
                            </div>
                            {delivery.driverEarning && (
                                <div className="text-xs text-gray-500 font-medium">
                                    Your earning: {formatCurrency(delivery.driverEarning, getCurrency())}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-center space-x-3">
                            <div className="bg-white p-2 rounded-xl shadow-sm">
                                <UserIcon className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-sm">{delivery.customerName}</h3>
                                <div className="flex items-center space-x-1.5 mt-1">
                                    <PhoneIcon className="h-3 w-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">{delivery.customerPhone}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Locations */}
                    <div className="space-y-3">
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <div className="flex items-start space-x-3">
                                <div className="bg-white p-2 rounded-xl shadow-sm mt-0.5">
                                    <MapPinIcon className="h-4 w-4 text-gray-600" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 text-sm mb-1">Pickup Location</h4>
                                    <p className="text-gray-700 text-sm font-medium">{delivery.pickupLocationDescription || delivery.pickupLocation}</p>
                                    {delivery.pickupLocationDescription && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {delivery.pickupLocationDescription}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <div className="flex items-start space-x-3">
                                <div className="bg-white p-2 rounded-xl shadow-sm mt-0.5">
                                    <MapPinIcon className="h-4 w-4 text-gray-600" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 text-sm mb-1">Delivery Location</h4>
                                    <p className="text-gray-700 text-sm font-medium">{delivery.deliveryLocationDescription || delivery.deliveryLocation}</p>
                                    {delivery.deliveryLocationDescription && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {delivery.deliveryLocationDescription}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {delivery.notes && (
                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                            <h4 className="font-semibold text-gray-900 text-sm mb-1">Special Notes</h4>
                            <p className="text-gray-700 text-sm">{delivery.notes}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-2">
                        <button
                            onClick={handleAccept}
                            disabled={isAccepting || timeRemaining <= 0}
                            className="flex-1 flex items-center justify-center px-6 py-3.5 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm shadow-lg"
                        >
                            {isAccepting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Accepting...
                                </>
                            ) : (
                                <>
                                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                                    Accept Delivery
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleClose}
                            className="px-4 py-3.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-2xl transition-all duration-200 border border-gray-200 hover:border-gray-300"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Timer Progress Bar */}
                <div className="h-1 bg-gray-100">
                    <div
                        className={`h-full ${priorityInfo.bgColor} transition-all duration-1000 ease-linear`}
                        style={{
                            width: `${((delivery.broadcastDuration || 60) - timeRemaining) / (delivery.broadcastDuration || 60) * 100}%`
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default DeliveryBroadcastModal;
