import React, { useState } from 'react';
import {
    DocumentArrowUpIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    PhotoIcon,
    IdentificationIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/api';
import { compressImage } from '../../services/cloudinaryService';
import notificationManager from '../../services/notificationManager';
import AIVerificationStatus from './AIVerificationStatus';

const DocumentUpload = ({ documents = {}, onDocumentUploaded, user }) => {
    const [uploading, setUploading] = useState({});
    const [uploadingAll, setUploadingAll] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState({});
    const [aiVerification, setAiVerification] = useState({});
    const [showAiVerification, setShowAiVerification] = useState(false);

    // Document type configuration
    const documentTypes = [
        {
            key: 'studentId',
            label: 'Student ID',
            description: 'Upload your current student identification card',
            required: true,
            icon: IdentificationIcon,
            acceptedTypes: 'image/*', // Changed: Only images allowed
            fileTypeHint: 'JPEG, PNG, or WebP image'
        },
        {
            key: 'profilePhoto',
            label: 'Profile Photo',
            description: 'Upload a clear photo of yourself',
            required: true,
            icon: PhotoIcon,
            acceptedTypes: 'image/*',
            fileTypeHint: 'JPEG, PNG, or WebP image'
        },
        {
            key: 'passportPhoto',
            label: 'Passport Photo',
            description: 'Upload your passport photo or national identity card',
            required: true,
            icon: IdentificationIcon,
            acceptedTypes: 'image/*', // Changed: Only images allowed
            fileTypeHint: 'JPEG, PNG, or WebP image'
        },

    ];



    // Handle AI verification completion
    const handleAIVerificationComplete = (documentType, result) => {
        console.log(`🤖 AI verification completed for ${documentType}:`, result);

        setAiVerification(prev => ({
            ...prev,
            [documentType]: result
        }));

        // Show success message based on verification result
        if (result.verification?.isAuthentic) {
            notificationManager.showToast(`✅ ${documentTypes.find(d => d.key === documentType)?.label} verified by AI!`, 'success');
        } else {
            notificationManager.showToast(`❌ ${documentTypes.find(d => d.key === documentType)?.label} verification failed. Please check the issues.`, 'error');
        }
    };

    // Upload all selected documents at once
    const handleUploadAll = async () => {
        const filesToUpload = Object.keys(selectedFiles).filter(key => selectedFiles[key]);

        if (filesToUpload.length === 0) {
            notificationManager.showToast('Please select at least one document to upload', 'error');
            return;
        }

        setUploadingAll(true);

        try {
            // Upload files sequentially to avoid overwhelming the server
            let successCount = 0;
            let errorMessages = [];

            for (const documentType of filesToUpload) {
                try {
                    const file = selectedFiles[documentType];

                    // Validate file type
                    if (!file.type.startsWith('image/')) {
                        throw new Error(`${documentTypes.find(d => d.key === documentType)?.label}: Only image files (JPEG, PNG, WebP) are allowed. PDF files are not supported.`);
                    }

                    // Validate file size
                    if (file.size > 5 * 1024 * 1024) {
                        throw new Error(`${documentTypes.find(d => d.key === documentType)?.label}: File size must be less than 5MB`);
                    }

                    let fileToUpload = file;

                    // Compress images before upload
                    if (file.type.startsWith('image/')) {
                        try {
                            fileToUpload = await compressImage(file, 1200, 1200, 0.8);
                        } catch (compressionError) {
                            console.warn(`⚠️ Image compression failed for ${documentType}:`, compressionError);
                            fileToUpload = file;
                        }
                    }

                    const formData = new FormData();
                    formData.append('file', fileToUpload);

                    console.log(`📤 Uploading ${documentType} document...`);
                    const response = await apiService.uploadDriverDocument(documentType, formData);

                    if (response.success) {
                        successCount++;
                        // Clear the selected file
                        setSelectedFiles(prev => {
                            const newState = { ...prev };
                            delete newState[documentType];
                            return newState;
                        });
                        // Notify parent component
                        if (onDocumentUploaded) {
                            onDocumentUploaded(documentType, response.data);
                        }
                        console.log(`✅ Successfully uploaded ${documentType}`);
                    } else {
                        throw new Error(`${documentTypes.find(d => d.key === documentType)?.label}: ${response.message || 'Upload failed'}`);
                    }

                    // Add a small delay between uploads to prevent overwhelming the server
                    await new Promise(resolve => setTimeout(resolve, 500));

                } catch (error) {
                    console.error(`❌ Error uploading ${documentType}:`, error);
                    const errorMessage = error.message || 'Upload failed';
                    errorMessages.push(errorMessage);
                }
            }

            if (successCount > 0) {
                notificationManager.showToast(`✅ Successfully uploaded ${successCount} document${successCount > 1 ? 's' : ''}!`, 'success');
            }

            if (errorMessages.length > 0) {
                notificationManager.showToast(`❌ Upload errors:\n${errorMessages.join('\n')}`, 'error');
            }

        } catch (error) {
            console.error('❌ Error in bulk upload:', error);
            notificationManager.showToast(`Upload failed: ${error.message}`, 'error');
        } finally {
            setUploadingAll(false);
        }
    };

    const handleFileSelect = (documentType, event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type immediately
            if (!file.type.startsWith('image/')) {
                notificationManager.showToast(`❌ Invalid file type for ${documentTypes.find(d => d.key === documentType)?.label}. Only image files (JPEG, PNG, WebP) are allowed. PDF files are not supported.`, 'error');
                event.target.value = ''; // Clear the input
                return;
            }

            // Validate file size immediately
            if (file.size > 5 * 1024 * 1024) {
                notificationManager.showToast(`❌ File too large for ${documentTypes.find(d => d.key === documentType)?.label}. Maximum size is 5MB.`, 'error');
                event.target.value = ''; // Clear the input
                return;
            }

            setSelectedFiles(prev => ({
                ...prev,
                [documentType]: file
            }));
        }
    };

    const handleUpload = async (documentType) => {
        const file = selectedFiles[documentType];
        if (!file) {
            notificationManager.showToast('Please select a file first', 'error');
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            notificationManager.showToast('File size must be less than 5MB', 'error');
            return;
        }

        // Validate file type
        const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
        if (!isValidType) {
            notificationManager.showToast('Please select an image (JPEG, PNG, WebP) or PDF file', 'error');
            return;
        }

        setUploading(prev => ({ ...prev, [documentType]: true }));

        try {
            let fileToUpload = file;

            // Compress images before upload (except PDFs)
            if (file.type.startsWith('image/')) {
                console.log(`🔄 Compressing ${documentType} image...`);
                try {
                    fileToUpload = await compressImage(file, 1200, 1200, 0.8);
                    console.log(`✅ Image compressed: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) → ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`);
                } catch (compressionError) {
                    console.warn(`⚠️ Image compression failed, using original:`, compressionError);
                    fileToUpload = file;
                }
            }

            const formData = new FormData();
            formData.append('file', fileToUpload); // Backend expects 'file' field

            console.log(`📤 Uploading ${documentType} document...`);
            console.log('📋 FormData contents:', {
                hasFile: formData.has('file'),
                fileName: fileToUpload.name,
                fileSize: fileToUpload.size,
                fileType: fileToUpload.type,
                documentType: documentType,
                uploadEndpoint: `/driver/documents/${documentType}/upload`
            });

            const response = await apiService.uploadDriverDocument(documentType, formData);

            if (response.success) {
                notificationManager.showToast(`${documentTypes.find(d => d.key === documentType)?.label} uploaded successfully!`, 'success');

                // Clear the selected file
                setSelectedFiles(prev => {
                    const newState = { ...prev };
                    delete newState[documentType];
                    return newState;
                });

                // Notify parent component to refresh profile data
                if (onDocumentUploaded) {
                    onDocumentUploaded(documentType, response.data);
                }
            } else {
                throw new Error(response.message || 'Upload failed');
            }
        } catch (error) {
            console.error(`❌ Error uploading ${documentType}:`, error);
            console.error('Error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
                endpoint: `/driver/documents/${documentType}/upload`
            });

            let errorMessage = 'Upload failed';
            if (error.response?.status === 400) {
                errorMessage = 'Invalid document format or missing required fields';
            } else if (error.response?.status === 401) {
                errorMessage = 'Please log in again to upload documents';
            } else if (error.response?.status === 413) {
                errorMessage = 'Document file is too large. Please select a smaller file.';
            } else if (error.response?.status === 404) {
                errorMessage = 'Document upload service not available. Please try again later.';
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }

            notificationManager.showToast(`Upload failed: ${errorMessage}`, 'error');
        } finally {
            setUploading(prev => ({ ...prev, [documentType]: false }));
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'verified':
                return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
            case 'rejected':
                return <XCircleIcon className="w-5 h-5 text-red-600" />;
            case 'pending':
                return <ClockIcon className="w-5 h-5 text-yellow-600" />;
            default:
                return <ExclamationTriangleIcon className="w-5 h-5 text-gray-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'verified':
                return 'bg-green-50 text-green-700 border-green-200';
            case 'rejected':
                return 'bg-red-50 text-red-700 border-red-200';
            case 'pending':
                return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'verified':
                return 'Verified';
            case 'rejected':
                return 'Rejected';
            case 'pending':
                return 'Pending Review';
            default:
                return 'Not Uploaded';
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6 space-y-4 lg:space-y-0">
                    <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Document Verification</h3>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            Upload required documents to complete your verification
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                        {/* AI Verification Toggle */}
                        <div className="flex items-center space-x-2">
                            <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showAiVerification}
                                    onChange={(e) => setShowAiVerification(e.target.checked)}
                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-xs sm:text-sm font-medium text-gray-700">AI Verification</span>
                            </label>
                        </div>

                        {/* Upload All Button */}
                        {Object.keys(selectedFiles).filter(key => selectedFiles[key]).length > 0 && (
                            <button
                                onClick={handleUploadAll}
                                disabled={uploadingAll}
                                className="px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 w-full sm:w-auto"
                            >
                                {uploadingAll ? (
                                    <>
                                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Uploading All...</span>
                                    </>
                                ) : (
                                    <>
                                        <DocumentArrowUpIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span>Upload All ({Object.keys(selectedFiles).filter(key => selectedFiles[key]).length})</span>
                                    </>
                                )}
                            </button>
                        )}

                        {/* Document Count */}
                        <div className="text-center sm:text-right">
                            <p className="text-xs sm:text-sm text-gray-600">Documents Verified</p>
                            <p className="text-xl sm:text-2xl font-bold text-green-600">
                                {Object.values(documents).filter(doc => doc?.status === 'verified').length}/
                                {documentTypes.filter(doc => doc.required).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {documentTypes.map((docType) => {
                        // Skip transportation license if not required
                        if (false) { // Removed transportation license logic
                            return null;
                        }

                        const document = documents[docType.key];
                        const status = document?.status || 'not_uploaded';
                        const isUploading = uploading[docType.key];
                        const hasSelectedFile = selectedFiles[docType.key];
                        const IconComponent = docType.icon;

                        return (
                            <div key={docType.key} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                                    <div className="flex items-start space-x-3 flex-1">
                                        <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg flex-shrink-0">
                                            <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                                                <h4 className="font-medium text-gray-900 text-sm sm:text-base">{docType.label}</h4>
                                                {docType.required && (
                                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full self-start">
                                                        Required
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs sm:text-sm text-gray-600 mb-2">{docType.description}</p>

                                            {/* Status Display */}
                                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-3">
                                                <div className="flex items-center space-x-2">
                                                    {getStatusIcon(status)}
                                                    <span className={`text-xs sm:text-sm px-2 py-0.5 sm:py-1 rounded-full border ${getStatusColor(status)}`}>
                                                        {getStatusText(status)}
                                                    </span>
                                                </div>
                                                {document?.uploadDate && (
                                                    <span className="text-xs text-gray-500">
                                                        Uploaded: {new Date(document.uploadDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Rejection Reason */}
                                            {status === 'rejected' && document?.rejectionReason && (
                                                <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 mb-3">
                                                    <p className="text-xs sm:text-sm text-red-700">
                                                        <strong>Rejection Reason:</strong> {document.rejectionReason}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Upload Section - Show if not verified */}
                                            {status !== 'verified' && (
                                                <div className="space-y-2 sm:space-y-3">
                                                    <div className="flex flex-col space-y-2">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleFileSelect(docType.key, e)}
                                                            className="block w-full text-xs sm:text-sm text-gray-500 file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                                            disabled={isUploading}
                                                        />
                                                    </div>
                                                    {hasSelectedFile && (
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                                                            <p className="text-xs text-gray-600 truncate">
                                                                Selected: {selectedFiles[docType.key]?.name}
                                                                ({(selectedFiles[docType.key]?.size / 1024 / 1024).toFixed(2)} MB)
                                                            </p>
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                                                    Ready to upload
                                                                </span>
                                                                <button
                                                                    onClick={() => handleUpload(docType.key)}
                                                                    disabled={isUploading}
                                                                    className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                                                >
                                                                    {isUploading ? (
                                                                        <>
                                                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                            <span>Uploading...</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <DocumentArrowUpIcon className="w-3 h-3" />
                                                                            <span>Upload</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <p className="text-xs text-gray-500">
                                                        📷 Accepted: JPEG, PNG, WebP images only (max 5MB)
                                                    </p>
                                                </div>
                                            )}

                                            {/* Success Message */}
                                            {status === 'verified' && (
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3">
                                                    <p className="text-xs sm:text-sm text-green-700 flex items-center space-x-2">
                                                        <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                                        <span>Document verified successfully!</span>
                                                    </p>
                                                </div>
                                            )}

                                            {/* AI Verification Status */}
                                            {showAiVerification && aiVerification[docType.key] && (
                                                <div className="mt-4">
                                                    <AIVerificationStatus
                                                        documentType={docType.key}
                                                        file={selectedFiles[docType.key]}
                                                        userId={user?.id}
                                                        onVerificationComplete={(result) => handleAIVerificationComplete(docType.key, result)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Help Text */}
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                        <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-blue-800 mb-1 sm:mb-2">Document Upload Guidelines</p>
                            <ul className="text-xs text-blue-700 space-y-0.5 sm:space-y-1">
                                <li>• <strong>Accepted formats:</strong> JPEG, PNG, WebP images only</li>
                                <li>• <strong>Not accepted:</strong> PDF files are not supported</li>
                                <li>• <strong>Maximum file size:</strong> 5MB per document</li>
                                <li>• <strong>Image compression:</strong> Images are automatically compressed for faster upload</li>
                                <li>• <strong>Bulk upload:</strong> Select multiple documents and upload all at once</li>
                                <li>• <strong>AI Verification:</strong> Enable for instant document analysis</li>
                                <li>• <strong>Document quality:</strong> Ensure documents are clear and readable</li>
                                <li>• <strong>Review process:</strong> Documents will be reviewed by admin team</li>
                                <li>• <strong>Notifications:</strong> You'll be notified once verification is complete</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentUpload;
