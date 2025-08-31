import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../common/Button';

const OTPVerification = () => {
    const [otp, setOtp] = useState('');
    const [timeLeft, setTimeLeft] = useState(60);
    const [isResending, setIsResending] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const { login, sendOTP } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Get email and userType from URL parameters
    const email = searchParams.get('email') || '';
    const userType = searchParams.get('userType') || 'admin';

    // Redirect to login if no email is provided
    useEffect(() => {
        if (!email) {
            console.log('❌ No email found, redirecting to login...');
            toast.error('Email is required. Please try logging in again.');
            navigate('/');
        }
    }, [email, navigate]);

    // Countdown timer
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

    // Auto-focus and auto-advance OTP input
    useEffect(() => {
        const otpInputs = document.querySelectorAll('input[data-otp-input]');
        otpInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const target = e.target;
                if (target.value.length === 1 && index < 5) {
                    const nextInput = otpInputs[index + 1];
                    nextInput?.focus();
                }
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    const prevInput = otpInputs[index - 1];
                    prevInput?.focus();
                }
            });
        });
    }, []);

    const handleOTPChange = (index, value) => {
        const newOTP = otp.split('');

        // Handle paste event - if value is longer than 1 character, it's likely a paste
        if (value.length > 1) {
            // Clean the pasted value to only include digits
            const cleanedValue = value.replace(/\D/g, '').slice(0, 6);

            // Fill the OTP string with the pasted digits
            const pastedOTP = cleanedValue.padEnd(6, '');
            setOtp(pastedOTP);

            // Clear errors when user starts typing
            if (errors.otp) {
                setErrors(prev => ({ ...prev, otp: null }));
            }
            return;
        }

        // Handle single character input
        newOTP[index] = value;
        const otpString = newOTP.join('');
        setOtp(otpString);

        // Clear errors when user starts typing
        if (errors.otp) {
            setErrors(prev => ({ ...prev, otp: null }));
        }
    };

    // Enhanced error handling function
    const handleError = (error, context = 'verification') => {
        console.error(`❌ ${context} error:`, error);

        let errorMessage = 'An unexpected error occurred. Please try again.';
        let errorType = 'general';

        // Handle different types of errors
        if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;

            switch (status) {
                case 400:
                    // Check for specific OTP validation errors
                    if (data?.message?.toLowerCase().includes('otp') || data?.message?.toLowerCase().includes('code')) {
                        if (data?.message?.toLowerCase().includes('invalid')) {
                            errorMessage = 'Invalid OTP code. Please check the code and try again.';
                            errorType = 'invalidOTP';
                        } else if (data?.message?.toLowerCase().includes('expired')) {
                            errorMessage = 'OTP code has expired. Please request a new code.';
                            errorType = 'expiredOTP';
                        } else if (data?.message?.toLowerCase().includes('wrong')) {
                            errorMessage = 'Incorrect OTP code. Please check the code and try again.';
                            errorType = 'wrongOTP';
                        } else {
                            errorMessage = 'Invalid OTP code. Please check the code and try again.';
                            errorType = 'invalidOTP';
                        }
                    } else if (data?.message?.toLowerCase().includes('email')) {
                        errorMessage = 'Please enter a valid email address.';
                        errorType = 'validation';
                    } else {
                        errorMessage = data?.message || 'Invalid request. Please check your input.';
                        errorType = 'validation';
                    }
                    break;
                case 401:
                    if (data?.message?.toLowerCase().includes('expired')) {
                        errorMessage = 'Your session has expired. Please log in again.';
                        errorType = 'sessionExpired';
                    } else {
                        errorMessage = data?.message || 'Authentication failed. Please try again.';
                        errorType = 'auth';
                    }
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
                    if (data?.message?.toLowerCase().includes('already verified')) {
                        errorMessage = 'This OTP has already been used. Please request a new code.';
                        errorType = 'alreadyUsed';
                    } else {
                        errorMessage = data?.message || 'OTP conflict. Please request a new code.';
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
            } else if (error.message.toLowerCase().includes('invalid otp') || error.message.toLowerCase().includes('wrong otp')) {
                errorMessage = 'Invalid OTP code. Please check the code and try again.';
                errorType = 'invalidOTP';
            } else if (error.message.toLowerCase().includes('expired otp')) {
                errorMessage = 'OTP code has expired. Please request a new code.';
                errorType = 'expiredOTP';
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
            case 'invalidOTP':
                toast.error(errorMessage, {
                    duration: 5000,
                });
                break;
            case 'expiredOTP':
                toast.error(errorMessage, {
                    duration: 5000,
                });
                break;
            case 'wrongOTP':
                toast.error(errorMessage, {
                    duration: 5000,
                });
                break;
            case 'alreadyUsed':
                toast.error(errorMessage, {
                    duration: 5000,
                });
                break;
            case 'sessionExpired':
                toast.error(errorMessage, {
                    duration: 4000,
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
        if (otp.length !== 6) {
            setErrors({ otp: 'Please enter a complete 6-digit code' });
            toast.error('Please enter all 6 digits of the OTP');
            return;
        }

        // Validate OTP format (only numbers)
        if (!/^\d{6}$/.test(otp)) {
            setErrors({ otp: 'OTP must contain only numbers' });
            toast.error('OTP must contain only numbers');
            return;
        }

        setIsSubmitting(true);
        try {
            console.log('🔄 Attempting login...');
            const userData = await login(email, otp, userType);
            console.log('✅ Login successful, user data:', userData);

            toast.success('Login successful!', {
                duration: 2000,
            });

            // Small delay to ensure auth state is fully updated
            setTimeout(() => {
                const dashboardUrl = userType === 'admin' ? '/admin' : '/driver';
                console.log('🎯 Navigating to dashboard using React Router:', dashboardUrl);
                navigate(dashboardUrl);
            }, 100); // Very small delay just to ensure state is set
        } catch (error) {
            const errorInfo = handleError(error, 'login');

            // Set specific field errors if applicable
            if (errorInfo.type === 'validation') {
                setErrors({ otp: 'Invalid OTP. Please check the code and try again.' });
            } else if (errorInfo.type === 'auth') {
                setErrors({ otp: 'Authentication failed. Please try again.' });
            } else if (errorInfo.type === 'notFound') {
                // Redirect to login if user not found
                toast.error('User not found. Please try logging in again.');
                navigate('/');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        navigate('/');
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');

        // Clean the pasted data to only include digits
        const cleanedValue = pastedData.replace(/\D/g, '').slice(0, 6);

        if (cleanedValue.length > 0) {
            // Fill the OTP string with the pasted digits
            const pastedOTP = cleanedValue.padEnd(6, '');
            setOtp(pastedOTP);

            // Clear errors when user starts typing
            if (errors.otp) {
                setErrors(prev => ({ ...prev, otp: null }));
            }
        }
    };

    const handleResendOTP = async () => {
        setIsResending(true);
        try {
            await sendOTP(email, userType);
            setTimeLeft(60);
            toast.success('OTP resent successfully!', {
                duration: 3000,
            });
        } catch (error) {
            const errorInfo = handleError(error, 'resend');

            // Handle specific resend errors
            if (errorInfo.type === 'error') {
                setTimeLeft(60); // Standard cooldown
            } else if (errorInfo.type === 'notFound') {
                // Redirect to login if user not found
                navigate('/');
            }
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">

                {/* Header */}
                <div className="text-center mb-8">
                    <img
                        src="/White.png"
                        alt="Logo"
                        className="w-12 h-12 mx-auto mb-4 rounded-lg shadow-sm"
                    />
                    <h1 className="text-2xl font-bold text-gray-900">Verify Code</h1>
                    <p className="text-gray-600 text-sm mt-1">
                        We sent a code to <span className="font-medium">{email}</span>
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="space-y-6">

                        {/* OTP Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Enter the 6-digit code
                            </label>
                            <p className="text-xs text-gray-500 mb-3">
                                💡 Tip: You can paste the entire 6-digit code to auto-fill all fields
                            </p>
                            <div className="flex justify-between space-x-2">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <input
                                        key={index}
                                        data-otp-input
                                        type="text"
                                        maxLength={1}
                                        value={otp[index] || ''}
                                        onChange={(e) => handleOTPChange(index, e.target.value)}
                                        onPaste={handlePaste}
                                        className={`w-10 h-12 text-center text-lg font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${errors.otp
                                            ? 'border-red-300 focus:ring-red-500'
                                            : 'border-gray-300'
                                            }`}
                                        placeholder="0"
                                    />
                                ))}
                            </div>
                            {errors.otp && (
                                <div className="flex items-center mt-2 text-sm text-red-600">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.otp}
                                </div>
                            )}
                        </div>

                        {/* Resend Section */}
                        <div className="text-center">
                            {timeLeft > 0 ? (
                                <p className="text-sm text-gray-500">
                                    Resend code in {timeLeft}s
                                </p>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={handleResendOTP}
                                    loading={isResending}
                                    loadingText="Sending..."
                                    variant="ghost"
                                    size="sm"
                                    className="text-sm text-green-600 hover:text-green-700"
                                >
                                    Resend code
                                </Button>
                            )}
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            loading={isSubmitting}
                            loadingText="Verifying..."
                            disabled={otp.length !== 6}
                            fullWidth={true}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                        >
                            Verify Code
                        </Button>

                        {/* Back Button */}
                        <button
                            type="button"
                            onClick={handleBack}
                            className="w-full flex items-center justify-center text-gray-600 hover:text-gray-800 py-2 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Login
                        </button>

                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-500 mt-6">
                    Enter the code sent to your email
                </p>
            </div>
        </div>
    );
};

export default OTPVerification;
