import { useState, useCallback } from 'react';
import soundService from '../services/soundService';

const usePointsNotification = () => {
    const [notification, setNotification] = useState({
        isVisible: false,
        points: 0,
        reason: '',
        id: null
    });

    const showPointsNotification = useCallback((points, reason = 'Points earned!') => {
        const notificationId = `points_${Date.now()}_${Math.random()}`;

        console.log('🎉 Showing points notification:', { points, reason, id: notificationId });

        // Play success sound
        soundService.playSound('success');

        setNotification({
            isVisible: true,
            points,
            reason,
            id: notificationId
        });
    }, []);

    const hidePointsNotification = useCallback(() => {
        setNotification(prev => ({
            ...prev,
            isVisible: false
        }));
    }, []);

    const triggerReferralPoints = useCallback((points, driverName) => {
        showPointsNotification(points, `Referral bonus - Referred ${driverName}`);
    }, [showPointsNotification]);

    const triggerDeliveryPoints = useCallback((points, deliveryId) => {
        showPointsNotification(points, `Delivery completed - Order #${deliveryId}`);
    }, [showPointsNotification]);

    const triggerBonusPoints = useCallback((points, reason) => {
        showPointsNotification(points, reason);
    }, [showPointsNotification]);

    return {
        notification,
        showPointsNotification,
        hidePointsNotification,
        triggerReferralPoints,
        triggerDeliveryPoints,
        triggerBonusPoints
    };
};

export default usePointsNotification;
