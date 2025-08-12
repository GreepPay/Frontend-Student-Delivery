import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/common/Avatar';
import DocumentUpload from '../../components/common/DocumentUpload';
import CapitalizedInput from '../../components/common/CapitalizedInput';
import apiService from '../../services/api';
import { ProfilePageSkeleton } from '../../components/common/SkeletonLoader';
import { compressImage } from '../../services/cloudinaryService';
import { capitalizeName } from '../../utils/capitalize';
import toast from 'react-hot-toast';
import {
    CameraIcon,
    InformationCircleIcon,
    CheckCircleIcon,
    PencilIcon,
    DocumentTextIcon,
    AcademicCapIcon,
    ShieldCheckIcon,
    ClockIcon,
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    MapPinIcon,
    IdentificationIcon,
    TruckIcon,
    MapIcon,
    ArrowRightIcon,
    ArrowPathIcon,
    CheckIcon
} from '@heroicons/react/24/outline';

const DriverProfilePage = () => {
    const { user, isAuthenticated } = useAuth();
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        studentId: '',
        university: '',
        transportationMethod: '',
        transportationArea: ''
    });

    const [serviceAreas, setServiceAreas] = useState([]);
    const [transportationMethods, setTransportationMethods] = useState([]);
    const [universities, setUniversities] = useState([]);

    const fetchProfileOptions = useCallback(async () => {
        try {
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
            const url = `${API_BASE_URL}/public/profile-options`;
            console.log('Fetching profile options from:', url);

            const response = await fetch(url);
            console.log('Profile options response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success && data.data) {
                if (data.data.addresses) {
                    setServiceAreas([
                        { value: '', label: 'Select Service Area' },
                        ...data.data.addresses.map(addr => ({ value: addr, label: addr }))
                    ]);
                }

                if (data.data.transportationMethods) {
                    setTransportationMethods([
                        { value: '', label: 'Select Transportation Method' },
                        ...data.data.transportationMethods.map(method => ({ value: method, label: method }))
                    ]);
                }

                if (data.data.universities) {
                    setUniversities([
                        { value: '', label: 'Select University' },
                        ...data.data.universities.map(uni => ({ value: uni, label: uni }))
                    ]);
                }
            }
        } catch (error) {
            console.error('Error fetching profile options:', error);

            // Provide fallback options if API fails
            console.log('Using fallback profile options...');

            // Set fallback service areas
            setServiceAreas([
                { value: '', label: 'Select Service Area' },
                { value: 'Kucuk', label: 'Kucuk' },
                { value: 'Lefkosa', label: 'Lefkosa' },
                { value: 'Girne', label: 'Girne' },
                { value: 'Iskele', label: 'Iskele' },
                { value: 'Guzelyurt', label: 'Guzelyurt' },
                { value: 'Lefke', label: 'Lefke' }
            ]);

            // Set fallback transportation methods
            setTransportationMethods([
                { value: '', label: 'Select Transportation Method' },
                { value: 'Walking', label: 'Walking' },
                { value: 'Bicycle', label: 'Bicycle' },
                { value: 'Motorcycle', label: 'Motorcycle' },
                { value: 'Car', label: 'Car' },
                { value: 'Public Transport', label: 'Public Transport' },
                { value: 'Other', label: 'Other' }
            ]);

            // Set fallback universities
            setUniversities([
                { value: '', label: 'Select University' },
                { value: 'Eastern Mediterranean University', label: 'Eastern Mediterranean University' },
                { value: 'Cyprus West University', label: 'Cyprus West University' },
                { value: 'Cyprus International University', label: 'Cyprus International University' },
                { value: 'Near East University', label: 'Near East University' },
                { value: 'Girne American University', label: 'Girne American University' },
                { value: 'European University of Lefke', label: 'European University of Lefke' },
                { value: 'University of Kyrenia', label: 'University of Kyrenia' },
                { value: 'Final International University', label: 'Final International University' },
                { value: 'University of Mediterranean Karpasia', label: 'University of Mediterranean Karpasia' },
                { value: 'Lefke European University', label: 'Lefke European University' },
                { value: 'American University of Cyprus', label: 'American University of Cyprus' },
                { value: 'Cyprus Science University', label: 'Cyprus Science University' },
                { value: 'University of Central Lancashire Cyprus', label: 'University of Central Lancashire Cyprus' }
            ]);
        }
    }, []);

    const fetchProfile = useCallback(async (forceRefresh = false) => {
        if (!user?.id) return;

        try {
            console.log('🔄 Fetching profile data...', { forceRefresh });

            // Add cache-busting parameter if force refresh is requested
            const data = await apiService.getDriverProfile();

            if (data.success && data.data) {
                console.log('✅ Profile data received:', {
                    hasProfileImage: !!data.data.profileImage,
                    profileImageUrl: data.data.profileImage,
                    profileData: data.data,
                    profileStructure: {
                        profileImage: data.data.profileImage,
                        profile: data.data.profile,
                        personalDetails: data.data.profile?.personalDetails,
                        profilePicture: data.data.profilePicture,
                        // Check all possible image locations
                        allImageFields: {
                            profileImage: data.data.profileImage,
                            profilePicture: data.data.profilePicture,
                            profile_profileImage: data.data.profile?.profileImage,
                            profile_personalDetails_profileImage: data.data.profile?.personalDetails?.profileImage,
                            profile_personalDetails_profilePicture: data.data.profile?.personalDetails?.profilePicture
                        }
                    }
                });

                setProfile(data.data);
                setFormData({
                    fullName: data.data.profile?.personalDetails?.fullName || '',
                    email: data.data.profile?.personalDetails?.email || '',
                    phone: data.data.profile?.personalDetails?.phone || '',
                    studentId: data.data.profile?.studentInfo?.studentId || '',
                    university: data.data.profile?.studentInfo?.university || '',
                    transportationMethod: data.data.profile?.transportation?.method || '',
                    transportationArea: data.data.profile?.transportation?.area || ''
                });
            }
        } catch (error) {
            console.error('❌ Error fetching profile:', error);
            toast.error('Failed to load profile data');
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const updateData = {
                personalDetails: {
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone
                },
                studentInfo: {
                    studentId: formData.studentId,
                    university: formData.university
                },
                transportation: {
                    method: formData.transportationMethod,
                    area: formData.transportationArea
                }
            };

            const result = await apiService.updateDriverProfile(updateData);

            if (result.success) {
                toast.success('Profile updated successfully!');
                setIsEditing(false);
                await fetchProfile();
            } else {
                throw new Error(result.message || 'Update failed');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setFormData({
            fullName: profile?.profile?.personalDetails?.fullName || '',
            email: profile?.profile?.personalDetails?.email || '',
            phone: profile?.profile?.personalDetails?.phone || '',
            studentId: profile?.profile?.studentInfo?.studentId || '',
            university: profile?.profile?.studentInfo?.university || '',
            transportationMethod: profile?.profile?.transportation?.method || '',
            transportationArea: profile?.profile?.transportation?.area || ''
        });
        setIsEditing(false);
    };



    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        try {
            setIsUploadingImage(true);
            console.log('Starting image upload...', { fileName: file.name, fileSize: file.size, fileType: file.type });

            const compressedFile = await compressImage(file);
            console.log('Image compressed successfully', { compressedSize: compressedFile.size });

            const formData = new FormData();
            formData.append('profilePicture', compressedFile, file.name);
            formData.append('originalSize', file.size.toString());
            formData.append('compressedSize', compressedFile.size.toString());
            formData.append('fileType', file.type);

            console.log('FormData created with fields:', {
                hasProfilePicture: formData.has('profilePicture'),
                originalSize: formData.get('originalSize'),
                compressedSize: formData.get('compressedSize'),
                fileType: formData.get('fileType')
            });

            // Check if the backend endpoint exists by testing it first
            try {
                console.log('🚀 Starting image upload to backend...');
                console.log('📤 FormData contents:', {
                    hasProfilePicture: formData.has('profilePicture'),
                    originalSize: formData.get('originalSize'),
                    compressedSize: formData.get('compressedSize'),
                    fileType: formData.get('fileType')
                });

                // Use the correct driver profile image upload endpoint
                const result = await apiService.uploadDriverProfileImage(formData);
                console.log('📥 Upload API response:', result);

                if (result.success === true) {
                    toast.success('Profile image uploaded successfully!');
                    const imageUrl = result.data?.profilePicture || result.data?.optimizedUrl || result.data?.imageUrl || result.data?.url;

                    console.log('✅ Image upload successful:', {
                        result: result,
                        imageUrl: imageUrl,
                        data: result.data
                    });

                    if (imageUrl) {
                        // Force a complete profile refresh to get the latest data from database
                        console.log('🔄 Refreshing profile data...');
                        await fetchProfile();

                        // Also update local state immediately for better UX
                        setProfile(prev => ({
                            ...prev,
                            profileImage: imageUrl,
                            profilePicture: imageUrl, // Add this field as well
                            profileImagePublicId: result.data?.publicId || `upload_${Date.now()}`
                        }));

                        console.log('✅ Profile state updated with new image URL:', imageUrl);
                    } else {
                        console.warn('⚠️ No image URL in response:', result);
                    }
                } else {
                    throw new Error('Upload failed: ' + (result.message || 'Server returned success: false'));
                }
            } catch (uploadError) {
                // If the upload fails, show a proper error message
                console.error('Image upload failed:', uploadError);
                toast.error('Failed to upload image. Please try again or contact support if the issue persists.');
                throw uploadError; // Re-throw to be handled by the outer catch block
            }
        } catch (error) {
            console.error('Image upload failed:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                statusText: error.response?.statusText
            });

            let errorMessage = 'Upload failed';
            if (error.response?.status === 400) {
                errorMessage = 'Invalid image format or size. Please try a different image.';
            } else if (error.response?.status === 413) {
                errorMessage = 'Image file is too large. Please select a smaller image.';
            } else if (error.response?.status === 401) {
                errorMessage = 'Please log in again to upload images.';
            } else if (error.response?.status === 404) {
                errorMessage = 'Image upload service not available. Please try again later.';
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }

            // Only show error toast if we haven't handled it gracefully above
            if (!errorMessage.includes('preview created')) {
                toast.error(errorMessage);
            }
        } finally {
            setIsUploadingImage(false);
            event.target.value = '';
        }
    };

    useEffect(() => {
        if (isAuthenticated && user && user.id) {
            fetchProfile();
        }
    }, [user?.id, isAuthenticated, fetchProfile]);

    useEffect(() => {
        fetchProfileOptions();
    }, [fetchProfileOptions]);





    if (isLoading) {
        return <ProfilePageSkeleton />;
    }

    const completionPercentage = profile?.completion?.overall || 0;
    const isProfileComplete = completionPercentage >= 100;

    // Debug information (remove in production)
    console.log('🔍 Current Profile State:', {
        hasProfile: !!profile,
        profileImage: profile?.profileImage,
        profilePicture: profile?.profilePicture,
        profileImagePublicId: profile?.profileImagePublicId,
        profileData: profile,
        allImageLocations: {
            profileImage: profile?.profileImage,
            profilePicture: profile?.profilePicture,
            profile_profileImage: profile?.profile?.profileImage,
            profile_profilePicture: profile?.profile?.profilePicture,
            profile_personalDetails_profileImage: profile?.profile?.personalDetails?.profileImage,
            profile_personalDetails_profilePicture: profile?.profile?.personalDetails?.profilePicture
        }
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Modern Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                            <p className="text-gray-600 mt-2">Manage your account and delivery preferences</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            {!isEditing && (
                                <>
                                    <button
                                        onClick={() => fetchProfile(true)}
                                        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                        title="Refresh profile data"
                                    >
                                        <ArrowPathIcon className="w-4 h-4 mr-2" />
                                        Refresh
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                    >
                                        <PencilIcon className="w-4 h-4 mr-2" />
                                        Edit Profile
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Overview Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
                    <div className="flex flex-col lg:flex-row items-start space-y-6 lg:space-y-0 lg:space-x-8">
                        {/* Profile Image Section */}
                        <div className="relative">
                            <div className="relative">
                                <Avatar
                                    user={user}
                                    profile={profile}
                                    size="2xl"
                                    className="border-4 border-green-200 shadow-xl"
                                />
                                <div className="absolute -bottom-2 -right-2">
                                    <input
                                        type="file"
                                        id="profile-image-upload"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        disabled={isUploadingImage}
                                    />
                                    <label
                                        htmlFor="profile-image-upload"
                                        className={`flex items-center justify-center p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all duration-200 cursor-pointer ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                                    >
                                        {isUploadingImage ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <CameraIcon className="w-5 h-5" />
                                        )}
                                    </label>
                                </div>


                            </div>

                            {/* Status Badge */}
                            <div className="mt-4 flex justify-center">
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shadow-sm ${isProfileComplete
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                    }`}>
                                    {isProfileComplete ? (
                                        <>
                                            <CheckCircleIcon className="w-4 h-4 mr-1" />
                                            Profile Complete
                                        </>
                                    ) : (
                                        <>
                                            <ClockIcon className="w-4 h-4 mr-1" />
                                            {completionPercentage}% Complete
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    {profile?.profile?.personalDetails?.fullName ?
                                        capitalizeName(profile.profile.personalDetails.fullName) :
                                        'Student Delivery Partner'
                                    }
                                </h2>
                                <p className="text-gray-600 flex items-center">
                                    <EnvelopeIcon className="w-4 h-4 mr-2" />
                                    {profile?.profile?.personalDetails?.email}
                                </p>
                                <p className="text-gray-500 text-sm mt-1 flex items-center">
                                    <IdentificationIcon className="w-4 h-4 mr-2" />
                                    ID: {profile?.profile?.studentInfo?.studentId}
                                </p>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <MapIcon className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-gray-600">Service Area</p>
                                            <p className="font-semibold text-gray-900">
                                                {profile?.profile?.transportation?.area ?
                                                    capitalizeName(profile.profile.transportation.area) :
                                                    'Not Set'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <TruckIcon className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-gray-600">Transport</p>
                                            <p className="font-semibold text-gray-900">
                                                {profile?.profile?.transportation?.method ?
                                                    capitalizeName(profile.profile.transportation.method) :
                                                    'Not Set'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <AcademicCapIcon className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-gray-600">University</p>
                                            <p className="font-semibold text-gray-900">
                                                {profile?.profile?.studentInfo?.university ?
                                                    capitalizeName(profile.profile.studentInfo.university) :
                                                    'Not Set'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Verification Status */}
                            <div className="mt-6 flex flex-wrap gap-2">
                                {profile?.verification?.studentVerified && (
                                    <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                        <ShieldCheckIcon className="w-4 h-4 mr-1" />
                                        Student Verified
                                    </div>
                                )}
                                {profile?.completion?.readyForDeliveries && (
                                    <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                                        Ready for Deliveries
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="mb-6">
                    <nav className="flex space-x-8">
                        {[
                            { id: 'overview', label: 'Overview', icon: UserIcon },
                            { id: 'personal', label: 'Personal Details', icon: IdentificationIcon },
                            { id: 'academic', label: 'Academic Info', icon: AcademicCapIcon },
                            { id: 'transportation', label: 'Transportation', icon: TruckIcon },
                            { id: 'documents', label: 'Documents', icon: DocumentTextIcon }
                        ].map((tab, index) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                        ? 'border-green-500 text-green-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Profile Completion */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Completion</h3>
                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                                            <span>Overall Progress</span>
                                            <span>{completionPercentage}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${completionPercentage}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {profile?.completion?.sections && Object.entries(profile.completion.sections).map(([section, data]) => (
                                            <div key={section} className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 capitalize">
                                                    {section.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {data.completed}/{data.total}
                                                    </span>
                                                    <div className={`w-2 h-2 rounded-full ${data.percentage === 100 ? 'bg-green-500' : 'bg-yellow-500'
                                                        }`}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => setActiveTab('personal')}
                                            className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <UserIcon className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <span className="font-medium text-gray-900">Update Personal Info</span>
                                            </div>
                                            <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                                        </button>

                                        <button
                                            onClick={() => setActiveTab('documents')}
                                            className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-purple-100 rounded-lg">
                                                    <DocumentTextIcon className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <span className="font-medium text-gray-900">Upload Documents</span>
                                            </div>
                                            <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                                        </button>

                                        <button
                                            onClick={() => setActiveTab('transportation')}
                                            className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-green-100 rounded-lg">
                                                    <TruckIcon className="w-5 h-5 text-green-600" />
                                                </div>
                                                <span className="font-medium text-gray-900">Transportation Settings</span>
                                            </div>
                                            <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Personal Details Tab */}
                    {activeTab === 'personal' && (
                        <div className="p-8">
                            <div className="mb-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Personal Details</h3>
                                <p className="text-gray-600">Update your personal information and contact details</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                        {isEditing ? (
                                            <div className="relative">
                                                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <CapitalizedInput
                                                    type="text"
                                                    name="fullName"
                                                    value={formData.fullName}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                                    placeholder="Enter your full name"
                                                    capitalizeMode="words"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                                <UserIcon className="w-5 h-5 text-gray-400 mr-3" />
                                                <span className="text-gray-900">
                                                    {profile?.profile?.personalDetails?.fullName ?
                                                        capitalizeName(profile.profile.personalDetails.fullName) :
                                                        'Not provided'
                                                    }
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                        {isEditing ? (
                                            <div className="relative">
                                                <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <CapitalizedInput
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                                    placeholder="Enter your email"
                                                    autoCapitalize={false}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                                <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3" />
                                                <span className="text-gray-900">{profile?.profile?.personalDetails?.email || 'Not provided'}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                        {isEditing ? (
                                            <div className="relative">
                                                <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                                    placeholder="Enter your phone number"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                                <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
                                                <span className="text-gray-900">{profile?.profile?.personalDetails?.phone || 'Not provided'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Saving...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckIcon className="w-4 h-4" />
                                                    <span>Save Changes</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    )}

                    {/* Academic Info Tab */}
                    {activeTab === 'academic' && (
                        <div className="p-8">
                            <div className="mb-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Academic Information</h3>
                                <p className="text-gray-600">Update your student details and university information</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
                                        {isEditing ? (
                                            <div className="relative">
                                                <IdentificationIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <CapitalizedInput
                                                    type="text"
                                                    name="studentId"
                                                    value={formData.studentId}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                                    placeholder="Enter your student ID"
                                                    capitalizeMode="first"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                                <IdentificationIcon className="w-5 h-5 text-gray-400 mr-3" />
                                                <span className="text-gray-900">
                                                    {profile?.profile?.studentInfo?.studentId ?
                                                        capitalizeName(profile.profile.studentInfo.studentId) :
                                                        'Not provided'
                                                    }
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">University</label>
                                        {isEditing ? (
                                            <div className="relative">
                                                <AcademicCapIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <select
                                                    name="university"
                                                    value={formData.university}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                                >
                                                    {universities.map((uni, index) => (
                                                        <option key={index} value={uni.value}>{uni.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                                <AcademicCapIcon className="w-5 h-5 text-gray-400 mr-3" />
                                                <span className="text-gray-900">{profile?.profile?.studentInfo?.university || 'Not provided'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Saving...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckIcon className="w-4 h-4" />
                                                    <span>Save Changes</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    )}

                    {/* Transportation Tab */}
                    {activeTab === 'transportation' && (
                        <div className="p-8">
                            <div className="mb-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Transportation Settings</h3>
                                <p className="text-gray-600">Configure your delivery preferences and service area</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Transportation Method</label>
                                        {isEditing ? (
                                            <div className="relative">
                                                <TruckIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <select
                                                    name="transportationMethod"
                                                    value={formData.transportationMethod}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                                >
                                                    {transportationMethods.map((method, index) => (
                                                        <option key={index} value={method.value}>{method.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                                <TruckIcon className="w-5 h-5 text-gray-400 mr-3" />
                                                <span className="text-gray-900">
                                                    {profile?.profile?.transportation?.method ?
                                                        capitalizeName(profile.profile.transportation.method) :
                                                        'Not provided'
                                                    }
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Service Area</label>
                                        {isEditing ? (
                                            <div className="relative">
                                                <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <select
                                                    name="transportationArea"
                                                    value={formData.transportationArea}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                                >
                                                    {serviceAreas.map((area, index) => (
                                                        <option key={index} value={area.value}>{area.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                                <MapPinIcon className="w-5 h-5 text-gray-400 mr-3" />
                                                <span className="text-gray-900">
                                                    {profile?.profile?.transportation?.area ?
                                                        capitalizeName(profile.profile.transportation.area) :
                                                        'Not provided'
                                                    }
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Saving...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckIcon className="w-4 h-4" />
                                                    <span>Save Changes</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    )}

                    {/* Documents Tab */}
                    {activeTab === 'documents' && (
                        <div className="p-8">
                            <div className="mb-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Document Verification</h3>
                                <p className="text-gray-600">Upload required documents for account verification</p>
                            </div>

                            <div className="space-y-6">
                                <DocumentUpload
                                    documentType="studentId"
                                    onDocumentUploaded={() => { }}
                                    isUploaded={profile?.verification?.studentVerified}
                                />

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex">
                                        <InformationCircleIcon className="w-5 h-5 text-blue-400 mt-0.5" />
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-blue-800">Verification Status</h3>
                                            <div className="mt-2 text-sm text-blue-700">
                                                <p>Upload your student ID to verify your account and start accepting deliveries.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DriverProfilePage;
