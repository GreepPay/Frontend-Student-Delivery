import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile } from '../../services/profileService';
import CapitalizedInput from '../../components/common/CapitalizedInput';
import { ProfilePageSkeleton } from '../../components/common/SkeletonLoader';
import { capitalizeName } from '../../utils/capitalize';
import toast from 'react-hot-toast';
import { UserIcon, EnvelopeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const ProfilePage = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'admin'
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getProfile(user?.id);
                setProfile(data);

                // Use admin's first and second name as full name
                const adminName = user?.name || 'Super Admin';
                const adminEmail = user?.email || data?.email || '';

                setFormData({
                    name: adminName,
                    email: adminEmail,
                    role: data.role || 'admin'
                });
            } catch (error) {
                toast.error('Failed to load profile');
            } finally {
                setIsLoading(false);
            }
        };

        if (user?.id) {
            fetchProfile();
        }
    }, [user?.id, user?.name, user?.email]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Only send name field - backend validation rejects email and role
            const updateData = {
                name: formData.name
            };

            const updatedProfile = await updateProfile(user?.id, updateData);
            setProfile(updatedProfile);
            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Profile update error:', error);
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    // Admin profile uses logo instead of uploaded image
    const getAdminProfileImage = () => {
        return (
            <div className="w-24 h-24 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center overflow-hidden">
                <img
                    src="/icons/White.png"
                    alt="Admin Profile"
                    className="w-full h-full object-cover"
                />
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <ProfilePageSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="px-4 py-4 border-b border-gray-200">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Profile</h1>
                        <p className="mt-1 text-sm text-gray-600">Manage your administrator account information</p>
                    </div>

                    <div className="p-4">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Profile Image - Admin Logo */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Profile Photo</h3>
                                <div className="flex items-center space-x-4">
                                    {getAdminProfileImage()}
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Admin Profile</p>
                                        <p className="text-xs text-gray-600">System logo used as profile image</p>
                                    </div>
                                </div>
                            </div>

                            {/* Personal Information */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <CapitalizedInput
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                                placeholder="Enter your full name"
                                                capitalizeMode="words"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <EnvelopeIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                readOnly
                                                className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded text-xs bg-gray-50 text-gray-600 cursor-not-allowed"
                                                placeholder="Email cannot be changed"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Email address cannot be modified</p>
                                    </div>
                                </div>
                            </div>

                            {/* Role Information */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Role Information</h3>
                                <div className="flex items-center space-x-3">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                        <ShieldCheckIcon className="w-3 h-3 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-900">Administrator</p>
                                        <p className="text-xs text-gray-600">You have full system access and management privileges</p>
                                    </div>
                                </div>
                            </div>

                            {/* Authentication Info */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Authentication</h3>
                                <div className="flex items-center space-x-3">
                                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-900">OTP Authentication Active</p>
                                        <p className="text-xs text-gray-600">Your account is secured with OTP-based authentication</p>
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-green-600 text-white py-2 px-4 rounded text-xs font-medium hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-green-500 transition-all duration-200 disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
