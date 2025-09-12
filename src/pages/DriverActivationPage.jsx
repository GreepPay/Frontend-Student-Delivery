import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import DriverActivationSkeleton from '../components/common/DriverActivationSkeleton';
import toast from 'react-hot-toast';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL;

const DriverActivationPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [invitation, setInvitation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActivating, setIsActivating] = useState(false);
    const [formData, setFormData] = useState({
        phone: '',
        studentId: '',
        university: '',
        address: ''
    });

    useEffect(() => {
        validateInvitation();
    }, [token]);

    const validateInvitation = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/driver/activate/${token}`);
            const data = await response.json();

            if (data.success) {
                setInvitation(data.data.invitation);
            } else {
                toast.error(data.error || 'Invalid invitation link');
                setTimeout(() => navigate('/'), 3000);
            }
        } catch (error) {
            console.error('Error validating invitation:', error);
            toast.error('Failed to validate invitation');
            setTimeout(() => navigate('/'), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async () => {
        console.log('🚀 Starting account activation...');
        console.log('📝 Form data:', formData);

        // Validation
        if (!formData.phone || !formData.studentId || !formData.university || !formData.address) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setIsActivating(true);
            console.log('📡 Sending activation request to:', `${API_BASE_URL}/driver/activate/${token}`);
            const response = await fetch(`${API_BASE_URL}/driver/activate/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            console.log('📡 Activation response:', data);

            if (data.success) {
                console.log('✅ Account activation successful!');
                toast.success('Account activated successfully! Welcome to Greep SDS! You can now login using OTP.');
                setTimeout(() => navigate('/'), 2000);
            } else {
                console.error('❌ Activation failed:', data.error);
                toast.error(data.error || 'Failed to activate account');
            }
        } catch (error) {
            console.error('Error activating account:', error);
            toast.error('Failed to activate account');
        } finally {
            setIsActivating(false);
        }
    };

    if (isLoading) {
        return <DriverActivationSkeleton />;
    }

    if (!invitation) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <XCircleIcon className="h-16 w-16 text-red-500 mx-auto" />
                    <h1 className="mt-4 text-xl font-bold text-gray-900">Invalid Invitation</h1>
                    <p className="mt-2 text-gray-600">This invitation link is invalid or has expired.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircleIcon className="w-8 h-8 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome to Greep SDS!</h1>
                    <p className="mt-2 text-gray-600">
                        Complete your account setup to start accepting delivery requests
                    </p>
                </div>

                {/* Invitation Info */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-green-600">
                                {invitation.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">{invitation.name}</h2>
                            <p className="text-sm text-gray-500">{invitation.email}</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-medium text-blue-900">Important</h3>
                                <p className="text-sm text-blue-700 mt-1">
                                    This invitation expires on {new Date(invitation.expiresAt).toLocaleDateString('en-US')}.
                                    Please complete your account setup now.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activation Form */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="space-y-6">
                        {/* Contact Information */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Enter your phone number"
                            />
                        </div>

                        {/* Student Information */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Student ID <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.studentId}
                                onChange={(e) => handleInputChange('studentId', e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Enter your student ID"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                University <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.university}
                                onChange={(e) => handleInputChange('university', e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="">Select your university</option>
                                <option value="Eastern Mediterranean University (EMU)">Eastern Mediterranean University (EMU)</option>
                                <option value="Near East University (NEU)">Near East University (NEU)</option>
                                <option value="Cyprus International University (CIU)">Cyprus International University (CIU)</option>
                                <option value="Girne American University (GAU)">Girne American University (GAU)</option>
                                <option value="University of Kyrenia (UoK)">University of Kyrenia (UoK)</option>
                                <option value="European University of Lefke (EUL)">European University of Lefke (EUL)</option>
                                <option value="Middle East Technical University (METU) – Northern Cyprus Campus">Middle East Technical University (METU) – Northern Cyprus Campus</option>
                                <option value="Final International University (FIU)">Final International University (FIU)</option>
                                <option value="Bahçeşehir Cyprus University (BAU)">Bahçeşehir Cyprus University (BAU)</option>
                                <option value="University of Mediterranean Karpasia (UMK)">University of Mediterranean Karpasia (UMK)</option>
                                <option value="Cyprus Health and Social Science University">Cyprus Health and Social Science University</option>
                                <option value="Arkin University of Creative Arts & Design">Arkin University of Creative Arts & Design</option>
                                <option value="Cyprus West University">Cyprus West University</option>
                            </select>
                        </div>



                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Service Area <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="">Select your service area</option>
                                <option value="Terminal/City Center">Terminal/City Center</option>
                                <option value="Kaymakli">Kaymakli</option>
                                <option value="Hamitköy">Hamitköy</option>
                                <option value="Yenişehir">Yenişehir</option>
                                <option value="Kumsal">Kumsal</option>
                                <option value="Gönyeli">Gönyeli</option>
                                <option value="Dereboyu">Dereboyu</option>
                                <option value="Ortaköy">Ortaköy</option>
                                <option value="Yenikent">Yenikent</option>
                                <option value="Taskinkoy">Taskinkoy</option>
                                <option value="Metehan">Metehan</option>
                                <option value="Gocmenkoy">Gocmenkoy</option>
                                <option value="Haspolat">Haspolat</option>
                                <option value="Alaykoy">Alaykoy</option>
                                <option value="Marmara">Marmara</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">This is the area where you'll be providing delivery services</p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isActivating}
                            className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {isActivating ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Activating Account...
                                </>
                            ) : (
                                'Complete Account Setup'
                            )}
                        </button>
                    </div>
                </div>

                {/* OTP Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                            <span className="text-xs font-medium text-blue-600">ℹ️</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-blue-900">OTP-Only Authentication</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                After account activation, you'll use OTP (One-Time Password) sent to your email for login.
                                No password required - just enter your email and we'll send you a secure code.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Support Information */}
                <div className="text-center mt-6">
                    <p className="text-sm text-gray-500">
                        Need help? Contact us at{' '}
                        <a href="https://wa.me/905338329785" className="text-green-600 hover:text-green-700">
                            WhatsApp +90 533 832 97 85
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DriverActivationPage;
