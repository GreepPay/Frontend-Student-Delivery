import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    ChatBubbleLeftRightIcon,
    PaperAirplaneIcon,
    XMarkIcon,
    UserIcon,
    ClockIcon,
    CheckIcon,
    ExclamationTriangleIcon,
    UserPlusIcon,
    CheckCircleIcon,
    ArchiveBoxIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './ToastProvider';
import apiService from '../../services/api';
import socketService from '../../services/socketService';
import soundService from '../../services/soundService';
import pwaService from '../../services/pwaService';
import ConfirmationModal from './ConfirmationModal';
import MessageImageUpload from './MessageImageUpload';
import messageImageService from '../../services/messageImageService';

const MultiDriverMessaging = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [lastMessageTime, setLastMessageTime] = useState(0);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [imageUploadResetTrigger, setImageUploadResetTrigger] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState(null);
    const messagesEndRef = useRef(null);
    const { user } = useAuth();
    const { showError } = useToast();

    // Load conversations list
    const loadConversations = useCallback(async () => {
        try {
            console.log('💬 MultiDriverMessaging: Loading conversations...');
            const response = await apiService.getConversations();
            console.log('💬 MultiDriverMessaging: Raw API response:', response);
            console.log('💬 MultiDriverMessaging: API response details:', {
                success: response.success,
                hasData: !!response.data,
                hasConversations: !!response.data?.conversations,
                conversationCount: response.data?.conversations?.length || 0,
                responseKeys: Object.keys(response),
                dataKeys: response.data ? Object.keys(response.data) : [],
                fullData: response.data,
                conversations: response.data?.conversations?.map(c => ({
                    id: c._id,
                    driverId: c.driverId,
                    driverName: c.driverName,
                    status: c.status,
                    lastMessage: c.lastMessage
                }))
            });

            // Debug: Log the actual data structure
            console.log('💬 MultiDriverMessaging: ===== DETAILED DATA STRUCTURE =====');
            console.log('💬 MultiDriverMessaging: Full response.data:', response.data);
            console.log('💬 MultiDriverMessaging: Data keys:', response.data ? Object.keys(response.data) : 'No data');
            if (response.data) {
                Object.keys(response.data).forEach(key => {
                    console.log(`💬 MultiDriverMessaging: data.${key}:`, response.data[key]);
                });
            }

            // Try different possible conversation field names (including paginated responses)
            const conversations = response.data?.conversations ||
                response.data?.docs ||  // Paginated response
                response.data?.data?.conversations ||
                response.data?.conversationList ||
                response.data?.conversationData ||
                response.data?.results ||
                response.data?.items ||
                [];

            console.log('💬 MultiDriverMessaging: Found conversations in:', {
                'data.conversations': !!response.data?.conversations,
                'data.docs': !!response.data?.docs,  // Paginated response
                'data.data.conversations': !!response.data?.data?.conversations,
                'data.conversationList': !!response.data?.conversationList,
                'data.conversationData': !!response.data?.conversationData,
                'data.results': !!response.data?.results,
                'data.items': !!response.data?.items,
                'finalConversations': conversations,
                'conversationCount': conversations.length
            });

            if (response.success && conversations && conversations.length > 0) {
                // Debug: Log raw conversation data
                console.log('💬 MultiDriverMessaging: Raw conversation data:', conversations);
                conversations.forEach((conv, index) => {
                    console.log(`💬 MultiDriverMessaging: Conversation ${index}:`, {
                        _id: conv._id,
                        driverId: conv.driverId,
                        driverIdType: typeof conv.driverId,
                        driver: conv.driver,
                        driverType: typeof conv.driver,
                        driverName: conv.driverName,
                        driverNameType: typeof conv.driverName
                    });

                    // Debug driver object structure
                    if (typeof conv.driverId === 'object' && conv.driverId) {
                        console.log(`💬 MultiDriverMessaging: driverId object keys:`, Object.keys(conv.driverId));
                        console.log(`💬 MultiDriverMessaging: driverId object:`, conv.driverId);
                    }
                    if (typeof conv.driver === 'object' && conv.driver) {
                        console.log(`💬 MultiDriverMessaging: driver object keys:`, Object.keys(conv.driver));
                        console.log(`💬 MultiDriverMessaging: driver object:`, conv.driver);
                    }
                });

                // Transform backend conversation data to match frontend expectations
                // Filter out resolved and archived conversations from the main list
                const activeConversations = conversations.filter(conv =>
                    conv.status !== 'resolved' && conv.status !== 'archived'
                );

                const transformedConversations = activeConversations.map(conv => {
                    // Handle driverId - it might be an object or string
                    const driverId = typeof conv.driverId === 'object' ? conv.driverId?._id || conv.driverId?.id : conv.driverId;

                    // Handle driver object - extract name and profile picture with comprehensive fallbacks
                    let driverName = 'Unknown Driver';
                    if (conv.driverName) {
                        driverName = conv.driverName;
                    } else if (typeof conv.driver === 'object' && conv.driver) {
                        driverName = conv.driver.fullName ||
                            conv.driver.name ||
                            conv.driver.fullNameComputed ||
                            conv.driver.email ||
                            'Unknown Driver';
                    } else if (typeof conv.driver === 'string') {
                        driverName = conv.driver;
                    }

                    // Handle driverId object case - extract name from driverId if it's an object
                    if (typeof conv.driverId === 'object' && conv.driverId && driverName === 'Unknown Driver') {
                        driverName = conv.driverId.fullName ||
                            conv.driverId.name ||
                            conv.driverId.fullNameComputed ||
                            conv.driverId.email ||
                            'Unknown Driver';
                    }

                    const driverProfilePicture = (typeof conv.driver === 'object' ? conv.driver?.profilePicture || conv.driver?.profileImage : null) ||
                        (typeof conv.driverId === 'object' ? conv.driverId?.profilePicture || conv.driverId?.profileImage : null) ||
                        conv.profilePicture;

                    return {
                        id: conv._id,
                        driverId: driverId,
                        driverName: driverName,
                        driverProfilePicture: driverProfilePicture,
                        lastMessage: conv.lastMessage,
                        lastMessageTime: conv.lastMessageTime || conv.updatedAt,
                        unreadCount: conv.adminUnreadCount || 0,
                        status: conv.status || 'active',
                        priority: conv.priority || 'normal',
                        assignedAdmin: conv.assignedAdmin,
                        createdAt: conv.createdAt
                    };
                });
                setConversations(transformedConversations);
                console.log('💬 MultiDriverMessaging: Loaded conversations:', transformedConversations);
                console.log('💬 MultiDriverMessaging: Final driver names:', transformedConversations.map(c => ({
                    id: c.id,
                    driverId: c.driverId,
                    driverName: c.driverName,
                    profilePicture: c.driverProfilePicture,
                    hasProfilePicture: !!c.driverProfilePicture
                })));
                console.log('💬 MultiDriverMessaging: Conversation lastMessage types:', transformedConversations.map(c => ({
                    driverName: c.driverName,
                    lastMessage: c.lastMessage,
                    lastMessageType: typeof c.lastMessage,
                    lastMessageIsObject: typeof c.lastMessage === 'object'
                })));

                // If we have a saved active conversation but it's not in the loaded conversations, add it
                const savedActiveConversation = localStorage.getItem('activeConversation');
                if (savedActiveConversation && transformedConversations.length === 0) {
                    try {
                        const parsedConversation = JSON.parse(savedActiveConversation);
                        console.log('💬 MultiDriverMessaging: Adding saved conversation to empty list:', parsedConversation);
                        setConversations([parsedConversation]);
                    } catch (error) {
                        console.error('💬 MultiDriverMessaging: Error parsing saved conversation:', error);
                    }
                }
            } else {
                console.log('💬 MultiDriverMessaging: No conversations found or API error. Response:', response);
                console.log('💬 MultiDriverMessaging: Response structure:', {
                    success: response.success,
                    hasData: !!response.data,
                    dataKeys: response.data ? Object.keys(response.data) : [],
                    fullResponse: response
                });

                // Try to create a conversation from the active conversation if it exists
                if (activeConversation && activeConversation.id) {
                    console.log('💬 MultiDriverMessaging: Creating conversation from active conversation:', activeConversation);
                    setConversations([activeConversation]);
                } else {
                    setConversations([]);
                }
            }
        } catch (error) {
            console.error('💬 MultiDriverMessaging: Error loading conversations:', error);
            console.error('💬 MultiDriverMessaging: Error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
            // Set empty conversations array on error to prevent UI issues
            setConversations([]);

            // Show user-friendly error message
            if (error.response?.status === 500) {
                showError('Unable to load conversations. Please try again later.');
            } else if (error.response?.status === 401 || error.response?.status === 403) {
                showError('Authentication required. Please log in again.');
            }
        }
    }, [showError, activeConversation]);

    // Load messages for a specific conversation
    const loadMessages = useCallback(async (conversationId) => {
        if (!conversationId) return;

        // Skip loading messages for temporary conversation IDs created on frontend
        if (conversationId.startsWith('temp-')) {
            console.log('💬 MultiDriverMessaging: Skipping message load for temporary conversation:', conversationId);
            setMessages([]);
            return;
        }

        // First try to load messages from localStorage for immediate display
        const messagesKey = `conversation_messages_${conversationId}`;
        const savedMessages = localStorage.getItem(messagesKey);
        if (savedMessages) {
            try {
                const parsedMessages = JSON.parse(savedMessages);
                // Convert timestamp strings back to Date objects
                const processedMessages = parsedMessages.map((msg, index) => ({
                    ...msg,
                    id: msg.id || `local-msg-${index}-${Date.now()}`,
                    timestamp: new Date(msg.timestamp)
                }));
                setMessages(processedMessages);
                console.log('💬 MultiDriverMessaging: Loaded messages from localStorage for conversation:', conversationId, 'Count:', processedMessages.length);
            } catch (error) {
                console.error('💬 MultiDriverMessaging: Error parsing saved messages:', error);
                localStorage.removeItem(messagesKey);
            }
        }

        setIsLoading(true);
        try {
            console.log('💬 MultiDriverMessaging: Loading messages for conversation:', conversationId);
            const response = await apiService.getConversationMessages(conversationId, 1, 50);
            console.log('💬 MultiDriverMessaging: Messages API response:', response);
            console.log('💬 MultiDriverMessaging: API response details:', {
                success: response.success,
                hasData: !!response.data,
                hasMessages: !!response.data?.messages,
                messageCount: response.data?.messages?.length || 0,
                responseKeys: Object.keys(response)
            });

            if (response.success && response.data.messages) {
                // Transform backend message data to match frontend expectations
                const processedMessages = response.data.messages.map((msg, index) => ({
                    id: msg._id || `api-msg-${index}-${Date.now()}`,
                    sender: msg.senderType === 'driver' ? 'driver' : 'admin',
                    message: msg.message,
                    timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
                    read: msg.read || false,
                    type: msg.type || 'general',
                    location: msg.location,
                    driverId: msg.senderType === 'driver' ? msg.senderId : null,
                    driverName: msg.senderType === 'driver' ? msg.senderName : 'Admin',
                    conversationId: msg.conversationId
                }));
                setMessages(processedMessages);
                console.log('💬 MultiDriverMessaging: Loaded messages for conversation:', conversationId, 'Count:', processedMessages.length);
            } else {
                console.log('💬 MultiDriverMessaging: No messages found or API error for conversation:', conversationId);
                setMessages([]);
            }
        } catch (error) {
            console.error('💬 MultiDriverMessaging: Error loading messages:', error);
            console.error('💬 MultiDriverMessaging: Error details:', {
                conversationId,
                error: error.message,
                response: error.response?.data
            });
            setMessages([]);
        } finally {
            setIsLoading(false);
            setSelectedImage(null);
        }
    }, []);

    // Image upload handlers
    const handleImageSelect = (imageFile) => {
        setSelectedImage(imageFile);
    };

    const handleImageRemove = () => {
        setSelectedImage(null);
    };

    // Send message to specific driver
    const handleSendMessage = async () => {
        if ((!newMessage.trim() && !selectedImage) || !activeConversation) return;

        // Debouncing: Prevent multiple rapid calls
        const now = Date.now();
        if (now - lastMessageTime < 1000) {
            console.log('💬 MultiDriverMessaging: Message sent too quickly, skipping');
            return;
        }
        setLastMessageTime(now);

        const messageText = newMessage.trim();
        setNewMessage('');

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
                return;
            }
            setIsUploadingImage(false);
        }

        // Add message to local state immediately
        const tempMessage = {
            id: `temp-${Date.now()}`,
            sender: 'admin',
            message: messageText,
            timestamp: new Date(),
            read: true,
            type: 'general',
            conversationId: activeConversation.id,
            driverId: activeConversation.driverId,
            driverName: activeConversation.driverName,
            isTemporary: true,
            imageUrl: imageUrl
        };

        setMessages(prev => [...prev, tempMessage]);

        try {
            const messagePayload = {
                type: 'general',
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

            const response = await apiService.sendMessageToDriver(activeConversation.driverId, messagePayload);

            if (response.success) {
                // Replace temporary message with real one
                setMessages(prev => prev.map(msg =>
                    msg.id === tempMessage.id
                        ? { ...msg, id: response.data.messageId, isTemporary: false, imageUrl: msg.imageUrl }
                        : msg
                ));

                // Emit typing indicator
                socketService.emit('admin-typing', {
                    driverId: activeConversation.driverId,
                    isTyping: false
                });

                // Emit WebSocket event to notify driver in real-time
                console.log('💬 MultiDriverMessaging: Checking WebSocket connection for admin message...');
                console.log('💬 MultiDriverMessaging: Socket connected?', socketService.isConnected());

                if (socketService.isConnected()) {
                    const messageData = {
                        message: messageText,
                        type: 'general',
                        driverId: activeConversation.driverId,
                        driverName: activeConversation.driverName,
                        conversationId: activeConversation.id,
                        senderType: 'admin',
                        timestamp: new Date().toISOString(),
                        isFromSender: true // Flag to prevent echo
                    };

                    console.log('💬 MultiDriverMessaging: About to emit admin-message event with data:', messageData);
                    socketService.emit('admin-message', messageData);
                    console.log('💬 MultiDriverMessaging: Admin message WebSocket event emitted successfully!');
                } else {
                    console.warn('💬 MultiDriverMessaging: WebSocket not connected, driver will not receive real-time notification');
                }

                soundService.playSound('success');
                console.log('💬 MultiDriverMessaging: Message sent successfully');
            } else {
                // Remove temporary message on failure
                setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
                showError('Failed to send message');
            }
        } catch (error) {
            console.error('💬 MultiDriverMessaging: Error sending message:', error);
            setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
            showError('Failed to send message. Please try again.');
        } finally {
            setSelectedImage(null);
            setImageUploadResetTrigger(prev => prev + 1);
        }
    };

    // Handle key press for message input
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Handle incoming messages
    const handleDriverMessage = useCallback((data) => {
        console.log('💬 MultiDriverMessaging: ===== HANDLE DRIVER MESSAGE CALLED =====');
        console.log('💬 MultiDriverMessaging: ===== WEBSOCKET EVENT RECEIVED =====');
        console.log('💬 MultiDriverMessaging: Received driver message:', data);
        console.log('💬 MultiDriverMessaging: Current user:', user);
        console.log('💬 MultiDriverMessaging: Active conversation:', activeConversation);
        console.log('💬 MultiDriverMessaging: Current messages count:', messages.length);
        console.log('💬 MultiDriverMessaging: Message data structure:', {
            hasMessage: !!data.message,
            hasDriverId: !!data.driverId,
            hasConversationId: !!data.conversationId,
            hasSenderType: !!data.senderType,
            messageType: data.type,
            timestamp: data.timestamp,
            isFromSender: data.isFromSender
        });
        console.log('💬 MultiDriverMessaging: handleDriverMessage function called successfully');

        // Skip messages from the current user to prevent echo
        if (data.isFromSender || (data.driverId && data.driverId === (user._id || user.id))) {
            console.log('💬 MultiDriverMessaging: Skipping message from sender to prevent echo');
            return;
        }

        // Only process messages that are actually from drivers (not from admin)
        if (data.senderType === 'admin' || data.sender === 'admin') {
            console.log('💬 MultiDriverMessaging: Skipping admin message to prevent echo');
            return;
        }

        const message = {
            id: data._id || data.id || Date.now() + Math.random(),
            sender: 'driver',
            message: data.message,
            timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
            read: false,
            type: data.type || 'general',
            location: data.location,
            driverId: data.driverId,
            driverName: data.driverName || 'Driver',
            conversationId: data.conversationId
        };

        // Check if message already exists to prevent duplicates
        setMessages(prev => {
            const exists = prev.some(msg =>
                msg.id === message.id ||
                (msg.message === message.message &&
                    msg.sender === message.sender &&
                    msg.driverId === message.driverId &&
                    Math.abs(new Date(msg.timestamp) - new Date(message.timestamp)) < 5000)
            );

            if (exists) {
                console.log('💬 MultiDriverMessaging: Duplicate message detected, skipping:', message);
                return prev;
            }

            console.log('💬 MultiDriverMessaging: Adding new message to state. Previous count:', prev.length, 'New message:', message);
            const newMessages = [...prev, message];
            console.log('💬 MultiDriverMessaging: New messages count:', newMessages.length);
            return newMessages;
        });

        // Update conversation list with new message or create new conversation
        setConversations(prev => {
            const existingConversation = prev.find(conv => conv.driverId === data.driverId);

            if (existingConversation) {
                // Update existing conversation
                // Only increment unread count if this is not the active conversation
                const shouldIncrementUnread = activeConversation?.driverId !== data.driverId;

                return prev.map(conv =>
                    conv.driverId === data.driverId
                        ? {
                            ...conv,
                            lastMessage: data.message,
                            lastMessageTime: data.timestamp || new Date(),
                            unreadCount: shouldIncrementUnread ? (conv.unreadCount || 0) + 1 : (conv.unreadCount || 0),
                            isActive: conv.driverId === activeConversation?.driverId
                        }
                        : conv
                );
            } else {
                // Create new conversation
                // Only set unread count to 1 if this is not the active conversation
                const shouldSetUnread = activeConversation?.driverId !== data.driverId;

                const newConversation = {
                    id: data.conversationId || `temp-${data.driverId}-${Date.now()}`,
                    driverId: data.driverId,
                    driverName: data.driverName || 'Unknown Driver',
                    lastMessage: data.message,
                    lastMessageTime: data.timestamp || new Date(),
                    unreadCount: shouldSetUnread ? 1 : 0,
                    status: 'active',
                    priority: data.type === 'emergency' ? 'urgent' : 'normal',
                    assignedAdmin: null,
                    createdAt: new Date()
                };

                console.log('💬 MultiDriverMessaging: Creating new conversation:', newConversation);
                return [newConversation, ...prev];
            }
        });

        // Play sound notification
        if (data.type === 'emergency') {
            soundService.playSound('alert');
            showError(`🚨 Emergency from ${data.driverName}: ${data.message}`, 8000);
        } else {
            soundService.playSound('notification');

            // Show push notification with message preview using PWA service
            pwaService.showMessageNotification(data.driverName || 'Driver', data.message);
        }
    }, [user, activeConversation, showError, messages.length]);

    // Handle typing indicators
    const handleTyping = useCallback((data) => {
        if (data.driverId === activeConversation?.driverId) {
            setIsTyping(data.isTyping);
        }
    }, [activeConversation?.driverId]);

    // Select conversation
    const selectConversation = (conversation) => {
        setActiveConversation(conversation);
        loadMessages(conversation.id);

        // Mark messages as read
        if (conversation.unreadCount > 0) {
            apiService.markConversationAsRead(conversation.id);
            setConversations(prev => prev.map(conv =>
                conv.id === conversation.id
                    ? { ...conv, unreadCount: 0 }
                    : conv
            ));
        }
    };

    // Assign conversation to current admin
    const assignConversation = async (conversationId) => {
        try {
            const response = await apiService.assignConversation(conversationId, user._id || user.id);
            if (response.success) {
                loadConversations(); // Refresh conversations list
            } else {
                showError('Failed to assign conversation');
            }
        } catch (error) {
            console.error('Error assigning conversation:', error);
            showError('Failed to assign conversation');
        }
    };

    // Update conversation status
    const updateConversationStatus = async (conversationId, status) => {
        try {
            const response = await apiService.updateConversationStatus(conversationId, status);
            if (response.success) {

                // If conversation is resolved or archived, close it and remove from active conversation
                if (status === 'resolved' || status === 'archived') {
                    // Close the conversation if it's currently active
                    if (activeConversation && activeConversation.id === conversationId) {
                        setActiveConversation(null);
                        setMessages([]);
                        console.log('💬 MultiDriverMessaging: Closed resolved/archived conversation');
                    }
                }

                // Refresh conversations list
                loadConversations();
            } else {
                showError('Failed to update conversation status');
            }
        } catch (error) {
            console.error('Error updating conversation status:', error);
            showError('Failed to update conversation status');
        }
    };

    // Delete conversation
    const deleteConversation = async (conversationId) => {
        setConversationToDelete(conversationId);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteConversation = async () => {
        if (!conversationToDelete) return;

        try {
            const response = await apiService.deleteConversation(conversationToDelete);
            if (response.success) {

                // Close the conversation if it's currently active
                if (activeConversation && activeConversation.id === conversationToDelete) {
                    setActiveConversation(null);
                    setMessages([]);
                    console.log('💬 MultiDriverMessaging: Closed deleted conversation');
                }

                // Refresh conversations list
                loadConversations();
            } else {
                showError('Failed to delete conversation');
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
            showError('Failed to delete conversation');
        } finally {
            setShowDeleteConfirm(false);
            setConversationToDelete(null);
        }
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'waiting': return 'bg-yellow-100 text-yellow-800';
            case 'resolved': return 'bg-blue-100 text-blue-800';
            case 'archived': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Get priority color
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'normal': return 'bg-blue-100 text-blue-800';
            case 'low': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Format time for display
    const formatTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return 'Invalid time';

            const now = new Date();
            const diff = now - date;
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);

            if (minutes < 1) return 'Just now';
            if (minutes < 60) return `${minutes}m ago`;
            if (hours < 24) return `${hours}h ago`;
            if (days < 7) return `${days}d ago`;

            return date.toLocaleDateString('en-US');
        } catch (error) {
            return 'Invalid time';
        }
    };

    // Initialize
    useEffect(() => {
        if (user) {
            loadConversations();

            // Try to restore active conversation from localStorage
            const savedActiveConversation = localStorage.getItem('activeConversation');
            if (savedActiveConversation) {
                try {
                    const parsedConversation = JSON.parse(savedActiveConversation);
                    console.log('💬 MultiDriverMessaging: Restoring active conversation from localStorage:', parsedConversation);
                    setActiveConversation(parsedConversation);

                    // Also restore messages for this conversation
                    const messagesKey = `conversation_messages_${parsedConversation.id}`;
                    const savedMessages = localStorage.getItem(messagesKey);
                    if (savedMessages) {
                        try {
                            const parsedMessages = JSON.parse(savedMessages);
                            const processedMessages = parsedMessages.map((msg, index) => ({
                                ...msg,
                                id: msg.id || `restored-msg-${index}-${Date.now()}`,
                                timestamp: new Date(msg.timestamp)
                            }));
                            setMessages(processedMessages);
                            console.log('💬 MultiDriverMessaging: Restored messages from localStorage for conversation:', parsedConversation.id, 'Count:', processedMessages.length);
                        } catch (error) {
                            console.error('💬 MultiDriverMessaging: Error parsing saved messages:', error);
                            localStorage.removeItem(messagesKey);
                        }
                    }
                } catch (error) {
                    console.error('💬 MultiDriverMessaging: Error parsing saved conversation:', error);
                    localStorage.removeItem('activeConversation');
                }
            }
        }
    }, [user, loadConversations]);

    // Reload conversations when modal opens
    useEffect(() => {
        if (isOpen && user) {
            console.log('💬 MultiDriverMessaging: Modal opened, reloading conversations...');
            loadConversations();
        }
    }, [isOpen, user, loadConversations]);

    // Debug: Log when conversations change
    useEffect(() => {
        console.log('💬 MultiDriverMessaging: Conversations updated:', {
            count: conversations.length,
            conversations: conversations.map(c => ({
                id: c.id,
                driverName: c.driverName,
                unreadCount: c.unreadCount,
                lastMessage: c.lastMessage
            }))
        });
    }, [conversations]);

    // Debug: Log when active conversation changes
    useEffect(() => {
        console.log('💬 MultiDriverMessaging: Active conversation changed:', {
            hasActiveConversation: !!activeConversation,
            activeConversationId: activeConversation?.id,
            activeConversationDriver: activeConversation?.driverName
        });

        // Save active conversation to localStorage for persistence
        if (activeConversation) {
            localStorage.setItem('activeConversation', JSON.stringify(activeConversation));
            console.log('💬 MultiDriverMessaging: Saved active conversation to localStorage');
        } else {
            localStorage.removeItem('activeConversation');
            console.log('💬 MultiDriverMessaging: Removed active conversation from localStorage');
        }
    }, [activeConversation]);

    // Save messages to localStorage for persistence (with debouncing to avoid interference)
    useEffect(() => {
        if (activeConversation && messages.length > 0) {
            // Debounce the save operation to avoid interfering with real-time updates
            const timeoutId = setTimeout(() => {
                const messagesKey = `conversation_messages_${activeConversation.id}`;
                localStorage.setItem(messagesKey, JSON.stringify(messages));
                console.log('💬 MultiDriverMessaging: Saved messages to localStorage for conversation:', activeConversation.id, 'Count:', messages.length);
            }, 1000); // 1 second delay

            return () => clearTimeout(timeoutId);
        }
    }, [messages, activeConversation]);

    // Handle Escape key to close modal
    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isOpen]);

    // WebSocket setup
    useEffect(() => {
        if (!user) return;

        console.log('💬 MultiDriverMessaging: ===== SETTING UP WEBSOCKET LISTENERS =====');
        console.log('💬 MultiDriverMessaging: Socket connected?', socketService.isConnected());
        console.log('💬 MultiDriverMessaging: User:', user);
        console.log('💬 MultiDriverMessaging: Socket service:', socketService);
        console.log('💬 MultiDriverMessaging: Socket object:', socketService.getSocket());
        console.log('💬 MultiDriverMessaging: User ID:', user?._id || user?.id);
        console.log('💬 MultiDriverMessaging: User type:', user?.userType || user?.role);

        if (socketService.isConnected()) {
            console.log('💬 MultiDriverMessaging: Registering driver-message listener');
            socketService.on('driver-message', handleDriverMessage);
            socketService.on('driver-typing', handleTyping);

            // Add direct socket listener for debugging (bypass socketService wrapper)
            const directSocket = socketService.getSocket();
            if (directSocket) {
                console.log('💬 MultiDriverMessaging: Adding direct socket listeners for debugging');

                // Listen for all events on the direct socket
                directSocket.onAny((eventName, ...args) => {
                    console.log('💬 MultiDriverMessaging: ===== DIRECT SOCKET EVENT =====');
                    console.log('💬 MultiDriverMessaging: Event name:', eventName);
                    console.log('💬 MultiDriverMessaging: Event args:', args);
                    if (eventName === 'driver-message') {
                        console.log('💬 MultiDriverMessaging: ===== DRIVER MESSAGE EVENT RECEIVED ON DIRECT SOCKET! =====', args);
                    }
                });

                // Also listen specifically for driver-message on direct socket
                directSocket.on('driver-message', (data) => {
                    console.log('💬 MultiDriverMessaging: ===== DRIVER MESSAGE ON DIRECT SOCKET =====', data);
                });
            }

            // Test if the listener is actually working
            console.log('💬 MultiDriverMessaging: Testing WebSocket listener registration...');
            const testData = { message: 'test', driverId: 'test', senderType: 'driver' };
            console.log('💬 MultiDriverMessaging: Would call handleDriverMessage with:', testData);

            // Test WebSocket connection status
            console.log('💬 MultiDriverMessaging: WebSocket connection status:', {
                isConnected: socketService.isConnected(),
                isAuthenticated: socketService.isAuthenticated(),
                socketConnected: directSocket?.connected,
                socketId: directSocket?.id,
                socketRooms: directSocket?.rooms
            });

            // Test WebSocket connection by emitting a test event
            console.log('💬 MultiDriverMessaging: Testing WebSocket connection...');
            const socket = socketService.getSocket();
            if (socket) {
                console.log('💬 MultiDriverMessaging: Socket object found:', socket);
                console.log('💬 MultiDriverMessaging: Socket connected:', socket.connected);
                console.log('💬 MultiDriverMessaging: Socket ID:', socket.id);

                // Test basic connection
                socket.emit('test-connection', { from: 'admin', timestamp: new Date().toISOString() });
                console.log('💬 MultiDriverMessaging: Test event emitted');

                // Test if we can receive any events at all
                socket.on('test-response', (data) => {
                    console.log('💬 MultiDriverMessaging: Test response received:', data);
                });

                // Listen for any event to test if socket is working
                socket.onAny((eventName, ...args) => {
                    console.log('💬 MultiDriverMessaging: ANY EVENT RECEIVED:', eventName, args);
                });

            } else {
                console.error('💬 MultiDriverMessaging: No socket available for testing');
            }
        } else {
            console.log('💬 MultiDriverMessaging: Socket not connected, attempting to connect...');
            socketService.connect(user._id || user.id, user.userType || user.role);
        }

        return () => {
            if (socketService.isConnected()) {
                console.log('💬 MultiDriverMessaging: Cleaning up WebSocket listeners');
                socketService.off('driver-message', handleDriverMessage);
                socketService.off('driver-typing', handleTyping);

                // Clean up direct socket listeners
                const directSocket = socketService.getSocket();
                if (directSocket) {
                    directSocket.offAny();
                    directSocket.off('driver-message');
                }
            }
        };
    }, [user, activeConversation, handleDriverMessage, handleTyping]);

    // Add global test function for debugging
    useEffect(() => {
        // Add test function to window for console debugging
        window.testWebSocket = () => {
            console.log('🧪 Testing WebSocket connection...');
            console.log('🧪 SocketService:', socketService);
            console.log('🧪 Socket connected:', socketService.isConnected());
            console.log('🧪 Socket authenticated:', socketService.isAuthenticated());
            console.log('🧪 Direct socket:', socketService.getSocket());
            console.log('🧪 User:', user);

            const socket = socketService.getSocket();
            if (socket) {
                console.log('🧪 Socket object:', socket);
                console.log('🧪 Socket connected:', socket.connected);
                console.log('🧪 Socket ID:', socket.id);
                console.log('🧪 Socket rooms:', socket.rooms);

                // Test emit
                socket.emit('test-event', { message: 'test from frontend' });
                console.log('🧪 Test event emitted');

                // Try to join admin room
                socket.emit('join-admin-room');
                console.log('🧪 Attempted to join admin room');

                // Listen for any response
                socket.on('test-response', (data) => {
                    console.log('🧪 Test response received:', data);
                });

                // Listen for room join confirmation
                socket.on('room-joined', (data) => {
                    console.log('🧪 Room joined:', data);
                });
            } else {
                console.error('🧪 No socket available');
            }
        };

        console.log('🧪 WebSocket test function added to window.testWebSocket()');
    }, [user]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle typing indicator
    const handleTypingChange = (e) => {
        setNewMessage(e.target.value);

        if (activeConversation) {
            socketService.emit('admin-typing', {
                driverId: activeConversation.driverId,
                isTyping: e.target.value.length > 0
            });
        }
    };

    const totalUnreadCount = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

    return (
        <div className="relative">
            {/* Chat Icon with Unread Badge */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
                {totalUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    </span>
                )}
            </button>

            {/* Messaging Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="bg-white rounded-none sm:rounded-lg shadow-xl w-full h-full sm:w-full sm:max-w-6xl sm:h-[80vh] flex flex-col sm:flex-row"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Conversations Sidebar */}
                        <div className="w-full sm:w-1/3 border-r-0 sm:border-r border-gray-200 flex flex-col">
                            <div className="p-3 sm:p-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Driver Conversations</h3>
                                        <p className="text-xs sm:text-sm text-gray-500">Manage messages with drivers</p>
                                    </div>
                                    {/* Mobile: Show close button in sidebar header */}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="sm:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {conversations.length === 0 ? (
                                    <div className="p-3 sm:p-4 text-center text-gray-500">
                                        <UserIcon className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-gray-300" />
                                        <p className="text-sm sm:text-base">No conversations yet</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Driver messages will appear here
                                        </p>
                                    </div>
                                ) : (
                                    conversations.map((conversation) => (
                                        <div
                                            key={conversation.id}
                                            onClick={() => selectConversation(conversation)}
                                            className={`p-3 sm:p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${activeConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3 flex-1">
                                                    {conversation.driverProfilePicture ? (
                                                        <img
                                                            src={conversation.driverProfilePicture}
                                                            alt={conversation.driverName}
                                                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div
                                                        className={`w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold ${conversation.driverProfilePicture ? 'hidden' : ''}`}
                                                    >
                                                        {conversation.driverName?.charAt(0) || 'D'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-1 sm:space-x-2">
                                                            <h4 className="font-medium text-gray-900 truncate capitalize text-sm sm:text-base">
                                                                {conversation.driverName || 'Unknown Driver'}
                                                            </h4>
                                                            <span className={`px-1 sm:px-2 py-1 text-xs rounded-full ${getStatusColor(conversation.status)}`}>
                                                                {conversation.status}
                                                            </span>
                                                            {conversation.priority === 'urgent' && (
                                                                <ExclamationTriangleIcon className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                                                            {typeof conversation.lastMessage === 'string'
                                                                ? conversation.lastMessage
                                                                : conversation.lastMessage?.message || 'No messages yet'}
                                                        </p>
                                                        <div className="flex items-center space-x-1 sm:space-x-2 mt-1">
                                                            <span className={`px-1 sm:px-2 py-1 text-xs rounded-full ${getPriorityColor(conversation.priority)}`}>
                                                                {conversation.priority}
                                                            </span>
                                                            {!conversation.assignedAdmin && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        assignConversation(conversation.id);
                                                                    }}
                                                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                                                >
                                                                    <UserPlusIcon className="h-3 w-3" />
                                                                    <span className="hidden sm:inline">Assign</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400">
                                                        {conversation.lastMessageTime ? formatTime(conversation.lastMessageTime) : ''}
                                                    </p>
                                                    {conversation.unreadCount > 0 && (
                                                        <span className="inline-flex bg-red-500 text-white text-xs rounded-full h-5 w-5 items-center justify-center mt-1">
                                                            {conversation.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Mobile Chat Area - Shows when conversation is selected on mobile */}
                        {activeConversation && (
                            <div className="sm:hidden flex-1 flex flex-col">
                                {/* Mobile Chat Header */}
                                <div className="p-3 border-b border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={() => setActiveConversation(null)}
                                                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                            >
                                                <XMarkIcon className="h-5 w-5" />
                                            </button>
                                            {activeConversation.driverProfilePicture ? (
                                                <img
                                                    src={activeConversation.driverProfilePicture}
                                                    alt={activeConversation.driverName}
                                                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div
                                                className={`w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm ${activeConversation.driverProfilePicture ? 'hidden' : ''}`}
                                            >
                                                {activeConversation.driverName?.charAt(0) || 'D'}
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="font-semibold text-gray-900 capitalize text-sm">
                                                        {activeConversation.driverName || 'Unknown Driver'}
                                                    </h3>
                                                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(activeConversation.status)}`}>
                                                        {activeConversation.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    Driver ID: {activeConversation.driverId}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Messages Area */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                    {isLoading ? (
                                        <div className="text-center text-gray-500">Loading messages...</div>
                                    ) : messages.length === 0 ? (
                                        <div className="text-center text-gray-500">
                                            <ChatBubbleLeftRightIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                            <p className="text-sm">No messages yet. Start a conversation!</p>
                                        </div>
                                    ) : (
                                        messages.map((message) => (
                                            <div
                                                key={message.id || `msg-${Date.now()}`}
                                                className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className="flex flex-col max-w-[85%]">
                                                    {/* Sender label */}
                                                    <div className={`text-xs mb-1 ${message.sender === 'admin' ? 'text-right text-green-600' : 'text-left text-gray-500'}`}>
                                                        {message.sender === 'admin' ? 'You' : `${message.driverName || 'Driver'}`}
                                                    </div>
                                                    <div
                                                        className={`px-3 py-2 rounded-lg ${message.sender === 'admin'
                                                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                                                            : 'bg-gray-100 text-gray-900'
                                                            } ${message.isTemporary ? 'opacity-70' : ''}`}
                                                    >
                                                        {message.imageUrl && (
                                                            <div className="mb-2">
                                                                <img
                                                                    src={message.imageUrl}
                                                                    alt="Message attachment"
                                                                    className="max-w-full h-auto rounded-lg cursor-pointer"
                                                                    onClick={() => window.open(message.imageUrl, '_blank')}
                                                                />
                                                            </div>
                                                        )}
                                                        {message.message && (
                                                            <p className="text-sm break-words">{message.message}</p>
                                                        )}
                                                        <div className={`flex items-center justify-between mt-1 text-xs ${message.sender === 'admin' ? 'text-green-100' : 'text-gray-500'
                                                            }`}>
                                                            <span>{formatTime(message.timestamp)}</span>
                                                            {message.sender === 'admin' && (
                                                                <span className="ml-2">✓</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Mobile Message Input - Fixed Size */}
                                <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-white">
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
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                placeholder="Type your message..."
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                                style={{
                                                    minHeight: '40px',
                                                    maxHeight: '40px',
                                                    height: '40px'
                                                }}
                                                disabled={isLoading || isUploadingImage}
                                            />
                                        </div>
                                        <div className="flex-shrink-0">
                                            <button
                                                onClick={handleSendMessage}
                                                disabled={(!newMessage.trim() && !selectedImage) || isLoading || isUploadingImage}
                                                className="px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                                                style={{
                                                    minHeight: '40px',
                                                    maxHeight: '40px',
                                                    height: '40px'
                                                }}
                                            >
                                                <PaperAirplaneIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Desktop Chat Area */}
                        <div className="hidden sm:flex flex-1 flex-col">
                            {activeConversation ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                {activeConversation.driverProfilePicture ? (
                                                    <img
                                                        src={activeConversation.driverProfilePicture}
                                                        alt={activeConversation.driverName}
                                                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div
                                                    className={`w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold ${activeConversation.driverProfilePicture ? 'hidden' : ''}`}
                                                >
                                                    {activeConversation.driverName?.charAt(0) || 'D'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="font-semibold text-gray-900 capitalize">
                                                            {activeConversation.driverName || 'Unknown Driver'}
                                                        </h3>
                                                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(activeConversation.status)}`}>
                                                            {activeConversation.status}
                                                        </span>
                                                        {activeConversation.priority === 'urgent' && (
                                                            <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500">
                                                        Driver ID: {activeConversation.driverId}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {/* Status Management Buttons */}
                                                <div className="flex items-center space-x-1">
                                                    <button
                                                        onClick={() => updateConversationStatus(activeConversation.id, 'resolved')}
                                                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                                                        title="Mark as resolved"
                                                    >
                                                        <CheckCircleIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateConversationStatus(activeConversation.id, 'waiting')}
                                                        className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded transition-colors"
                                                        title="Mark as waiting"
                                                    >
                                                        <ClockIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateConversationStatus(activeConversation.id, 'archived')}
                                                        className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                                                        title="Archive conversation"
                                                    >
                                                        <ArchiveBoxIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteConversation(activeConversation.id)}
                                                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                                                        title="Delete conversation"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => setIsOpen(false)}
                                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                                >
                                                    <XMarkIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Messages Area */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                        {isLoading ? (
                                            <div className="text-center text-gray-500">Loading messages...</div>
                                        ) : messages.length === 0 ? (
                                            <div className="text-center text-gray-500">
                                                <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                                <p>No messages yet. Start a conversation!</p>
                                            </div>
                                        ) : (
                                            messages.map((message, index) => (
                                                <div
                                                    key={message.id || `msg-${index}-${Date.now()}`}
                                                    className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className="flex flex-col max-w-xs lg:max-w-md">
                                                        {/* Sender label */}
                                                        <div className={`text-xs mb-1 ${message.sender === 'admin' ? 'text-right text-green-600' : 'text-left text-gray-500'}`}>
                                                            {message.sender === 'admin' ? 'You' : `${message.driverName || 'Driver'}`}
                                                        </div>
                                                        <div
                                                            className={`px-4 py-2 rounded-lg ${message.sender === 'admin'
                                                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                                                                : 'bg-gray-100 text-gray-900'
                                                                } ${message.isTemporary ? 'opacity-70' : ''}`}
                                                        >
                                                            {message.imageUrl && (
                                                                <div className="mb-2">
                                                                    <img
                                                                        src={message.imageUrl}
                                                                        alt="Message attachment"
                                                                        className="max-w-full h-auto rounded-lg cursor-pointer"
                                                                        onClick={() => window.open(message.imageUrl, '_blank')}
                                                                    />
                                                                </div>
                                                            )}
                                                            {message.message && (
                                                                <p className="text-sm">{message.message}</p>
                                                            )}
                                                            <div className={`flex items-center justify-between mt-1 text-xs ${message.sender === 'admin' ? 'text-green-100' : 'text-gray-500'
                                                                }`}>
                                                                <span>{formatTime(message.timestamp)}</span>
                                                                {message.sender === 'admin' && (
                                                                    <div className="flex items-center space-x-1">
                                                                        {message.isTemporary ? (
                                                                            <ClockIcon className="h-3 w-3" />
                                                                        ) : (
                                                                            <CheckIcon className="h-3 w-3" />
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}

                                        {/* Typing Indicator */}
                                        {isTyping && (
                                            <div className="flex justify-start">
                                                <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                                                    <div className="flex space-x-1">
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Message Input - Fixed Size Container */}
                                    <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
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
                                                    value={newMessage}
                                                    onChange={handleTypingChange}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSendMessage();
                                                        }
                                                    }}
                                                    placeholder="Type your message..."
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                                    style={{
                                                        minHeight: '40px',
                                                        maxHeight: '40px',
                                                        height: '40px'
                                                    }}
                                                    disabled={isLoading || isUploadingImage}
                                                />
                                            </div>
                                            <div className="flex-shrink-0">
                                                <button
                                                    onClick={handleSendMessage}
                                                    disabled={(!newMessage.trim() && !selectedImage) || isLoading || isUploadingImage}
                                                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                                                    style={{
                                                        minHeight: '40px',
                                                        maxHeight: '40px',
                                                        height: '40px'
                                                    }}
                                                >
                                                    <PaperAirplaneIcon className="h-4 w-4" />
                                                    <span>Send</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-500">
                                    <div className="text-center">
                                        <ChatBubbleLeftRightIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                        <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                                        <p>Choose a driver from the sidebar to start messaging</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false);
                    setConversationToDelete(null);
                }}
                onConfirm={confirmDeleteConversation}
                title="Delete Conversation"
                message="Are you sure you want to delete this conversation? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    );
};

export default MultiDriverMessaging;
