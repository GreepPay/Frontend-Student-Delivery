import React, { useState, useEffect, useRef } from 'react';
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './ToastProvider';
import apiService from '../../services/api';
import socketService from '../../services/socketService';
import soundService from '../../services/soundService';
import MessageImageUpload from './MessageImageUpload';
import messageImageService from '../../services/messageImageService';

const AdminMessaging = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const [lastMessageTime, setLastMessageTime] = useState(0);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [imageUploadResetTrigger, setImageUploadResetTrigger] = useState(0);
    const messagesEndRef = useRef(null);
    const { user } = useAuth();
    const { showError } = useToast();

    useEffect(() => {
        console.log('💬 AdminMessaging: Component mounted/updated, user:', user);
        // Load messages from API
        const loadMessages = async () => {
            try {
                const response = await apiService.getMessageHistory(1, 50);
                if (response.success && response.data.messages && response.data.messages.length > 0) {
                    // Ensure timestamps are properly converted to Date objects and sender field is correct
                    const processedMessages = response.data.messages.map(msg => {
                        // Determine sender based on senderType or other fields
                        let sender = 'driver'; // Default to driver
                        if (msg.senderType === 'admin' || msg.sender === 'admin') {
                            sender = 'admin';
                        } else if (msg.senderType === 'driver' || msg.sender === 'driver') {
                            sender = 'driver';
                        }

                        console.log('💬 AdminMessaging: Processing message from API:', {
                            id: msg._id || msg.id,
                            message: msg.message?.substring(0, 30) + '...',
                            senderType: msg.senderType,
                            sender: msg.sender,
                            finalSender: sender
                        });

                        return {
                            ...msg,
                            sender: sender,
                            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
                            imageUrl: msg.imageUrl // Ensure imageUrl is preserved
                        };
                    });
                    setMessages(processedMessages);
                    console.log('💬 AdminMessaging: Loaded', processedMessages.length, 'messages from API');
                    console.log('💬 AdminMessaging: Message senders:', processedMessages.map(m => ({ id: m.id, sender: m.sender, senderType: m.senderType, message: m.message.substring(0, 20) + '...' })));
                } else {
                    // Start with empty messages array - no fallback messages
                    setMessages([]);
                    console.log('💬 AdminMessaging: No messages found, starting with empty array');
                }
            } catch (error) {
                console.log('💬 AdminMessaging: Could not load message history:', error);
                setMessages([]);
            }
        };

        // Load unread count
        const loadUnreadCount = async () => {
            try {
                const response = await apiService.getUnreadMessageCount();
                if (response.success && response.data.unreadCount !== undefined) {
                    setUnreadCount(response.data.unreadCount);
                } else {
                    setUnreadCount(0);
                }
            } catch (error) {
                console.log('💬 AdminMessaging: Could not load unread count:', error);
                setUnreadCount(0);
            }
        };

        loadMessages();
        loadUnreadCount();
    }, [user]);

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Real-time message handling
    useEffect(() => {
        console.log('💬 AdminMessaging: Setting up real-time message handling, user:', user);
        const handleDriverMessage = (data) => {
            console.log('💬 AdminMessaging: ===== HANDLE DRIVER MESSAGE CALLED =====');
            console.log('💬 AdminMessaging: Received driver message:', data);

            // Skip messages from the current user to prevent echo
            if (data.isFromSender || (data.driverId && data.driverId === (user._id || user.id))) {
                console.log('💬 AdminMessaging: Skipping message from sender to prevent echo');
                return;
            }

            const message = {
                id: data._id || data.id || Date.now() + Math.random(), // Use backend ID if available
                sender: 'driver',
                message: data.message,
                timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
                read: false,
                type: data.type || 'general',
                location: data.location,
                imageUrl: data.imageUrl,
                driverId: data.driverId,
                driverName: data.driverName || 'Driver'
            };

            console.log('💬 AdminMessaging: Processed driver message:', message);

            // Check if message already exists to prevent duplicates
            setMessages(prev => {
                const exists = prev.some(msg =>
                    msg.id === message.id ||
                    (msg.message === message.message &&
                        msg.sender === message.sender &&
                        Math.abs(new Date(msg.timestamp) - new Date(message.timestamp)) < 5000) // Within 5 seconds
                );

                if (exists) {
                    console.log('💬 AdminMessaging: Duplicate message detected, skipping:', message);
                    return prev;
                }

                return [...prev, message];
            });

            setUnreadCount(prev => prev + 1);

            // Play sound notification for new messages
            if (data.type === 'emergency') {
                soundService.playSound('alert');
                showError(`🚨 Emergency from ${data.driverName}: ${data.message}`, 8000);
            } else {
                soundService.playSound('notification');
            }
        };

        const handleNewMessage = (data) => {
            console.log('💬 AdminMessaging: Received new message:', data);

            const message = {
                id: data._id || data.id || Date.now() + Math.random(),
                sender: 'driver',
                message: data.message,
                timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
                read: false,
                type: 'general',
                driverId: data.senderId,
                driverName: data.senderName || data.senderType || 'Driver'
            };

            // Check if message already exists to prevent duplicates
            setMessages(prev => {
                const exists = prev.some(msg =>
                    msg.id === message.id ||
                    (msg.message === message.message &&
                        msg.sender === message.sender &&
                        Math.abs(new Date(msg.timestamp) - new Date(message.timestamp)) < 5000) // Within 5 seconds
                );

                if (exists) {
                    console.log('💬 AdminMessaging: Duplicate new message detected, skipping:', message);
                    return prev;
                }

                return [...prev, message];
            });

            setUnreadCount(prev => prev + 1);

            // Play sound notification for new messages
            soundService.playSound('notification');
        };

        const handleAdminMessage = (data) => {
            console.log('💬 AdminMessaging: Received admin message:', data);

            const message = {
                id: data._id || data.id || Date.now() + Math.random(),
                sender: 'admin', // ✅ Ensure admin messages are marked as 'admin'
                message: data.message,
                timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
                read: true, // Admin messages are read by default
                type: data.type || 'general',
                location: data.location
            };

            console.log('💬 AdminMessaging: Processed admin message:', message);

            // Check if message already exists to prevent duplicates
            setMessages(prev => {
                const exists = prev.some(msg =>
                    msg.id === message.id ||
                    (msg.message === message.message &&
                        msg.sender === message.sender &&
                        Math.abs(new Date(msg.timestamp) - new Date(message.timestamp)) < 5000)
                );

                if (exists) {
                    console.log('💬 AdminMessaging: Duplicate admin message detected, skipping:', message);
                    return prev;
                }

                return [...prev, message];
            });
        };

        const handleTyping = (isTyping) => {
            setIsTyping(isTyping);
        };

        // Listen for real-time messages from drivers
        console.log('💬 AdminMessaging: Checking socket connection:', socketService.isConnected());
        if (socketService.isConnected()) {
            console.log('💬 AdminMessaging: Setting up message listeners');
            socketService.on('driver-message', handleDriverMessage);
            socketService.on('new-message', handleNewMessage);
            socketService.on('admin-message', handleAdminMessage);
            socketService.on('admin-typing', handleTyping);

            // Add debugging for all WebSocket events
            console.log('💬 AdminMessaging: WebSocket listeners registered for: driver-message, new-message, admin-message, admin-typing');

            // Listen for new-notification events that might contain driver messages
            console.log('💬 AdminMessaging: Setting up new-notification listener');
            socketService.on('new-notification', (data) => {
                console.log('💬 AdminMessaging: Received new-notification event:', data);
                if (data._routeToMessaging ||
                    data.type === 'driver-message' ||
                    data.senderType === 'driver' ||
                    data.message?.includes('Message from') ||
                    data.message?.toLowerCase().includes('are you sur') ||
                    data.message?.toLowerCase().includes('hello') ||
                    data.message?.toLowerCase().includes('hey') ||
                    data.message?.toLowerCase().includes('test message') ||
                    data.message?.toLowerCase().includes('how low can you go')) {
                    // Skip messages from the current user to prevent echo
                    if (data.isFromSender || (data.driverId && data.driverId === (user._id || user.id))) {
                        console.log('💬 AdminMessaging: Skipping new-notification message from sender to prevent echo');
                        return;
                    }
                    console.log('💬 AdminMessaging: Processing driver message from new-notification event', data);

                    // Transform the notification data into message format
                    const messageData = {
                        _id: data._id || data.id || Date.now() + Math.random(),
                        message: data.message,
                        timestamp: data.timestamp || data.createdAt || new Date(),
                        senderId: data.senderId || data.driverId,
                        senderName: data.senderName || data.driverName || 'Driver',
                        senderType: 'driver',
                        type: data.type === 'emergency' ? 'emergency' : 'general'
                    };

                    handleDriverMessage(messageData);
                }
            });
        }

        return () => {
            if (socketService.isConnected()) {
                socketService.off('driver-message', handleDriverMessage);
                socketService.off('new-message', handleNewMessage);
                socketService.off('admin-message', handleAdminMessage);
                socketService.off('admin-typing', handleTyping);
                socketService.off('new-notification');
            }
        };
    }, [showError, user]);

    const handleImageSelect = (imageFile) => {
        setSelectedImage(imageFile);
    };

    const handleImageRemove = () => {
        setSelectedImage(null);
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() && !selectedImage) return;

        // Debouncing: Prevent multiple rapid calls (minimum 1 second between messages)
        const now = Date.now();
        if (now - lastMessageTime < 1000) {
            console.log('⏱️ Message debounced - too soon after last message');
            return;
        }
        setLastMessageTime(now);

        const messageText = newMessage.trim();
        const isEmergency = messageText.toLowerCase().includes('emergency') ||
            messageText.toLowerCase().includes('urgent') ||
            messageText.toLowerCase().includes('help') ||
            messageText.toLowerCase().includes('accident');

        setIsLoading(true);
        try {
            // Get current location if available (especially for emergencies)
            let location = null;
            if (navigator.geolocation && isEmergency) {
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
                    console.log('📍 Message location captured:', location);
                } catch (error) {
                    console.warn('⚠️ Could not get location:', error);
                }
            }

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
                    setIsLoading(false);
                    return;
                }
                setIsUploadingImage(false);
            }

            // Create message object first
            const message = {
                id: Date.now(),
                sender: 'admin',
                message: messageText,
                timestamp: new Date(),
                read: true,
                type: isEmergency ? 'emergency' : 'general',
                location: location,
                imageUrl: imageUrl
            };

            console.log('💬 AdminMessaging: Creating message with imageUrl:', imageUrl);
            console.log('💬 AdminMessaging: Full message object:', message);

            // Add message to local state immediately for better UX
            setMessages(prev => [...prev, message]);

            // Send message via the proper messaging API
            try {
                const messagePayload = {
                    type: isEmergency ? 'emergency' : 'general',
                    timestamp: new Date().toISOString()
                };

                // Only include message if it's not empty
                if (messageText && messageText.trim()) {
                    messagePayload.message = messageText.trim();
                }

                // Only include imageUrl if it's not null/undefined
                if (imageUrl) {
                    messagePayload.imageUrl = imageUrl;
                }

                // Only include location if it's a valid object
                if (location && typeof location === 'object') {
                    messagePayload.location = location;
                }

                const response = await apiService.sendMessage(messagePayload);
                console.log('📡 Message sent via messaging API:', response);

                // Update the message with API response data if available
                if (response.success && response.data?.message) {
                    const apiMessage = {
                        ...message,
                        id: response.data.message._id || message.id,
                        timestamp: new Date(response.data.message.createdAt || message.timestamp),
                        imageUrl: response.data.message.imageUrl || message.imageUrl // Preserve imageUrl
                    };

                    // Replace the local message with the API response
                    setMessages(prev => prev.map(msg =>
                        msg.id === message.id ? apiMessage : msg
                    ));
                }
            } catch (apiError) {
                console.log('📡 Messaging API not available, using local message only');
                // Message is already in local state, no need to add again
            }
            setNewMessage('');
            setSelectedImage(null);
            setImageUploadResetTrigger(prev => prev + 1);

            // Emit via socket for real-time delivery (if connected)
            if (socketService.isConnected()) {
                socketService.emit('new-message', {
                    ...message,
                    adminId: user._id || user.id,
                    adminName: user.name || 'Admin',
                    senderType: 'admin',
                    isFromSender: true // Flag to prevent echo
                });
                console.log('🔌 Admin message sent via WebSocket');
            } else {
                console.log('⚠️ WebSocket not connected, message stored locally');
            }

        } catch (error) {
            console.error('Error sending message:', error);
            showError('Failed to send message. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Mark messages as read when messaging interface is opened
    const handleOpenMessaging = () => {
        setIsOpen(true);

        // Mark unread messages as read
        const unreadMessages = messages.filter(msg => !msg.read && msg.sender === 'driver');
        if (unreadMessages.length > 0) {
            const unreadIds = unreadMessages.map(msg => msg.id);

            // Update local state immediately
            setMessages(prev => prev.map(msg =>
                unreadIds.includes(msg.id) ? { ...msg, read: true } : msg
            ));
            setUnreadCount(0);

            // Mark as read in backend
            apiService.markMessagesAsRead(unreadIds).catch(error => {
                console.log('💬 AdminMessaging: Could not mark messages as read:', error);
            });
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (timestamp) => {
        try {
            // Handle different timestamp formats
            let date;
            if (timestamp instanceof Date) {
                date = timestamp;
            } else if (typeof timestamp === 'string') {
                date = new Date(timestamp);
            } else if (typeof timestamp === 'number') {
                date = new Date(timestamp);
            } else {
                // Fallback to current time if timestamp is invalid
                date = new Date();
            }

            // Check if the date is valid
            if (isNaN(date.getTime())) {
                date = new Date(); // Fallback to current time
            }

            return new Intl.DateTimeFormat('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).format(date);
        } catch (error) {
            console.warn('Error formatting timestamp:', error, 'timestamp:', timestamp);
            // Return current time as fallback
            return new Intl.DateTimeFormat('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).format(new Date());
        }
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

                    {/* Modal Container - Responsive sizing */}
                    <div className="absolute right-0 top-0 sm:right-4 sm:top-16 w-full h-full sm:w-[768px] sm:h-[600px] md:w-[768px] md:h-[600px] lg:w-[768px] lg:h-[600px] bg-white rounded-none sm:rounded-lg shadow-xl border-0 sm:border border-gray-200 flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900">Admin Support</h3>
                                <p className="text-xs sm:text-sm text-gray-500 truncate">
                                    {isTyping ? 'Admin is typing...' : 'Get help with any issue - documents, deliveries, earnings, or emergencies'}
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
                        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 text-gray-900 px-3 sm:px-4 py-2 rounded-lg max-w-xs sm:max-w-md">
                                        <div className="flex items-center space-x-1">
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            </div>
                                            <span className="text-xs text-gray-500 ml-2">Admin is typing...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className="flex flex-col max-w-[85%] sm:max-w-xs lg:max-w-md">
                                        {/* Sender label */}
                                        <div className={`text-xs mb-1 ${message.sender === 'admin' ? 'text-right text-green-600' : 'text-left text-gray-500'}`}>
                                            {message.sender === 'admin' ? 'You' : `${message.driverName || 'Driver'}`}
                                        </div>
                                        <div
                                            className={`px-3 sm:px-4 py-2 rounded-lg ${message.sender === 'admin'
                                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                                                : 'bg-gray-100 text-gray-900'
                                                }`}
                                        >
                                            {message.imageUrl && (
                                                <div className="mb-2">
                                                    <img
                                                        src={message.imageUrl}
                                                        alt="Message attachment"
                                                        className="max-w-full h-auto rounded-lg cursor-pointer border border-gray-200"
                                                        style={{ maxWidth: '300px', maxHeight: '300px' }}
                                                        onClick={() => window.open(message.imageUrl, '_blank')}
                                                        onError={(e) => {
                                                            console.error('❌ Image failed to load:', message.imageUrl);
                                                            e.target.style.display = 'none';
                                                        }}
                                                        onLoad={() => {
                                                            console.log('✅ Image loaded successfully:', message.imageUrl);
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            {message.message && (
                                                <p className="text-sm break-words">{message.message}</p>
                                            )}
                                            <p
                                                className={`text-xs mt-1 ${message.sender === 'admin'
                                                    ? 'text-green-100'
                                                    : 'text-gray-500'
                                                    }`}
                                            >
                                                {formatTime(message.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-3 sm:p-4 border-t border-gray-200">
                            <div className="flex space-x-2">
                                <MessageImageUpload
                                    onImageSelect={handleImageSelect}
                                    onImageRemove={handleImageRemove}
                                    isUploading={isUploadingImage}
                                    resetTrigger={imageUploadResetTrigger}
                                />
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type your message..."
                                    className="flex-1 px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    disabled={isLoading || isUploadingImage}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={(!newMessage.trim() && !selectedImage) || isLoading || isUploadingImage}
                                    className="px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1 flex-shrink-0"
                                >
                                    <PaperAirplaneIcon className="h-4 w-4" />
                                    <span className="hidden sm:inline">Send</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminMessaging;
