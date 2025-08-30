import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Button from '../common/Button';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const OTPForm = ({ email, userType, onBack }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];

    // Handle paste event - if value is longer than 1 character, it's likely a paste
    if (value.length > 1) {
      // Clean the pasted value to only include digits
      const cleanedValue = value.replace(/\D/g, '').slice(0, 6);

      // Fill the OTP array with the pasted digits
      for (let i = 0; i < 6; i++) {
        newOtp[i] = cleanedValue[i] || '';
      }

      setOtp(newOtp);

      // Focus the next empty input or the last input if all filled
      const nextEmptyIndex = newOtp.findIndex(digit => !digit);
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
      const nextInput = document.getElementById(`otp-${focusIndex}`);
      if (nextInput) nextInput.focus();
      return;
    }

    // Handle single character input
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');

    // Clean the pasted data to only include digits
    const cleanedValue = pastedData.replace(/\D/g, '').slice(0, 6);

    if (cleanedValue.length > 0) {
      const newOtp = [...otp];

      // Fill the OTP array with the pasted digits
      for (let i = 0; i < 6; i++) {
        newOtp[i] = cleanedValue[i] || '';
      }

      setOtp(newOtp);

      // Focus the next empty input or the last input if all filled
      const nextEmptyIndex = newOtp.findIndex(digit => !digit);
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
      const nextInput = document.getElementById(`otp-${focusIndex}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleSubmit = async () => {
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, otpString, userType);

      if (userType === 'admin') {
        navigate('/admin');
      } else {
        navigate('/driver');
      }
    } catch (error) {
      toast.error(error.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      // Call resend OTP API
      const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, userType }),
      });

      if (response.ok) {
        toast.success('OTP resent successfully!');
        setTimeLeft(60);
      } else {
        throw new Error('Failed to resend OTP');
      }
    } catch (error) {
      toast.error('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Verify OTP</h1>
          <p className="mt-2 text-gray-600">
            We've sent a 6-digit code to <span className="font-semibold">{email}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Enter the 6-digit code
              </label>
              <p className="text-xs text-gray-500 mb-3">
                💡 Tip: You can paste the entire 6-digit code to auto-fill all fields
              </p>
              <div className="flex justify-between space-x-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0"
                  />
                ))}
              </div>
            </div>

            <div className="text-center">
              {timeLeft > 0 ? (
                <p className="text-sm text-gray-600">
                  Resend code in {timeLeft}s
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-sm text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                >
                  Resend OTP
                </button>
              )}
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                onClick={handleSubmit}
                loading={isLoading}
                loadingText="Verifying..."
                disabled={otp.join('').length !== 6}
                fullWidth={true}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                Verify OTP
              </Button>

              <button
                type="button"
                onClick={onBack}
                className="w-full text-gray-600 py-2 px-4 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPForm;
