import React, { useState, useEffect } from 'react';
import { XMarkIcon, EnvelopeIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import SearchableDropdown from '../common/SearchableDropdown';
import driverService from '../../services/driverService';
import apiService from '../../services/api';
import toast from 'react-hot-toast';
import Button from '../ui/Button';

const AddDriverModal = ({ isOpen, onClose, onDriverAdded }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingReferralCodes, setLoadingReferralCodes] = useState(false);
    const [availableReferralCodes, setAvailableReferralCodes] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        referralCode: ''
    });

    // Fetch available referral codes when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchAvailableReferralCodes();
        }
    }, [isOpen]);



    const fetchAvailableReferralCodes = async () => {
        setLoadingReferralCodes(true);
        try {
            console.log('🔍 Fetching available referral codes...');
            const response = await apiService.getAvailableReferralCodes();
            console.log('🔍 Referral codes response:', response);

            console.log('🔍 Response structure:', {
                success: response.success,
                hasData: !!response.data,
                dataType: typeof response.data,
                isArray: Array.isArray(response.data),
                keys: response.data ? Object.keys(response.data) : []
            });

            if (response.success && response.data) {
                let codes = response.data.referralCodes || response.data || [];
                // Ensure codes is always an array
                if (!Array.isArray(codes)) {
                    console.warn('🔍 Referral codes is not an array, converting:', codes);
                    codes = [];
                }
                console.log('🔍 Available referral codes:', codes);
                setAvailableReferralCodes(codes);
            } else {
                console.warn('🔍 No referral codes found in response:', response);
                setAvailableReferralCodes([]);
            }
        } catch (error) {
            console.warn('Failed to fetch referral codes:', error);
            // Don't show error toast - this is not critical
            setAvailableReferralCodes([]);
        } finally {
            setLoadingReferralCodes(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.name || !formData.email) {
            toast.error('Please fill in all required fields');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        try {
            setIsLoading(true);

            const driverData = {
                name: formData.name,
                email: formData.email,
                ...(formData.referralCode && { referralCode: formData.referralCode })
            };

            const response = await driverService.inviteDriver(driverData);
            toast.success('Driver invitation sent successfully!');

            // Reset form
            setFormData({
                name: '',
                email: '',
                referralCode: ''
            });

            onDriverAdded && onDriverAdded(response);
            onClose();
        } catch (error) {
            console.error('Error inviting driver:', error);
            toast.error(error.response?.data?.message || 'Failed to send driver invitation');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setFormData({
                name: '',
                email: '',
                referralCode: ''
            });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Compact Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <EnvelopeIcon className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Invite New Driver</h2>
                            <p className="text-xs text-gray-500">Send OTP-based invitation to join Greep SDS</p>
                        </div>
                    </div>

                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Compact Form - Side by Side Layout */}
                <div className="flex-1 flex overflow-hidden">
                    <div className="flex w-full">
                        {/* Left Side - Form Fields */}
                        <div className="w-1/2 p-4 border-r border-gray-200">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        placeholder="Enter driver's full name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        placeholder="Enter driver's email address"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Referral Code
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.referralCode}
                                            onChange={(e) => handleInputChange('referralCode', e.target.value)}
                                            placeholder="Enter or select referral code"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>
                                    {formData.referralCode && (
                                        <div className="mt-1 text-xs">
                                            {Array.isArray(availableReferralCodes) && availableReferralCodes.find(code => code.referralCode === formData.referralCode) ? (
                                                <span className="text-green-600">
                                                    ✅ Valid referral code by {availableReferralCodes.find(code => code.referralCode === formData.referralCode)?.driverName}
                                                </span>
                                            ) : (
                                                <span className="text-blue-600">
                                                    📝 Manual referral code entry - will be validated on submission
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {Array.isArray(availableReferralCodes) && availableReferralCodes.length > 0 && (
                                        <div className="mt-1 text-xs text-gray-500">
                                            Available codes: {availableReferralCodes.slice(0, 3).map(code => code.referralCode).join(', ')}
                                            {availableReferralCodes.length > 3 && ` and ${availableReferralCodes.length - 3} more`}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Information and Process */}
                        <div className="w-1/2 p-4">
                            <div className="space-y-3 h-full">
                                {/* Compact Info Boxes */}
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                    <div className="flex items-start space-x-2">
                                        <EnvelopeIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h3 className="text-xs font-medium text-blue-900">Invitation Process</h3>
                                            <p className="text-xs text-blue-700 mt-1">
                                                Driver receives a professional email with account activation link and login instructions.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                    <div className="flex items-start space-x-2">
                                        <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                                            <span className="text-white text-xs font-bold">R</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-medium text-green-900">Referral Tracking</h3>
                                            <p className="text-xs text-green-700 mt-1">
                                                Referral code enables rewards system and helps drivers earn points.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Compact What Happens Next */}
                                <div className="bg-gray-50 rounded-md p-3">
                                    <h4 className="text-xs font-medium text-gray-900 mb-2">What happens next?</h4>
                                    <ul className="text-xs text-gray-600 space-y-0.5">
                                        <li>• Driver receives professional invitation email</li>
                                        <li>• Clicks secure activation link</li>
                                        <li>• Sets up account with OTP verification</li>
                                        <li>• Completes profile & document verification</li>
                                        <li>• Starts accepting delivery requests</li>
                                        {formData.referralCode && (
                                            <li>• Referral tracking activated</li>
                                        )}
                                    </ul>
                                </div>

                                {/* Helpful Tips */}
                                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                    <h4 className="text-xs font-medium text-yellow-900 mb-1">💡 Tips</h4>
                                    <ul className="text-xs text-yellow-800 space-y-0.5">
                                        <li>• Find referral codes in driver profiles</li>
                                        <li>• Referral codes are optional but recommended</li>
                                        <li>• Drivers can earn points for successful referrals</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compact Actions */}
                <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                    <div className="text-xs text-gray-600">
                        <span className="font-medium">Ready to invite?</span> Driver will receive an email invitation immediately.
                    </div>
                    <div className="flex space-x-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <Button
                            type="submit"
                            onClick={handleSubmit}
                            loading={isLoading}
                            loadingText="Sending..."
                            icon={EnvelopeIcon}
                            size="sm"
                            className="px-4 py-1.5 text-xs"
                        >
                            Send Invitation
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddDriverModal;
