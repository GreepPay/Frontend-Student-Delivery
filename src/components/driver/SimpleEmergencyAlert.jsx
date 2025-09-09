import React, { useState, useEffect, useRef } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socketService';
import soundService from '../../services/soundService';
import apiService from '../../services/api';
import { useToast } from '../common/ToastProvider';

const SimpleEmergencyAlert = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();
    const [showModal, setShowModal] = useState(false);
    const [message, setMessage] = useState('');
    // const [adminReplies, setAdminReplies] = useState([]); // For future use
    const modalRef = useRef(null);

    // Handle click outside modal
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setShowModal(false);
            }
        };

        if (showModal) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showModal]);

    const sendEmergencyAlert = async () => {
        if (!message.trim()) {
            return;
        }

        try {
            // Get current location if available
            let location = null;
            if (navigator.geolocation) {
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            timeout: 5000,
                            enableHighAccuracy: true
                        });
                    });
                    location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    console.log('📍 Emergency alert location:', location);
                } catch (error) {
                    console.warn('⚠️ Could not get location for emergency alert:', error);
                }
            }

            // Send emergency alert via the messaging API
            const response = await apiService.sendMessage({
                message: message.trim(),
                type: 'emergency',
                location: location,
                timestamp: new Date().toISOString()
            });

            if (response.success) {
                showSuccess('Emergency alert sent successfully!');
                console.log('✅ Emergency alert sent via messaging API:', response);
            } else {
                showError('Failed to send emergency alert');
                console.error('❌ Emergency alert failed:', response);
            }

            // Also emit via socket for real-time delivery
            const userId = user._id || user.id;
            if (socketService.isConnected()) {
                socketService.emit('emergency-alert', {
                    driverId: userId,
                    message: message.trim(),
                    timestamp: new Date().toISOString(),
                    location
                });
                console.log('🔌 Emergency alert also sent via socket');
            }

            setMessage('');
            setShowModal(false);
        } catch (error) {
            console.error('❌ Error sending emergency alert:', error);
            showError('Failed to send emergency alert. Please try again.');
        }
    };

    // Listen for admin replies
    useEffect(() => {
        if (!user) return;

        const userId = user._id || user.id;

        // Ensure socket is connected
        if (!socketService.isInitialized() || !socketService.isConnected()) {
            socketService.connect(userId, user.userType);
        }

        socketService.on('emergency-reply', (data) => {
            // Play alert sound for emergency reply
            soundService.playSound('alert').catch(err => console.log('🔊 Emergency reply sound failed:', err));
            // Admin reply received - could be handled by notification system instead
        });

        socketService.on('emergency-sent', (data) => {
            console.log('✅ Emergency alert sent confirmation:', data);
        });

        return () => {
            socketService.off('emergency-reply');
            socketService.off('emergency-sent');
        };
    }, [user]);

    return (
        <>
            {/* Emergency Button */}
            <button
                onClick={() => setShowModal(true)}
                className="fixed bottom-6 right-6 bg-red-500 hover:bg-red-600 text-white rounded-full p-4 shadow-lg"
                title="Emergency Alert"
            >
                <ExclamationTriangleIcon className="h-6 w-6" />
            </button>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div ref={modalRef} className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-red-600 mb-4">
                            Emergency Alert
                        </h3>

                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Describe the emergency..."
                            className={`w-full p-3 border rounded-lg mb-4 ${message.trim() === '' && message !== ''
                                ? 'border-red-500'
                                : 'border-gray-300'
                                }`}
                            rows={4}
                        />
                        {message.trim() === '' && message !== '' && (
                            <p className="text-red-500 text-sm mb-4">
                                Please enter an emergency message
                            </p>
                        )}

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 text-gray-600 border rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={sendEmergencyAlert}
                                disabled={!message.trim()}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
                            >
                                Send Alert
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SimpleEmergencyAlert; 