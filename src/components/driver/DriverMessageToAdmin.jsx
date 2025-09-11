import React, { useState, useEffect, useRef } from 'react';
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import apiService from '../../services/api';
import { useToast } from '../common/ToastProvider';
import soundService from '../../services/soundService';
import socketService from '../../services/socketService';
import { useAuth } from '../../context/AuthContext';
import MessageImageUpload from '../common/MessageImageUpload';
import messageImageService from '../../services/messageImageService';

const DriverMessageToAdmin = () => {
    const { showError } = useToast();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [imageUploadResetTrigger, setImageUploadResetTrigger] = useState(0);
    const [messages, setMessages] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef(null);

    const handleImageSelect = (imageFile) => {
        setSelectedImage(imageFile);
    };

    const handleImageRemove = () => {
        setSelectedImage(null);
    };

    const handleOpenMessaging = () => {
        setIsOpen(true);
        // Mark messages as read when opening
        const unreadMessages = messages.filter(msg => !msg.read && msg.sender === 'admin');
        if (unreadMessages.length > 0) {
            const unreadIds = unreadMessages.map(msg => msg.id);
            setMessages(prev => prev.map(msg =>
                unreadIds.includes(msg.id) ? { ...msg, read: true } : msg
            ));
            setUnreadCount(0);
            // Mark as read in backend
            apiService.markMessagesAsRead(unreadIds).catch(error => {
                console.log('Could not mark messages as read:', error);
            });
        }
    };

    // Load messages on component mount
    useEffect(() => {
        const loadMessages = async () => {
            try {
                const response = await apiService.getMessageHistory(1, 50);
                if (response.success && response.data.messages) {
                    const processedMessages = response.data.messages.map(msg => ({
                        ...msg,
                        sender: msg.senderType === 'admin' ? 'admin' : 'driver',
                        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
                    }));
                    setMessages(processedMessages);
                }
            } catch (error) {
                console.error('Error loading messages:', error);
            }
        };

        loadMessages();
    }, []);

    // WebSocket listener for admin messages
    useEffect(() => {
        if (!user) return;

        const handleNewMessage = (data) => {
            // Skip messages from the current user to prevent echo
            if (data.isFromSender || data.senderType === 'driver') {
                return;
            }

            const newMessage = {
                id: data._id || data.id || Date.now() + Math.random(),
                sender: 'admin',
                message: data.message,
                timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
                read: false,
                type: data.type || 'general',
                imageUrl: data.imageUrl,
                adminId: data.adminId,
                adminName: data.adminName || 'Admin'
            };

            // Update unread count if modal is not open
            if (!isOpen) {
                setUnreadCount(prev => prev + 1);
            }

            setMessages(prev => {
                const exists = prev.some(msg =>
                    msg.id === newMessage.id ||
                    (msg.message === newMessage.message &&
                        msg.sender === newMessage.sender &&
                        Math.abs(new Date(msg.timestamp) - new Date(newMessage.timestamp)) < 5000)
                );

                if (exists) {
                    return prev;
                }

                return [...prev, newMessage];
            });

            // Play sound notification
            soundService.playSound('notification');
        };

        socketService.on('admin-message', handleNewMessage);

        return () => {
            socketService.off('admin-message', handleNewMessage);
        };
    }, [user, isOpen]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!message.trim() && !selectedImage) {
            showError('Please enter a message or select an image');
            return;
        }

        setIsSending(true);
        try {
            console.log('💬 DriverMessageToAdmin: ===== STARTING MESSAGE SEND =====');
            console.log('💬 DriverMessageToAdmin: Message to send:', message.trim());
            console.log('💬 DriverMessageToAdmin: User object:', user);
            console.log('💬 DriverMessageToAdmin: API Service:', apiService);

            let imageUrl = null;

            // Upload image if selected
            if (selectedImage) {
                setIsUploadingImage(true);
                try {
                    const uploadResult = await messageImageService.uploadMessageImage(selectedImage);
                    imageUrl = uploadResult.data.imageUrl;
                } catch (error) {
                    console.error('Failed to upload image:', error);
                    showError('Failed to upload image. Please try again.');
                    setIsUploadingImage(false);
                    setIsSending(false);
                    return;
                }
                setIsUploadingImage(false);
            }

            // Prepare message payload
            const messagePayload = {
                type: 'general',
                timestamp: new Date().toISOString()
            };

            // Only include message if it's not empty
            if (message && message.trim()) {
                messagePayload.message = message.trim();
            }

            // Only include imageUrl if it's not null/undefined
            if (imageUrl) {
                messagePayload.imageUrl = imageUrl;
            }

            // Create local message for immediate display
            const localMessage = {
                id: Date.now(),
                sender: 'driver',
                message: message.trim(),
                timestamp: new Date(),
                read: true,
                type: 'general',
                imageUrl: imageUrl
            };

            // Add message to local state immediately
            setMessages(prev => [...prev, localMessage]);

            // Use the new messaging API instead of the old notification endpoint
            const response = await apiService.sendMessage(messagePayload);

            console.log('💬 DriverMessageToAdmin: API Response:', response);
            console.log('💬 DriverMessageToAdmin: Response success:', response.success);
            console.log('💬 DriverMessageToAdmin: Response data:', response.data);

            if (response.success) {
                // Play success sound when message is sent
                soundService.playSound('success');
                setMessage('');
                setSelectedImage(null);
                setImageUploadResetTrigger(prev => prev + 1);
                console.log('💬 DriverMessageToAdmin: Message sent via messaging API:', response);

                // Emit WebSocket event to notify admin in real-time
                console.log('💬 DriverMessageToAdmin: Checking WebSocket connection...');
                console.log('💬 DriverMessageToAdmin: Socket connected?', socketService.isConnected());

                if (socketService.isConnected()) {
                    console.log('💬 DriverMessageToAdmin: WebSocket is connected, preparing message data...');

                    // Get driver info from the API response or user object
                    const driverId = response.data?.message?.driverId?._id ||
                        response.data?.driverId?._id ||
                        user?._id ||
                        user?.id;

                    const driverName = response.data?.message?.driverId?.fullName ||
                        response.data?.driverId?.fullName ||
                        user?.fullName ||
                        user?.name ||
                        'Driver';

                    console.log('💬 DriverMessageToAdmin: Driver info extracted:', {
                        driverId: driverId,
                        driverName: driverName,
                        hasDriverId: !!driverId,
                        responseData: response.data
                    });

                    if (!driverId) {
                        console.error('💬 DriverMessageToAdmin: No driverId available:', {
                            responseDriverId: response.data?.message?.driverId,
                            userDriverId: user?._id || user?.id,
                            response: response
                        });
                        showError('Unable to send real-time notification: Driver ID not found');
                        return;
                    }

                    const messageData = {
                        message: message.trim(),
                        type: 'general',
                        driverId: driverId,
                        driverName: driverName,
                        conversationId: response.data?.conversation?._id || response.data?.message?.conversationId,
                        senderType: 'driver',
                        timestamp: new Date().toISOString(),
                        imageUrl: imageUrl, // Include imageUrl in WebSocket message
                        isFromSender: true // Flag to prevent echo
                    };

                    console.log('💬 DriverMessageToAdmin: ===== EMITTING WEBSOCKET EVENT =====');
                    console.log('💬 DriverMessageToAdmin: Message data to emit:', messageData);
                    console.log('💬 DriverMessageToAdmin: Socket service:', socketService);
                    console.log('💬 DriverMessageToAdmin: Socket object:', socketService.getSocket());

                    socketService.emit('driver-message', messageData);
                    console.log('💬 DriverMessageToAdmin: ===== WEBSOCKET EVENT EMITTED =====');
                    console.log('💬 DriverMessageToAdmin: WebSocket event emitted successfully!');
                } else {
                    console.warn('💬 DriverMessageToAdmin: WebSocket not connected, admin will not receive real-time notification');
                    console.log('💬 DriverMessageToAdmin: Attempting to connect WebSocket...');
                    socketService.connect(user?._id || user?.id, user?.userType || user?.role);
                }
            } else {
                showError('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            showError('Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="relative">
            {/* Message Icon Button */}
            <button
                onClick={handleOpenMessaging}
                className="relative p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Message Admin"
            >
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Message Thread Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Mobile: Full screen overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 sm:bg-opacity-50 md:bg-opacity-50" onClick={() => setIsOpen(false)} />

                    {/* Modal Container - Responsive sizing with safe boundaries */}
                    <div className="absolute right-0 top-0 sm:right-4 sm:top-16 w-full h-full sm:w-[768px] sm:h-[600px] md:w-[768px] md:h-[600px] lg:w-[768px] lg:h-[600px] bg-white rounded-none sm:rounded-lg shadow-xl border-0 sm:border border-gray-200 flex flex-col max-h-screen overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900">Admin Support</h3>
                                <p className="text-xs sm:text-sm text-gray-500 truncate">
                                    Get help with any issue - documents, deliveries, earnings, or emergencies
                                </p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender === 'driver' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className="flex flex-col max-w-[85%]">
                                        {/* Sender label */}
                                        <div className={`text-xs mb-1 ${msg.sender === 'driver' ? 'text-right text-green-600' : 'text-left text-gray-500'}`}>
                                            {msg.sender === 'driver' ? 'You' : `${msg.adminName || 'Admin'}`}
                                        </div>
                                        <div
                                            className={`px-3 py-2 rounded-lg ${msg.sender === 'driver'
                                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                                                : 'bg-gray-100 text-gray-900'
                                                }`}
                                        >
                                            {msg.imageUrl && (
                                                <div className="mb-2">
                                                    <img
                                                        src={msg.imageUrl}
                                                        alt="Message attachment"
                                                        className="max-w-full h-auto rounded-lg cursor-pointer border border-gray-200"
                                                        style={{ maxWidth: '300px', maxHeight: '300px' }}
                                                        onClick={() => window.open(msg.imageUrl, '_blank')}
                                                        onError={(e) => {
                                                            console.error('❌ Image failed to load:', msg.imageUrl);
                                                            e.target.style.display = 'none';
                                                        }}
                                                        onLoad={() => {
                                                            console.log('✅ Image loaded successfully:', msg.imageUrl);
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            {msg.message && (
                                                <p className="text-sm break-words">{msg.message}</p>
                                            )}
                                            <p className={`text-xs mt-1 ${msg.sender === 'driver' ? 'text-green-100' : 'text-gray-500'}`}>
                                                {formatTime(msg.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input - Fixed Size Container */}
                        <div className="flex-shrink-0 p-3 sm:p-4 border-t border-gray-200 bg-white">
                            <div className="flex items-end space-x-2 max-w-full">
                                <div className="flex-shrink-0">
                                    <MessageImageUpload
                                        onImageSelect={handleImageSelect}
                                        onImageRemove={handleImageRemove}
                                        isUploading={isUploadingImage}
                                        resetTrigger={imageUploadResetTrigger}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Type your message..."
                                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                        style={{
                                            minHeight: '40px',
                                            maxHeight: '40px',
                                            height: '40px'
                                        }}
                                        disabled={isSending || isUploadingImage}
                                    />
                                </div>
                                <div className="flex-shrink-0">
                                    <button
                                        onClick={sendMessage}
                                        disabled={(!message.trim() && !selectedImage) || isSending || isUploadingImage}
                                        className="px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                                        style={{
                                            minHeight: '40px',
                                            maxHeight: '40px',
                                            height: '40px'
                                        }}
                                    >
                                        <PaperAirplaneIcon className="h-4 w-4" />
                                        <span className="hidden sm:inline">Send</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DriverMessageToAdmin;
