import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/common/Avatar';
import CapitalizedInput from '../../components/common/CapitalizedInput';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import apiService from '../../services/api';
import { ProfilePageSkeleton } from '../../components/common/SkeletonLoader';
import { compressImage } from '../../services/cloudinaryService';
import { capitalizeName } from '../../utils/capitalize';
import { isDriverVerified, getVerificationStatus } from '../../utils/verificationHelpers';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import StatusToggle from '../../components/driver/StatusToggle';
import DocumentUpload from '../../components/common/DocumentUpload';
import {
    CameraIcon,
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

    // Debug formData changes
    useEffect(() => {
        console.log('🔍 ProfilePage: formData changed:', formData);
    }, [formData]);

    // Debug formData.transportationArea changes
    useEffect(() => {
        console.log('🔍 ProfilePage: formData.transportationArea changed to:', formData.transportationArea);
    }, [formData.transportationArea]);

    // Debug formData.fullName changes
    useEffect(() => {
        console.log('🔍 ProfilePage: formData.fullName changed to:', formData.fullName);
    }, [formData.fullName]);

    // Debug profile.transportation.area changes
    useEffect(() => {
        console.log('🔍 ProfilePage: profile.transportation.area changed to:', profile?.profile?.transportation?.area);
        console.log('🔍 ProfilePage: profile.address changed to:', profile?.profile?.address);
    }, [profile?.profile?.transportation?.area, profile?.profile?.address]);

    // Helper function to normalize transportation method values
    const normalizeTransportationMethod = (method) => {
        if (!method) return '';

        const methodMap = {
            'Walking': 'walking',
            'Bicycle': 'bicycle',
            'Motorcycle': 'motorcycle',
            'Scooter': 'scooter',
            'Car': 'car',
            'Public Transport': 'other',
            'Other': 'other'
        };

        return methodMap[method] || method.toLowerCase();
    };

    const fetchProfileOptions = useCallback(async () => {
        try {
            console.log('🔄 Fetching profile options...');

            // Use API service instead of direct fetch for proper error handling
            const data = await apiService.getProfileOptions();
            console.log('📋 Profile options data received:', data);

            if (data.success && data.data) {
                // Use backend lists when available, otherwise sensible defaults
                const addresses = Array.isArray(data.data.addresses) && data.data.addresses.length > 0
                    ? data.data.addresses
                    : ['Terminal/City Center', 'Kaymakli', 'Hamitköy', 'Yenişehir', 'Kumsal', 'Gönyeli', 'Dereboyu', 'Ortaköy', 'Yenikent', 'Taskinkoy', 'Metehan', 'Gocmenkoy', 'Haspolat', 'Alaykoy', 'Marmara'];
                setServiceAreas([
                    { value: '', label: 'Select Service Area' },
                    ...addresses.map(addr => ({ value: addr, label: addr }))
                ]);
                console.log('✅ Service areas loaded:', addresses);

                // Get transportation methods from API or use fallback
                const apiMethods = Array.isArray(data.data.transportationMethods) && data.data.transportationMethods.length > 0
                    ? data.data.transportationMethods
                    : ['walking', 'bicycle', 'motorcycle', 'scooter', 'car', 'other'];

                // Create normalized methods with proper labels
                const normalizedMethods = apiMethods.map(method => {
                    const labelMap = {
                        'walking': 'Walking',
                        'bicycle': 'Bicycle',
                        'motorcycle': 'Motorcycle',
                        'scooter': 'Scooter',
                        'car': 'Car',
                        'other': 'Other'
                    };
                    return {
                        value: method,
                        label: labelMap[method] || method.charAt(0).toUpperCase() + method.slice(1)
                    };
                });

                setTransportationMethods([
                    { value: '', label: 'Select Transportation Method' },
                    ...normalizedMethods
                ]);
                console.log('✅ Transportation methods loaded:', normalizedMethods);

                const universitiesList = Array.isArray(data.data.universities) && data.data.universities.length > 0
                    ? data.data.universities
                    : [
                        'Eastern Mediterranean University', 'Cyprus West University', 'Cyprus International University',
                        'Near East University', 'Girne American University', 'European University of Lefke',
                        'University of Kyrenia', 'Final International University', 'University of Mediterranean Karpasia',
                        'Lefke European University', 'American University of Cyprus', 'Cyprus Science University',
                        'University of Central Lancashire Cyprus'
                    ];
                setUniversities([
                    { value: '', label: 'Select University' },
                    ...universitiesList.map(uni => ({ value: uni, label: uni }))
                ]);
                console.log('✅ Universities loaded:', universitiesList);
            } else {
                console.warn('⚠️ Profile options API returned unexpected structure:', data);
                // Force fallback data
                throw new Error('API returned unexpected structure');
            }
        } catch (error) {
            console.error('❌ Error fetching profile options:', error);

            // Provide fallback options if API fails
            console.log('🔄 Using fallback profile options...');

            // Set fallback service areas
            const fallbackServiceAreas = [
                { value: '', label: 'Select Service Area' },
                { value: 'Terminal/City Center', label: 'Terminal/City Center' },
                { value: 'Kaymakli', label: 'Kaymakli' },
                { value: 'Hamitköy', label: 'Hamitköy' },
                { value: 'Yenişehir', label: 'Yenişehir' },
                { value: 'Kumsal', label: 'Kumsal' },
                { value: 'Gönyeli', label: 'Gönyeli' },
                { value: 'Dereboyu', label: 'Dereboyu' },
                { value: 'Ortaköy', label: 'Ortaköy' },
                { value: 'Yenikent', label: 'Yenikent' },
                { value: 'Taskinkoy', label: 'Taskinkoy' },
                { value: 'Metehan', label: 'Metehan' },
                { value: 'Gocmenkoy', label: 'Gocmenkoy' },
                { value: 'Haspolat', label: 'Haspolat' },
                { value: 'Alaykoy', label: 'Alaykoy' },
                { value: 'Marmara', label: 'Marmara' }
            ];
            setServiceAreas(fallbackServiceAreas);
            console.log('✅ Fallback service areas set:', fallbackServiceAreas);

            // Set fallback transportation methods
            const fallbackTransportationMethods = [
                { value: '', label: 'Select Transportation Method' },
                { value: 'Walking', label: 'Walking' },
                { value: 'Bicycle', label: 'Bicycle' },
                { value: 'Motorcycle', label: 'Motorcycle' },
                { value: 'Car', label: 'Car' },
                { value: 'Public Transport', label: 'Public Transport' },
                { value: 'Other', label: 'Other' }
            ];
            setTransportationMethods(fallbackTransportationMethods);
            console.log('✅ Fallback transportation methods set:', fallbackTransportationMethods);

            // Set fallback universities
            const fallbackUniversities = [
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
            ];
            setUniversities(fallbackUniversities);
            console.log('✅ Fallback universities set:', fallbackUniversities);
        }
    }, []);

    const fetchProfile = useCallback(async (forceRefresh = false) => {
        if (!user?.id) return;

        try {
            console.log('🔄 Fetching profile data...', { forceRefresh });

            // Fetch profile and documents separately
            const [profileData, documentsData] = await Promise.allSettled([
                apiService.getDriverProfile(),
                apiService.getDriverDocuments()
            ]);

            console.log('📄 Profile fetch results:', {
                profileStatus: profileData.status,
                documentsStatus: documentsData.status,
                profileValue: profileData.status === 'fulfilled' ? profileData.value : null,
                documentsValue: documentsData.status === 'fulfilled' ? documentsData.value : null
            });

            // Use profile data regardless of documents fetch status
            const data = profileData.status === 'fulfilled' ? profileData.value : null;
            if (!data) {
                throw new Error('Failed to fetch profile data');
            }

            // Merge documents into profile if available
            if (documentsData.status === 'fulfilled' && documentsData.value?.success) {
                const documents = documentsData.value.data?.documents || {};
                console.log('📄 Merging documents into profile:', {
                    documentsCount: Object.keys(documents).length,
                    documentTypes: Object.keys(documents),
                    documentsData: documents
                });

                // Filter documents to only include the 3 required types
                const filteredDocuments = {};
                const requiredDocumentTypes = ['studentId', 'profilePhoto', 'passportPhoto'];

                // Map old document types to new ones if needed
                const documentTypeMapping = {
                    'identityCard': 'passportPhoto', // Map old identityCard to passportPhoto
                    'universityEnrollment': null // Remove universityEnrollment
                };

                requiredDocumentTypes.forEach(docType => {
                    if (documents[docType]) {
                        filteredDocuments[docType] = documents[docType];
                    }
                });

                // Handle document type mapping
                Object.entries(documentTypeMapping).forEach(([oldType, newType]) => {
                    if (documents[oldType] && newType) {
                        // Map old document type to new one
                        filteredDocuments[newType] = documents[oldType];
                        console.log(`🔄 Mapped document type: ${oldType} → ${newType}`);
                    }
                });

                console.log('📄 Filtered documents for frontend:', {
                    originalCount: Object.keys(documents).length,
                    filteredCount: Object.keys(filteredDocuments).length,
                    filteredTypes: Object.keys(filteredDocuments),
                    filteredDocuments: filteredDocuments
                });

                // Add filtered documents to profile data
                data.data.documents = filteredDocuments;
            } else {
                console.log('⚠️ Documents fetch failed or no documents found');
            }

            if (data.success && data.data) {
                const documentCount = Object.keys(data.data.documents || {}).length;
                console.log('✅ Profile data received:', {
                    hasProfileImage: !!data.data.profileImage,
                    profileImageUrl: data.data.profileImage,
                    profileData: data.data,
                    documents: data.data.documents,
                    documentCount: documentCount,
                    expectedDocumentCount: 3,
                    documentTypes: Object.keys(data.data.documents || {}),
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

                // Enhanced document debugging
                console.log('📄 Profile documents analysis:', {
                    hasDocuments: !!data.data.documents,
                    documentsType: typeof data.data.documents,
                    documentsKeys: data.data.documents ? Object.keys(data.data.documents) : [],
                    documentsCount: data.data.documents ? Object.keys(data.data.documents).length : 0,
                    sampleDocument: data.data.documents ? Object.values(data.data.documents)[0] : null,
                    allDocumentTypes: data.data.documents ? Object.keys(data.data.documents) : []
                });

                // Check if documents are in a different location in the response
                console.log('🔍 Full profile data structure analysis:', {
                    hasProfileData: !!data.data,
                    profileDataKeys: data.data ? Object.keys(data.data) : [],
                    hasDocumentsField: !!data.data?.documents,
                    hasProfileField: !!data.data?.profile,
                    profileKeys: data.data?.profile ? Object.keys(data.data.profile) : [],
                    hasProfileDocuments: !!data.data?.profile?.documents,
                    profileDocumentsKeys: data.data?.profile?.documents ? Object.keys(data.data.profile.documents) : []
                });

                setProfile(data.data);

                // Debug the transportation area field
                console.log('🔍 Profile fetch - transportation area debug:', {
                    transportationArea: data.data.profile?.transportation?.area,
                    address: data.data.profile?.address,
                    rootAddress: data.data.address,
                    serviceArea: data.data.profile?.serviceArea,
                    fullTransportation: data.data.profile?.transportation,
                    profileStructure: data.data.profile,
                    allPossibleFields: {
                        'profile.transportation.area': data.data.profile?.transportation?.area,
                        'profile.address': data.data.profile?.address,
                        'data.address': data.data.address,
                        'profile.serviceArea': data.data.profile?.serviceArea
                    }
                });

                const formDataToSet = {
                    fullName: data.data.profile?.personalDetails?.fullName || '',
                    email: data.data.profile?.personalDetails?.email || '',
                    phone: data.data.profile?.personalDetails?.phone || '',
                    studentId: data.data.profile?.studentInfo?.studentId || '',
                    university: data.data.profile?.studentInfo?.university || '',
                    transportationMethod: normalizeTransportationMethod(data.data.profile?.transportation?.method || ''),
                    // Check multiple possible locations for service area (backend inconsistency)
                    transportationArea: data.data.profile?.transportation?.area ||
                        data.data.profile?.address ||
                        data.data.profile?.serviceArea ||
                        data.data.address ||
                        ''
                };

                console.log('🔍 Setting formData with transportationArea:', {
                    selectedArea: formDataToSet.transportationArea,
                    allChecks: {
                        'transportation.area': data.data.profile?.transportation?.area,
                        'profile.address': data.data.profile?.address,
                        'profile.serviceArea': data.data.profile?.serviceArea,
                        'data.address': data.data.address
                    }
                });

                setFormData(formDataToSet);
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
        console.log('🔍 ProfilePage: handleInputChange called:', { name, value, eventType: e.type });
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            console.log('🔍 ProfilePage: FormData updated:', { name, oldValue: prev[name], newValue: value, fullFormData: updated });
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Send flat structure instead of nested objects
            // Note: Email and transportationArea fields removed as they're not allowed by backend
            const updateData = {
                fullName: formData.fullName,
                phone: formData.phone,
                studentId: formData.studentId,
                university: formData.university,
                transportationMethod: formData.transportationMethod,
                address: formData.transportationArea // Map transportationArea to address for backend compatibility
            };

            console.log('📤 Sending profile update data:', updateData);
            console.log('🔍 Debug - All formData fields (email and transportationArea excluded from backend):', {
                fullName: formData.fullName,
                phone: formData.phone,
                studentId: formData.studentId,
                university: formData.university,
                transportationMethod: formData.transportationMethod,
                transportationArea: formData.transportationArea,
                note: 'transportationArea mapped to address field for backend'
            });

            const result = await apiService.updateDriverProfile(updateData);
            console.log('📥 Profile update response:', result);

            if (result.success) {
                toast.success('Profile updated successfully!');

                // Update the local profile state immediately to reflect changes
                // Note: Email field not updated locally since it's not sent to backend
                setProfile(prevProfile => {
                    const updatedProfile = {
                        ...prevProfile,
                        profile: {
                            ...prevProfile?.profile,
                            personalDetails: {
                                ...prevProfile?.profile?.personalDetails,
                                fullName: formData.fullName,
                                phone: formData.phone
                                // Email field intentionally omitted - not sent to backend
                            },
                            studentInfo: {
                                ...prevProfile?.profile?.studentInfo,
                                studentId: formData.studentId,
                                university: formData.university
                            },
                            transportation: {
                                ...prevProfile?.profile?.transportation,
                                method: formData.transportationMethod,
                                area: formData.transportationArea
                            },
                            // Also update address field for backend consistency
                            address: formData.transportationArea
                        },
                        // Also update at root level if it exists
                        address: formData.transportationArea
                    };
                    console.log('🔄 Updated local profile state:', {
                        previousArea: prevProfile?.profile?.transportation?.area,
                        newArea: formData.transportationArea,
                        updatedProfile: updatedProfile
                    });
                    return updatedProfile;
                });

                setIsEditing(false);
                // Optionally fetch profile to ensure consistency, but don't wait for it
                fetchProfile();
            } else {
                throw new Error(result.message || 'Update failed');
            }
        } catch (error) {
            console.error('❌ Error updating profile:', error);

            // Show more specific error messages
            let errorMessage = 'Failed to update profile';
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
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
            transportationMethod: normalizeTransportationMethod(profile?.profile?.transportation?.method || ''),
            transportationArea: profile?.profile?.transportation?.area || ''
        });
        setIsEditing(false);
    };

    const handleDocumentUploaded = (documentType, documentData) => {
        console.log('📄 Document uploaded successfully:', { documentType, documentData });

        // Update the profile state with the new document
        setProfile(prevProfile => ({
            ...prevProfile,
            documents: {
                ...prevProfile.documents,
                [documentType]: documentData
            }
        }));

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
    }, [user, isAuthenticated, fetchProfile]);

    useEffect(() => {
        console.log('🔄 Component mounted, fetching profile options...');
        console.log('🔄 Current state - serviceAreas:', serviceAreas.length, 'transportationMethods:', transportationMethods.length);
        fetchProfileOptions();
    }, [fetchProfileOptions, serviceAreas.length, transportationMethods.length]);

    // Debug: Log when dropdown options change
    useEffect(() => {
        console.log('📋 Transportation methods updated:', transportationMethods);
        console.log('📋 Transportation methods structure:', transportationMethods.map(opt => ({
            value: opt.value,
            label: opt.label,
            type: typeof opt
        })));
    }, [transportationMethods]);

    useEffect(() => {
        console.log('📋 Service areas updated:', serviceAreas);
        console.log('📋 Service areas structure:', serviceAreas.map(opt => ({
            value: opt.value,
            label: opt.label,
            type: typeof opt
        })));
    }, [serviceAreas]);





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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                {/* Modern Header */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Profile</h1>
                            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage your account and delivery preferences</p>
                        </div>
                        <div className="flex items-center justify-center sm:justify-end">
                            {!isEditing && (
                                <>
                                    {/* Refresh button removed - WebSocket provides real-time updates */}
                                    <button
                                        onClick={() => {
                                            // Initialize form data with current profile values when editing starts
                                            setFormData({
                                                fullName: profile?.profile?.personalDetails?.fullName || '',
                                                email: profile?.profile?.personalDetails?.email || '',
                                                phone: profile?.profile?.personalDetails?.phone || '',
                                                studentId: profile?.profile?.studentInfo?.studentId || '',
                                                university: profile?.profile?.studentInfo?.university || '',
                                                transportationMethod: normalizeTransportationMethod(profile?.profile?.transportation?.method || ''),
                                                transportationArea: profile?.profile?.transportation?.area || ''
                                            });
                                            setIsEditing(true);
                                        }}
                                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base"
                                    >
                                        <PencilIcon className="w-4 h-4 mr-2" />
                                        Edit Profile
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status Toggle */}
                <StatusToggle />

                {/* Profile Overview Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
                    <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
                        {/* Profile Image Section */}
                        <div className="relative flex flex-col items-center">
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
                                        className={`flex items-center justify-center p-2 sm:p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all duration-200 cursor-pointer ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                                    >
                                        {isUploadingImage ? (
                                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className="mt-4 flex justify-center">
                                <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium shadow-sm ${isProfileComplete
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                    }`}>
                                    {isProfileComplete ? (
                                        <>
                                            <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                            Profile Complete
                                        </>
                                    ) : (
                                        <>
                                            <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                            {completionPercentage}% Complete
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1 w-full">
                            <div className="mb-4 sm:mb-6 text-center lg:text-left">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                                    {profile?.profile?.personalDetails?.fullName ?
                                        capitalizeName(profile.profile.personalDetails.fullName) :
                                        'Student Delivery Partner'
                                    }
                                </h2>
                                <p className="text-gray-600 flex items-center justify-center lg:justify-start text-sm sm:text-base">
                                    <EnvelopeIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                                    <span className="truncate">{profile?.profile?.personalDetails?.email}</span>
                                </p>
                                <p className="text-gray-500 text-sm mt-1 flex items-center justify-center lg:justify-start">
                                    <IdentificationIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                                    ID: {profile?.profile?.studentInfo?.studentId}
                                </p>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                                    <div className="flex items-center">
                                        <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                            <MapIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                        </div>
                                        <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                                            <p className="text-xs sm:text-sm text-gray-600">Service Area</p>
                                            <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                                {profile?.profile?.transportation?.area ?
                                                    capitalizeName(profile.profile.transportation.area) :
                                                    'Not Set'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                                    <div className="flex items-center">
                                        <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
                                            <TruckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                        </div>
                                        <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                                            <p className="text-xs sm:text-sm text-gray-600">Transport</p>
                                            <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                                {profile?.profile?.transportation?.method ?
                                                    capitalizeName(profile.profile.transportation.method) :
                                                    'Not Set'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
                                    <div className="flex items-center">
                                        <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                                            <AcademicCapIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                                        </div>
                                        <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                                            <p className="text-xs sm:text-sm text-gray-600">University</p>
                                            <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
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
                            <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 justify-center lg:justify-start">
                                {(() => {
                                    const verificationStatus = getVerificationStatus(profile);
                                    const isVerified = isDriverVerified(profile);

                                    // Debug verification status
                                    console.log('🔍 Verification status debug:', {
                                        isVerified,
                                        verificationStatus,
                                        profileVerification: profile?.verification,
                                        profileStatus: profile?.status,
                                        profileIsVerified: profile?.isVerified,
                                        profileVerified: profile?.verified,
                                        profileVerificationStatus: profile?.verificationStatus,
                                        profileAccountStatus: profile?.accountStatus,
                                        profileDocuments: profile?.documents,
                                        profileCompletion: profile?.profileCompletion,
                                        profileComplete: profile?.profileComplete
                                    });

                                    return (
                                        <>
                                            {isVerified ? (
                                                <div className="inline-flex items-center px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm">
                                                    <ShieldCheckIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                    Student Verified
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center px-2 sm:px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs sm:text-sm">
                                                    <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                    Verification Pending
                                                </div>
                                            )}
                                            {profile?.completion?.readyForDeliveries && (
                                                <div className="inline-flex items-center px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm">
                                                    <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                    Ready for Deliveries
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="mb-4 sm:mb-6">
                    <nav className="flex space-x-2 sm:space-x-4 lg:space-x-8 overflow-x-auto scrollbar-hide">
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
                                    className={`flex items-center space-x-1 sm:space-x-2 py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                                        ? 'border-green-500 text-green-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
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
                        <div className="p-4 sm:p-6 lg:p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                                {/* Profile Completion */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Profile Completion</h3>
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
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h3>
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
                        <div className="p-4 sm:p-6 lg:p-8">
                            <div className="mb-4 sm:mb-6">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Personal Details</h3>
                                <p className="text-gray-600 text-sm sm:text-base">Update your personal information and contact details</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                        {isEditing ? (
                                            <div className="relative">
                                                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <CapitalizedInput
                                                    type="text"
                                                    name="fullName"
                                                    value={formData.fullName}
                                                    onChange={(e) => {
                                                        console.log('🔍 ProfilePage: fullName CapitalizedInput onChange:', {
                                                            name: e.target.name,
                                                            value: e.target.value,
                                                            formDataFullName: formData.fullName,
                                                            isEditing: isEditing
                                                        });
                                                        handleInputChange(e);
                                                    }}
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
                                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="px-4 sm:px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
                                        >
                                            Cancel
                                        </button>
                                        <Button
                                            type="submit"
                                            loading={isSaving}
                                            loadingText="Saving..."
                                            icon={CheckIcon}
                                            className="px-4 sm:px-6 text-sm sm:text-base"
                                        >
                                            Save Changes
                                        </Button>
                                    </div>
                                )}
                            </form>
                        </div>
                    )}

                    {/* Academic Info Tab */}
                    {activeTab === 'academic' && (
                        <div className="p-4 sm:p-6 lg:p-8">
                            <div className="mb-4 sm:mb-6">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Academic Information</h3>
                                <p className="text-gray-600 text-sm sm:text-base">Update your student details and university information</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                                        {isEditing ? (
                                            <SearchableDropdown
                                                label="University"
                                                options={universities}
                                                value={formData.university}
                                                onChange={(value) => setFormData(prev => ({ ...prev, university: value }))}
                                                placeholder="Select University"
                                                searchPlaceholder="Search universities..."
                                                loading={false}
                                                emptyMessage="No universities available"
                                                allowClear={true}
                                            />
                                        ) : (
                                            <>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">University</label>
                                                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                                    <AcademicCapIcon className="w-5 h-5 text-gray-400 mr-3" />
                                                    <span className="text-gray-900">{profile?.profile?.studentInfo?.university || 'Not provided'}</span>
                                                </div>
                                            </>
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
                                        <Button
                                            type="submit"
                                            loading={isSaving}
                                            loadingText="Saving..."
                                            icon={CheckIcon}
                                            className="px-6"
                                        >
                                            Save Changes
                                        </Button>
                                    </div>
                                )}
                            </form>
                        </div>
                    )}

                    {/* Transportation Tab */}
                    {activeTab === 'transportation' && (
                        <div className="p-4 sm:p-6 lg:p-8">
                            <div className="mb-4 sm:mb-6">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Transportation Settings</h3>
                                <p className="text-gray-600 text-sm sm:text-base">Configure your delivery preferences and service area</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div>
                                        {isEditing ? (
                                            <SearchableDropdown
                                                label="Transportation Method"
                                                options={transportationMethods}
                                                value={formData.transportationMethod}
                                                onChange={(value) => {
                                                    console.log('🔍 ProfilePage: Transportation method changed to:', value);
                                                    setFormData(prev => ({ ...prev, transportationMethod: value }));
                                                }}
                                                placeholder="Select Transportation Method"
                                                searchPlaceholder="Search transportation methods..."
                                                loading={false}
                                                emptyMessage="No transportation methods available"
                                                allowClear={true}
                                            />
                                        ) : (
                                            <>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Transportation Method</label>
                                                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                                    <TruckIcon className="w-5 h-5 text-gray-400 mr-3" />
                                                    <span className="text-gray-900">
                                                        {profile?.profile?.transportation?.method ?
                                                            capitalizeName(profile.profile.transportation.method) :
                                                            'Not provided'
                                                        }
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div>
                                        {isEditing ? (
                                            <div>
                                                {console.log('🔍 ProfilePage: Service areas options:', serviceAreas)}
                                                {console.log('🔍 ProfilePage: Current formData.transportationArea:', formData.transportationArea)}
                                                <SearchableDropdown
                                                    label="Service Area"
                                                    options={serviceAreas}
                                                    value={formData.transportationArea}
                                                    onChange={(value) => {
                                                        console.log('🔍 ProfilePage: Service area changed to:', value);
                                                        console.log('🔍 ProfilePage: Previous formData:', formData);
                                                        setFormData(prev => {
                                                            const updated = { ...prev, transportationArea: value };
                                                            console.log('🔍 ProfilePage: Updated formData:', updated);
                                                            console.log('🔍 ProfilePage: TransportationArea specifically:', updated.transportationArea);
                                                            return updated;
                                                        });
                                                    }}
                                                    placeholder="Select Service Area"
                                                    searchPlaceholder="Search service areas..."
                                                    loading={false}
                                                    emptyMessage="No service areas available"
                                                    allowClear={true}
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Service Area</label>
                                                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                                    <MapPinIcon className="w-5 h-5 text-gray-400 mr-3" />
                                                    <span className="text-gray-900">
                                                        {profile?.profile?.transportation?.area ?
                                                            capitalizeName(profile.profile.transportation.area) :
                                                            'Not provided'
                                                        }
                                                    </span>
                                                </div>
                                            </>
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
                                        <Button
                                            type="submit"
                                            loading={isSaving}
                                            loadingText="Saving..."
                                            icon={CheckIcon}
                                            className="px-6"
                                        >
                                            Save Changes
                                        </Button>
                                    </div>
                                )}
                            </form>
                        </div>
                    )}

                    {/* Documents Tab */}
                    {activeTab === 'documents' && (
                        <div className="p-4 sm:p-6 lg:p-8">
                            <div className="mb-4 sm:mb-6">
                                <div>
                                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Document Verification</h3>
                                    <p className="text-gray-600 text-sm sm:text-base">Upload required documents for account verification</p>
                                </div>
                            </div>

                            {/* Document Status Summary */}
                            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
                                    <h4 className="text-base sm:text-lg font-medium text-gray-900">Document Status</h4>
                                    <button
                                        onClick={async () => {
                                            console.log('🔄 Manually refreshing document status...');
                                            console.log('📋 Current documents state:', profile?.documents);
                                            await fetchProfile(true);
                                            toast.success('Document status refreshed!');
                                        }}
                                        className="inline-flex items-center px-3 py-1.5 border border-green-300 rounded-md shadow-sm text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                        <ArrowPathIcon className="w-3 h-3 mr-1" />
                                        Refresh Status
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                    {[
                                        { key: 'studentId', label: 'Student ID', required: true },
                                        { key: 'profilePhoto', label: 'Profile Photo', required: true },
                                        { key: 'passportPhoto', label: 'Passport Photo', required: true }
                                    ].map((doc) => {
                                        const document = profile?.documents?.[doc.key];
                                        const isUploaded = document && document.status !== 'missing';
                                        const isVerified = document?.status === 'verified';
                                        const isPending = document?.status === 'pending';

                                        // Debug logging for document status
                                        console.log(`📄 Document ${doc.key}:`, {
                                            document,
                                            status: document?.status,
                                            isUploaded,
                                            isVerified,
                                            isPending,
                                            uploadDate: document?.uploadDate
                                        });

                                        return (
                                            <div key={doc.key} className="flex items-center p-3 border border-gray-200 rounded-lg">
                                                <div className="flex-shrink-0 mr-3">
                                                    {isVerified ? (
                                                        <CheckCircleIcon className="w-6 h-6 text-green-500" />
                                                    ) : isUploaded ? (
                                                        <ClockIcon className="w-6 h-6 text-yellow-500" />
                                                    ) : (
                                                        <DocumentTextIcon className="w-6 h-6 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900">{doc.label}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {isVerified ? 'Verified' :
                                                            isUploaded ? 'Pending Verification' :
                                                                doc.required ? 'Required' : 'Optional'}
                                                    </p>
                                                    {document?.uploadDate && (
                                                        <p className="text-xs text-gray-400">
                                                            Uploaded: {new Date(document.uploadDate).toLocaleDateString('en-US')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Document Upload Component */}
                            <DocumentUpload
                                documents={profile?.documents || {}}
                                onDocumentUploaded={handleDocumentUploaded}
                                user={user}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DriverProfilePage;
