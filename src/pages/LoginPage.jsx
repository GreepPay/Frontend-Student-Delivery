import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, User, Truck, AlertCircle, ChevronLeft, ChevronRight, Instagram, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [userType, setUserType] = useState('admin');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [currentAdIndex, setCurrentAdIndex] = useState(0);
    const { sendOTP } = useAuth();
    const navigate = useNavigate();

    // Enhanced advertisement data with better messaging
    const advertisements = [
        {
            id: 1,
            title: "Earn While You Study",
            subtitle: "GREEP DELIVERY",
            description: "Flexible hours, competitive pay, and the freedom to work around your class schedule. Perfect for students who want to earn money while pursuing their education.",
            image: "/Greep pay Carosel.png",
            requirements: [
                "Flexible schedule to work around classes",
                "Reliable transportation method"
            ],
            cta: "Start earning today with flexible delivery opportunities!",
            contact: {
                instagram: "@greepit",
                phone: "+90 533 832 97 85"
            }
        },
        {
            id: 2,
            title: "Student Delivery Service",
            subtitle: "GREEP DELIVERY",
            description: "Looking for a way to work and make extra money on the side? Do you have a means of transportation (bicycle, scooter, e.t.c)? If you answered yes to all of these, we have something just for you!",
            image: "/Greep pay Carosel.png",
            requirements: [
                "Must be a registered student at any university",
                "Must have a means of transportation"
            ],
            cta: "Join our student delivery service today!",
            contact: {
                instagram: "@greepit",
                phone: "+90 533 832 97 85"
            }
        },
        {
            id: 3,
            title: "Join Our Growing Team",
            subtitle: "GREEP DELIVERY",
            description: "Be part of a community of student drivers who are making a difference in their communities while earning money for their education.",
            image: "/Greep pay Carosel.png",
            requirements: [
                "Student status at any university",
                "Valid transportation (bike, scooter, car)"
            ],
            cta: "Join our community of successful student drivers!",
            contact: {
                instagram: "@greepit",
                phone: "+90 533 832 97 85"
            }
        }
    ];

    // Auto-advance carousel
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentAdIndex((prev) => (prev + 1) % advertisements.length);
        }, 5000); // Change ad every 5 seconds

        return () => clearInterval(interval);
    }, [advertisements.length]);

    // Manual navigation
    const goToAd = (index) => {
        setCurrentAdIndex(index);
    };

    const nextAd = () => {
        setCurrentAdIndex((prev) => (prev + 1) % advertisements.length);
    };

    const prevAd = () => {
        setCurrentAdIndex((prev) => (prev - 1 + advertisements.length) % advertisements.length);
    };

    // Email validation function
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Clear errors when user starts typing
    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        if (errors.email) {
            setErrors(prev => ({ ...prev, email: null }));
        }
    };

    const handleUserTypeChange = (e) => {
        setUserType(e.target.value);
        if (errors.userType) {
            setErrors(prev => ({ ...prev, userType: null }));
        }
    };

    // Enhanced error handling function
    const handleError = (error) => {
        console.error('❌ Login error:', error);

        let errorMessage = 'An unexpected error occurred. Please try again.';
        let errorType = 'general';

        // Handle different types of errors
        if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;

            switch (status) {
                case 400:
                    // Check for specific validation errors
                    if (data?.message?.toLowerCase().includes('email')) {
                        errorMessage = 'Please enter a valid email address.';
                        errorType = 'validation';
                    } else if (data?.message?.toLowerCase().includes('user type')) {
                        errorMessage = 'Please select a valid user type.';
                        errorType = 'validation';
                    } else {
                        errorMessage = data?.message || 'Invalid request. Please check your input.';
                        errorType = 'validation';
                    }
                    break;
                case 401:
                    errorMessage = data?.message || 'Authentication failed. Please check your credentials.';
                    errorType = 'auth';
                    break;
                case 403:
                    if (data?.message?.toLowerCase().includes('suspended')) {
                        errorMessage = 'Your account has been suspended. Please contact support.';
                        errorType = 'suspended';
                    } else if (data?.message?.toLowerCase().includes('blocked')) {
                        errorMessage = 'Your account has been blocked. Please contact support.';
                        errorType = 'blocked';
                    } else {
                        errorMessage = data?.message || 'Access denied. You are not authorized to perform this action.';
                        errorType = 'permission';
                    }
                    break;
                case 404:
                    if (data?.message?.toLowerCase().includes('user') || data?.message?.toLowerCase().includes('not found')) {
                        errorMessage = 'No account found with this email address. Please check your email or create a new account.';
                        errorType = 'userNotFound';
                    } else {
                        errorMessage = data?.message || 'User not found. Please check your email address.';
                        errorType = 'notFound';
                    }
                    break;
                case 409:
                    if (data?.message?.toLowerCase().includes('already exists')) {
                        errorMessage = 'An account with this email already exists. Please try logging in instead.';
                        errorType = 'userExists';
                    } else {
                        errorMessage = data?.message || 'Account conflict. Please try a different email.';
                        errorType = 'conflict';
                    }
                    break;
                case 429:
                    errorMessage = data?.message || 'Request failed. Please try again.';
                    errorType = 'error';
                    break;
                case 500:
                    errorMessage = data?.message || 'Server error. Please try again later.';
                    errorType = 'server';
                    break;
                default:
                    errorMessage = data?.message || `Server error (${status}). Please try again.`;
                    errorType = 'server';
            }
        } else if (error.request) {
            // Network error - no response received
            errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
            errorType = 'network';
        } else if (error.code === 'ERR_NETWORK') {
            // Axios network error
            errorMessage = 'Network error. Please check your connection and try again.';
            errorType = 'network';
        } else if (error.message) {
            // Other errors with message
            if (error.message.toLowerCase().includes('user not found')) {
                errorMessage = 'No account found with this email address. Please check your email or create a new account.';
                errorType = 'userNotFound';
            } else if (error.message.toLowerCase().includes('invalid email')) {
                errorMessage = 'Please enter a valid email address.';
                errorType = 'validation';
            } else if (error.message.toLowerCase().includes('suspended')) {
                errorMessage = 'Your account has been suspended. Please contact support.';
                errorType = 'suspended';
            } else {
                errorMessage = error.message;
                errorType = 'general';
            }
        }

        // Show appropriate toast based on error type
        switch (errorType) {
            case 'validation':
                toast.error(errorMessage, {
                    duration: 5000,
                });
                break;
            case 'auth':
                toast.error(errorMessage, {
                    duration: 4000,
                });
                break;
            case 'permission':
                toast.error(errorMessage, {
                    duration: 4000,
                });
                break;
            case 'userNotFound':
                toast.error(errorMessage, {
                    duration: 6000,
                });
                break;
            case 'userExists':
                toast.error(errorMessage, {
                    duration: 5000,
                });
                break;
            case 'suspended':
                toast.error(errorMessage, {
                    duration: 8000,
                });
                break;
            case 'blocked':
                toast.error(errorMessage, {
                    duration: 8000,
                });
                break;
            case 'conflict':
                toast.error(errorMessage, {
                    duration: 5000,
                });
                break;
            case 'error':
                toast.error(errorMessage, {
                    duration: 6000,
                });
                break;
            case 'network':
                toast.error(errorMessage, {
                    duration: 5000,
                });
                break;
            case 'server':
                toast.error(errorMessage, {
                    duration: 5000,
                });
                break;
            default:
                toast.error(errorMessage, {
                    duration: 4000,
                });
        }

        return { message: errorMessage, type: errorType };
    };

    const handleSubmit = async () => {
        setErrors({});

        // Client-side validation
        const validationErrors = {};

        if (!email.trim()) {
            validationErrors.email = 'Email is required';
        } else if (!validateEmail(email)) {
            validationErrors.email = 'Please enter a valid email address';
        }

        if (!userType) {
            validationErrors.userType = 'Please select a user type';
        }

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.error('Please fix the errors below');
            return;
        }

        setLoading(true);

        try {
            console.log('🔄 Attempting to send OTP...');
            await sendOTP(email.trim(), userType);
            console.log('✅ OTP sent successfully');

            toast.success('OTP sent to your email!', {
                duration: 3000,
            });

            // Navigate to OTP page
            const url = `/verify-otp?email=${encodeURIComponent(email.trim())}&userType=${userType}`;
            console.log('🔄 Navigating to:', url);
            navigate(url);

        } catch (error) {
            const errorInfo = handleError(error);

            // Set specific field errors if applicable
            if (errorInfo.type === 'validation' && error.response?.data?.field) {
                setErrors(prev => ({
                    ...prev,
                    [error.response.data.field]: errorInfo.message
                }));
            } else if (errorInfo.type === 'notFound') {
                setErrors(prev => ({
                    ...prev,
                    email: 'User not found with this email address'
                }));
            }
        } finally {
            setLoading(false);
        }
    };

    const currentAd = advertisements[currentAdIndex];

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Advertisement Carousel */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-800 to-green-900 relative overflow-hidden">
                {/* Carousel Container */}
                <div className="relative w-full h-full">
                    {/* Background Image */}
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{
                            backgroundImage: `url(${currentAd.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        {/* Enhanced overlay for better text readability */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/60"></div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 flex flex-col h-full p-8 text-white">
                        {/* Logo and Title */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-green-300 mb-2">{currentAd.subtitle}</h2>
                            <h1 className="text-5xl font-bold mb-6 leading-tight">{currentAd.title}</h1>
                        </div>

                        {/* Description */}
                        <div className="flex-1 mb-8">
                            <p className="text-xl leading-relaxed mb-8 text-gray-100">{currentAd.description}</p>

                            {/* Enhanced Requirements Box */}
                            <div className="bg-green-800/90 backdrop-blur-sm border-2 border-green-500/50 rounded-xl p-6 mb-8 shadow-2xl">
                                <h3 className="font-bold text-green-300 mb-4 text-lg">REQUIREMENTS</h3>
                                <ul className="space-y-3">
                                    {currentAd.requirements.map((req, index) => (
                                        <li key={index} className="flex items-start">
                                            <span className="text-green-400 mr-3 text-lg">•</span>
                                            <span className="text-base text-gray-100">{req}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Enhanced Call to Action and Contact */}
                        <div className="mb-8">
                            <p className="text-xl font-bold mb-6 text-green-300">{currentAd.cta}</p>
                            <div className="flex items-center space-x-8">
                                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                                    <Instagram className="w-5 h-5 mr-2 text-green-300" />
                                    <span className="text-sm font-medium">{currentAd.contact.instagram}</span>
                                </div>
                                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                                    <Phone className="w-5 h-5 mr-2 text-green-300" />
                                    <span className="text-sm font-medium">{currentAd.contact.phone}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Carousel Navigation */}
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
                        <div className="flex items-center space-x-6">
                            {/* Previous Button */}
                            <button
                                onClick={prevAd}
                                className="p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 shadow-lg"
                            >
                                <ChevronLeft className="w-6 h-6 text-white" />
                            </button>

                            {/* Enhanced Indicators */}
                            <div className="flex space-x-3">
                                {advertisements.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => goToAd(index)}
                                        className={`w-4 h-4 rounded-full transition-all duration-300 shadow-lg ${index === currentAdIndex
                                            ? 'bg-white scale-110'
                                            : 'bg-white/40 hover:bg-white/60 hover:scale-110'
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Next Button */}
                            <button
                                onClick={nextAd}
                                className="p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 shadow-lg"
                            >
                                <ChevronRight className="w-6 h-6 text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 lg:w-1/2 flex items-center justify-center p-4 bg-gray-50">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <img
                            src="/icons/White.png"
                            alt="Logo"
                            className="w-12 h-12 mx-auto mb-4 rounded-lg shadow-sm"
                        />
                        <h1 className="text-2xl font-bold text-gray-900">Student Delivery</h1>
                        <p className="text-gray-600 mt-1">Sign in to continue</p>
                    </div>

                    {/* Form */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className={`absolute left-3 top-3 h-4 w-4 ${errors.email ? 'text-red-400' : 'text-gray-400'}`} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={handleEmailChange}
                                        placeholder="your@email.com"
                                        className={`w-full pl-10 pr-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${errors.email
                                            ? 'border-red-300 focus:ring-red-500'
                                            : 'border-gray-300'
                                            }`}
                                    />
                                </div>
                                {errors.email && (
                                    <div className="flex items-center mt-1 text-sm text-red-600">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.email}
                                    </div>
                                )}
                            </div>

                            {/* User Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    I am a
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Admin */}
                                    <label className="relative">
                                        <input
                                            type="radio"
                                            name="userType"
                                            value="admin"
                                            checked={userType === 'admin'}
                                            onChange={handleUserTypeChange}
                                            className="sr-only"
                                        />
                                        <div className={`
                                            p-3 rounded-md border-2 cursor-pointer transition-all
                                            ${userType === 'admin'
                                                ? 'border-green-500 bg-green-50'
                                                : errors.userType
                                                    ? 'border-red-300 bg-red-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }
                                        `}>
                                            <div className="flex flex-col items-center">
                                                <User className={`h-5 w-5 mb-1 ${userType === 'admin'
                                                    ? 'text-green-600'
                                                    : errors.userType
                                                        ? 'text-red-500'
                                                        : 'text-gray-500'
                                                    }`} />
                                                <span className={`text-sm font-medium ${userType === 'admin'
                                                    ? 'text-green-900'
                                                    : errors.userType
                                                        ? 'text-red-700'
                                                        : 'text-gray-700'
                                                    }`}>
                                                    Admin
                                                </span>
                                            </div>
                                        </div>
                                    </label>

                                    {/* Driver */}
                                    <label className="relative">
                                        <input
                                            type="radio"
                                            name="userType"
                                            value="driver"
                                            checked={userType === 'driver'}
                                            onChange={handleUserTypeChange}
                                            className="sr-only"
                                        />
                                        <div className={`
                                            p-3 rounded-md border-2 cursor-pointer transition-all
                                            ${userType === 'driver'
                                                ? 'border-green-500 bg-green-50'
                                                : errors.userType
                                                    ? 'border-red-300 bg-red-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }
                                        `}>
                                            <div className="flex flex-col items-center">
                                                <Truck className={`h-5 w-5 mb-1 ${userType === 'driver'
                                                    ? 'text-green-600'
                                                    : errors.userType
                                                        ? 'text-red-500'
                                                        : 'text-gray-500'
                                                    }`} />
                                                <span className={`text-sm font-medium ${userType === 'driver'
                                                    ? 'text-green-900'
                                                    : errors.userType
                                                        ? 'text-red-700'
                                                        : 'text-gray-700'
                                                    }`}>
                                                    Driver
                                                </span>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                                {errors.userType && (
                                    <div className="flex items-center mt-1 text-sm text-red-600">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.userType}
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                loading={loading}
                                loadingText="Sending..."
                                fullWidth={true}
                                className="w-full"
                            >
                                Continue
                            </Button>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-xs text-gray-500 mt-6">
                        Secure OTP authentication
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;