import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/api';
import VerifiedBadge from '../../components/common/VerifiedBadge';
import { isDriverVerified } from '../../utils/verificationHelpers';
import Pagination from '../../components/common/Pagination';
import DocumentSkeleton from '../../components/common/DocumentSkeleton';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import {
    DocumentMagnifyingGlassIcon,
    ArrowPathIcon,
    FunnelIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    UserIcon,
    CloudArrowUpIcon,
    DocumentArrowUpIcon,
    SparklesIcon,
    XMarkIcon,
    IdentificationIcon,
    PhotoIcon,
} from '@heroicons/react/24/outline';

const DocumentVerificationPage = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, verified, rejected
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [processingAction, setProcessingAction] = useState(null);
    const [uploadingDocument, setUploadingDocument] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [errorShown, setErrorShown] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Document type icons
    const documentIcons = {
        studentId: IdentificationIcon,
        profilePhoto: PhotoIcon,
        passportPhoto: IdentificationIcon
    };

    // Document type labels
    const documentLabels = {
        studentId: 'Student ID',
        profilePhoto: 'Profile Photo',
        passportPhoto: 'Passport Photo'
    };

    const loadDocuments = useCallback(async () => {
        try {
            setLoading(true);
            console.log('📄 DocumentVerificationPage: Loading documents with filter:', filter);

            const response = await apiService.getPendingDocuments({
                status: filter === 'all' ? undefined : filter,
                page: currentPage,
                limit: itemsPerPage
            });

            console.log('📄 DocumentVerificationPage: Documents API response:', response);

            if (response && response.success) {
                // Handle the correct response structure: response.data.documents
                const documentsData = response.data?.documents || response.data || response.documents || [];
                const documentsArray = Array.isArray(documentsData) ? documentsData : [];

                console.log('📄 DocumentVerificationPage: Setting documents array:', documentsArray);
                // Debug: Log the first document structure to understand available fields
                if (documentsArray.length > 0) {
                    console.log('📄 DocumentVerificationPage: First document structure:', documentsArray[0]);
                    console.log('📄 DocumentVerificationPage: All available fields:', Object.keys(documentsArray[0]));
                    console.log('📄 DocumentVerificationPage: Checking document URL fields:');
                    console.log('  - fileUrl:', documentsArray[0].fileUrl);
                    console.log('  - documentUrl:', documentsArray[0].documentUrl);
                    console.log('  - url:', documentsArray[0].url);
                    console.log('  - file:', documentsArray[0].file);
                    console.log('  - uploadUrl:', documentsArray[0].uploadUrl);
                    console.log('  - cloudinaryUrl:', documentsArray[0].cloudinaryUrl);
                    console.log('  - imageUrl:', documentsArray[0].imageUrl);

                    // Enhanced debugging for file URL detection
                    console.log('🔍 DocumentVerificationPage: File URL analysis:');
                    const doc = documentsArray[0];
                    const possibleUrlFields = ['fileUrl', 'documentUrl', 'url', 'imageUrl', 'cloudinaryUrl', 'uploadUrl', 'file'];
                    possibleUrlFields.forEach(field => {
                        console.log(`  - ${field}:`, doc[field] ? `✅ ${doc[field]}` : '❌ undefined/null');
                    });
                }

                // ENHANCED LOGIC: Fix the needsUpload field based on multiple upload indicators
                const correctedDocuments = documentsArray.map(document => {
                    const hasUploadDate = document.uploadDate && document.uploadDate !== null;
                    const hasCreatedAt = document.createdAt && document.createdAt !== null;
                    const hasSubmittedAt = document.submittedAt && document.submittedAt !== null;
                    const hasUploadedAt = document.uploadedAt && document.uploadedAt !== null;
                    const hasDate = document.date && document.date !== null;

                    // Check if document has any upload-related timestamp
                    const hasAnyUploadTimestamp = hasUploadDate || hasCreatedAt || hasSubmittedAt || hasUploadedAt || hasDate;

                    // If document has any upload timestamp, it doesn't need upload
                    const correctedNeedsUpload = !hasAnyUploadTimestamp;

                    return {
                        ...document,
                        needsUpload: correctedNeedsUpload
                    };
                });

                console.log('🔧 DocumentVerificationPage: Corrected documents with proper needsUpload logic');
                setDocuments(correctedDocuments);
                setTotalItems(response.data?.pagination?.total || response.totalItems || documentsArray.length);
                setTotalPages(response.data?.pagination?.totalPages || response.totalPages || 1);
                setErrorShown(false); // Reset error state on success
            } else {
                console.warn('📄 DocumentVerificationPage: Backend returned unsuccessful response:', response);
                setDocuments([]);
                setTotalItems(0);
                setTotalPages(1);
                if (!errorShown) {
                    setErrorShown(true);
                    toast.error('Failed to load documents');
                }
            }
        } catch (error) {
            console.error('❌ DocumentVerificationPage: Error loading documents:', error);
            console.error('❌ DocumentVerificationPage: Error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });

            // Only show error toast once to prevent spam
            if (!errorShown) {
                setErrorShown(true);

                // Show user-friendly error message
                if (error.response?.status === 400) {
                    toast.error('Documents failed: Invalid filter parameter.');
                } else if (error.response?.status === 401) {
                    toast.error('Documents failed: Authentication required. Please log in again.');
                    // Redirect to login if authentication fails
                    setTimeout(() => {
                        window.location.href = '/admin/login';
                    }, 2000);
                } else if (error.response?.status === 403) {
                    toast.error('Documents failed: Permission denied. Please check your admin privileges.');
                } else if (error.response?.status === 404) {
                    toast.error('Documents endpoint not found. Backend may not be ready yet.');
                } else if (error.response?.status === 500) {
                    toast.error('Documents failed: Server error. Please try again later.');
                } else {
                    // For network errors or other issues, show a more specific message
                    if (error.message.includes('Network Error')) {
                        toast.error('Cannot connect to server. Please check your connection.');
                    } else {
                        toast.error('Failed to load documents. Please try again.');
                    }
                }
            }

            // Set empty state instead of crashing
            setDocuments([]);
            setTotalItems(0);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [filter, currentPage, itemsPerPage, errorShown]);

    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

    const getStatusInfo = (status) => {
        switch (status) {
            case 'pending':
                return {
                    icon: ClockIcon,
                    color: 'text-yellow-600 bg-yellow-50',
                    label: 'Pending Review'
                };
            case 'ai_processing':
                return {
                    icon: SparklesIcon,
                    color: 'text-blue-600 bg-blue-50',
                    label: 'AI Processing'
                };
            case 'verified':
                return {
                    icon: CheckCircleIcon,
                    color: 'text-green-600 bg-green-50',
                    label: 'Verified'
                };
            case 'rejected':
                return {
                    icon: XCircleIcon,
                    color: 'text-red-600 bg-red-50',
                    label: 'Rejected'
                };
            default:
                return {
                    icon: ClockIcon,
                    color: 'text-gray-600 bg-gray-50',
                    label: 'Unknown'
                };
        }
    };

    const handleVerifyDocument = async (documentId) => {
        try {
            setProcessingAction(documentId);
            const result = await apiService.verifyDocument(documentId);

            if (result && result.success) {
                toast.success(`Document ${result.data?.status || 'verified'} successfully`);
                loadDocuments();
            } else {
                toast.error('Failed to verify document');
            }
        } catch (error) {
            console.error('Error verifying document:', error);
            if (error.response?.status === 404) {
                toast.error('Document verification endpoint not available yet. Backend needs to implement this feature.');
            } else if (error.response?.status === 400) {
                toast.error('Invalid document data provided.');
            } else if (error.response?.status === 401) {
                toast.error('Authentication required for document verification.');
            } else if (error.response?.status === 403) {
                toast.error('Permission denied for document verification.');
            } else {
                toast.error('Failed to verify document. Please try again.');
            }
        } finally {
            setProcessingAction(null);
        }
    };

    const handleRejectDocument = async (documentId, reason) => {
        try {
            setProcessingAction(documentId);
            const result = await apiService.rejectDocument(documentId, reason);

            if (result && result.success) {
                toast.success(`Document ${result.data?.status || 'rejected'} successfully`);
                loadDocuments();
            } else {
                toast.error('Failed to reject document');
            }
        } catch (error) {
            console.error('Error rejecting document:', error);
            if (error.response?.status === 404) {
                toast.error('Document rejection endpoint not available yet. Backend needs to implement this feature.');
            } else if (error.response?.status === 400) {
                toast.error('Invalid rejection reason provided.');
            } else if (error.response?.status === 401) {
                toast.error('Authentication required for document rejection.');
            } else if (error.response?.status === 403) {
                toast.error('Permission denied for document rejection.');
            } else {
                toast.error('Failed to reject document. Please try again.');
            }
        } finally {
            setProcessingAction(null);
        }
    };

    const handleViewDocument = (document) => {
        setSelectedDocument(document);
        setShowDocumentModal(true);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Document upload functionality
    const handleUploadDocument = async (documentId, documentType, file) => {
        try {
            setUploadingDocument(documentId);
            console.log('📤 DocumentVerificationPage: Uploading document:', documentType, 'for document ID:', documentId);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('documentType', documentType);

            // Use the driver document upload endpoint
            const response = await apiService.uploadDriverDocument(documentType, formData);

            if (response && response.success) {
                toast.success('Document uploaded successfully');
                loadDocuments(); // Refresh the documents list
            } else {
                toast.error('Failed to upload document');
            }
        } catch (error) {
            console.error('❌ DocumentVerificationPage: Error uploading document:', error);
            toast.error('Failed to upload document. Please try again.');
        } finally {
            setUploadingDocument(null);
        }
    };

    // Helper function to get document URL
    const getDocumentUrl = (document) => {
        return document.documentUrl || document.fileUrl || document.url || document.imageUrl || document.cloudinaryUrl;
    };

    // Helper function to check document status
    const getDocumentStatus = (document) => {
        // Check for multiple possible file URL field names (backend might use different field names)
        const possibleFileFields = [
            document.fileUrl,
            document.documentUrl,
            document.url,
            document.file,
            document.uploadUrl,
            document.cloudinaryUrl,
            document.imageUrl
        ];

        const hasFile = possibleFileFields.some(field =>
            field && (field.includes('cloudinary.com') || field.includes('http'))
        );

        // ENHANCED LOGIC: Check multiple fields that indicate document has been uploaded
        const hasUploadDate = document.uploadDate && document.uploadDate !== null;
        const hasCreatedAt = document.createdAt && document.createdAt !== null;
        const hasSubmittedAt = document.submittedAt && document.submittedAt !== null;
        const hasUploadedAt = document.uploadedAt && document.uploadedAt !== null;
        const hasDate = document.date && document.date !== null;

        // Check if document has any upload-related timestamp
        const hasAnyUploadTimestamp = hasUploadDate || hasCreatedAt || hasSubmittedAt || hasUploadedAt || hasDate;

        // Check if document has any file URL or upload timestamp
        const hasFileOrUploadTimestamp = hasFile || hasAnyUploadTimestamp;

        const needsUpload = !hasFileOrUploadTimestamp && document.status === 'pending';
        const canVerify = hasFileOrUploadTimestamp && document.status === 'pending';

        // Debug logging for document status
        if (document.documentType === 'passportPhoto') {
            console.log('🔍 DocumentVerificationPage: Passport Photo document status check:', {
                documentType: document.documentType,
                fileUrl: document.fileUrl,
                documentUrl: document.documentUrl,
                uploadDate: document.uploadDate,
                hasFile,
                hasUploadDate,
                hasFileOrUploadTimestamp,
                needsUpload,
                canVerify,
                status: document.status
            });
        }

        return {
            hasFile: hasFileOrUploadTimestamp, // Use the enhanced logic
            needsUpload,
            canVerify,
            isVerified: document.status === 'verified',
            isRejected: document.status === 'rejected',
            isProcessing: document.status === 'ai_processing'
        };
    };

    return (
        <>
            <div className="space-y-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Document Verification</h1>
                            <p className="text-sm text-gray-600 mt-1">Review and verify driver documents with AI assistance</p>
                        </div>
                        <button
                            onClick={loadDocuments}
                            disabled={loading}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded text-xs font-medium text-white bg-gradient-primary hover:opacity-90 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all duration-200"
                        >
                            <ArrowPathIcon className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Document Summary */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{documents.length}</div>
                            <div className="text-xs text-gray-500">Total Documents</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                                {documents.filter(doc => getDocumentStatus(doc).needsUpload).length}
                            </div>
                            <div className="text-xs text-gray-500">Need Upload</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {documents.filter(doc => getDocumentStatus(doc).canVerify).length}
                            </div>
                            <div className="text-xs text-gray-500">Ready to Verify</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {documents.filter(doc => getDocumentStatus(doc).isVerified).length}
                            </div>
                            <div className="text-xs text-gray-500">Verified</div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center space-x-3">
                        <FunnelIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-xs font-medium text-gray-700">Filter by status:</span>
                        <div className="flex space-x-2">
                            {[
                                { key: 'all', label: 'All Documents' },
                                { key: 'pending', label: 'Pending Review' },
                                { key: 'ai_processing', label: 'AI Processing' },
                                { key: 'verified', label: 'Verified' },
                                { key: 'rejected', label: 'Rejected' }
                            ].map((filterOption) => (
                                <button
                                    key={filterOption.key}
                                    onClick={() => setFilter(filterOption.key)}
                                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${filter === filterOption.key
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {filterOption.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Documents List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {loading ? (
                        <DocumentSkeleton count={8} />
                    ) : !Array.isArray(documents) ? (
                        <div className="p-6 text-center">
                            <ExclamationTriangleIcon className="h-8 w-8 text-red-400 mx-auto" />
                            <h3 className="text-sm font-medium text-gray-900 mt-2">Invalid Data</h3>
                            <p className="text-xs text-gray-600 mt-1">Documents data is not in the expected format.</p>
                            <button
                                onClick={loadDocuments}
                                className="mt-3 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                            >
                                Retry Loading
                            </button>
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="p-6 text-center">
                            <DocumentMagnifyingGlassIcon className="h-8 w-8 text-gray-400 mx-auto" />
                            <h3 className="text-sm font-medium text-gray-900 mt-2">No documents found</h3>
                            <p className="text-xs text-gray-600 mt-1">No documents match the current filter criteria.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {documents.map((document, index) => {
                                const Icon = documentIcons[document.documentType] || DocumentMagnifyingGlassIcon;
                                const statusInfo = getStatusInfo(document.status);
                                const StatusIcon = statusInfo.icon;

                                return (
                                    <div key={document._id || document.id || `document-${index}`} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                {/* Document Icon */}
                                                <div className="flex-shrink-0">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                        <Icon className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                </div>

                                                {/* Document Info */}
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="text-sm font-medium text-gray-900">
                                                            {documentLabels[document.documentType] || 'Unknown Document'}
                                                        </h3>
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                                            <StatusIcon className="w-3 h-3 mr-1" />
                                                            {statusInfo.label}
                                                        </span>
                                                        {/* Status indicators */}
                                                        {document.needsUpload && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                                <DocumentArrowUpIcon className="w-3 h-3 mr-1" />
                                                                Needs Upload
                                                            </span>
                                                        )}
                                                        {!document.needsUpload && document.status === 'pending' && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                                <CheckCircleIcon className="w-3 h-3 mr-1" />
                                                                Ready to Verify
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-4 mt-1">
                                                        <div className="flex items-center space-x-1">
                                                            <UserIcon className="h-3 w-3 text-gray-400" />
                                                            <span className="text-xs text-gray-600">{document.driverName || 'Unknown Driver'}</span>
                                                            <VerifiedBadge
                                                                isVerified={isDriverVerified(document)}
                                                                size="xs"
                                                                className="flex-shrink-0"
                                                            />
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <ClockIcon className="h-3 w-3 text-gray-400" />
                                                            <span className="text-xs text-gray-600">
                                                                {(() => {
                                                                    const dateField = document.submittedAt || document.createdAt || document.uploadedAt || document.uploadDate || document.date;
                                                                    if (dateField) {
                                                                        try {
                                                                            return new Date(dateField).toLocaleDateString();
                                                                        } catch (e) {
                                                                            return 'Invalid Date';
                                                                        }
                                                                    }
                                                                    return 'Unknown Date';
                                                                })()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center space-x-2">
                                                {document.needsUpload ? (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedDocument(document);
                                                                setShowUploadModal(true);
                                                            }}
                                                            disabled={uploadingDocument === (document._id || document.id)}
                                                            className="text-blue-600 hover:text-blue-900 p-1 disabled:opacity-50"
                                                            title="Upload Document"
                                                        >
                                                            {uploadingDocument === (document._id || document.id) ? (
                                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                                            ) : (
                                                                <CloudArrowUpIcon className="w-3 h-3" />
                                                            )}
                                                        </button>
                                                        <span className="text-xs text-red-600">
                                                            Upload required
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleViewDocument(document)}
                                                            className="text-blue-600 hover:text-blue-900 p-1"
                                                            title="View Document"
                                                        >
                                                            <EyeIcon className="w-3 h-3" />
                                                        </button>
                                                        {!document.needsUpload && document.status === 'pending' && (
                                                            <span className="text-xs text-green-600">
                                                                Ready to verify
                                                            </span>
                                                        )}
                                                        {document.uploadDate && !document.documentUrl && (
                                                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                                                ⚠️ File URL missing
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && documents.length > 0 && (
                        <div className="px-4 py-3 border-t border-gray-200">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                itemsPerPage={itemsPerPage}
                                onItemsPerPageChange={setItemsPerPage}
                                totalItems={totalItems}
                                startIndex={(currentPage - 1) * itemsPerPage + 1}
                                endIndex={Math.min(currentPage * itemsPerPage, totalItems)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Document Upload Modal */}
            {showUploadModal && selectedDocument && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="p-6">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Upload Document
                                </h2>
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Upload Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Document Type</label>
                                    <p className="text-sm text-gray-900 mt-1">
                                        {documentLabels[selectedDocument.documentType] || 'Unknown Document'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Driver</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-sm text-gray-900">
                                            {selectedDocument.driverName || 'Unknown Driver'}
                                        </p>
                                        <VerifiedBadge
                                            isVerified={isDriverVerified(selectedDocument)}
                                            size="sm"
                                            className="flex-shrink-0"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Select File</label>
                                    <div className="mt-2">
                                        <input
                                            type="file"
                                            id="document-file"
                                            accept="image/*,.pdf,.doc,.docx"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    handleUploadDocument(
                                                        selectedDocument._id || selectedDocument.id,
                                                        selectedDocument.documentType,
                                                        file
                                                    );
                                                    setShowUploadModal(false);
                                                }
                                            }}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Accepted formats: JPG, PNG, PDF, DOC, DOCX
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Details Modal */}
            {showDocumentModal && selectedDocument && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Document Details
                                </h2>
                                <button
                                    onClick={() => setShowDocumentModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Document Information */}
                            <div className="space-y-4">
                                {/* Info for verification */}
                                {selectedDocument.status === 'pending' && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                        <div className="flex items-center">
                                            <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
                                            <p className="text-sm text-blue-800">
                                                <strong>Ready for Review:</strong> This document is ready for verification. Please review the document file below and take appropriate action.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Document Type</label>
                                        <p className="text-sm text-gray-900 mt-1">
                                            {documentLabels[selectedDocument.documentType] || 'Unknown Document'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Status</label>
                                        <div className="mt-1">
                                            {(() => {
                                                const statusInfo = getStatusInfo(selectedDocument.status);
                                                const StatusIcon = statusInfo.icon;
                                                return (
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                                        <StatusIcon className="w-3 h-3 mr-1" />
                                                        {statusInfo.label}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Driver Name</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-sm text-gray-900">
                                                {selectedDocument.driverName || 'Unknown Driver'}
                                            </p>
                                            <VerifiedBadge
                                                isVerified={isDriverVerified(selectedDocument)}
                                                size="sm"
                                                className="flex-shrink-0"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Driver Email</label>
                                        <p className="text-sm text-gray-900 mt-1">
                                            {selectedDocument.driverEmail || 'No email provided'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Driver Phone</label>
                                        <p className="text-sm text-gray-900 mt-1">
                                            {selectedDocument.driverPhone || 'No phone provided'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Submitted Date</label>
                                        <p className="text-sm text-gray-900 mt-1">
                                            {(() => {
                                                const dateField = selectedDocument.submittedAt || selectedDocument.createdAt || selectedDocument.uploadedAt || selectedDocument.uploadDate || selectedDocument.date;
                                                if (dateField) {
                                                    try {
                                                        return new Date(dateField).toLocaleString();
                                                    } catch (e) {
                                                        return 'Invalid Date';
                                                    }
                                                }
                                                return 'Unknown Date';
                                            })()}
                                        </p>
                                    </div>
                                </div>

                                {/* Document Image/File */}
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Document File</label>
                                    <div className="mt-2">
                                        {getDocumentUrl(selectedDocument) ? (
                                            <div className="space-y-2">
                                                <img
                                                    src={getDocumentUrl(selectedDocument)}
                                                    alt="Document"
                                                    className="max-w-full h-auto rounded border shadow-sm"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'block';
                                                    }}
                                                />
                                                <div className="hidden">
                                                    <div className="p-4 border border-gray-200 rounded bg-gray-50">
                                                        <p className="text-sm text-gray-600 mb-2">Document file could not be displayed as image.</p>
                                                        <a
                                                            href={getDocumentUrl(selectedDocument)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                                        >
                                                            <EyeIcon className="w-4 h-4 mr-1" />
                                                            Open Document File
                                                        </a>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <a
                                                        href={getDocumentUrl(selectedDocument)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                                    >
                                                        <EyeIcon className="w-4 h-4 mr-1" />
                                                        Open in New Tab
                                                    </a>
                                                    <span className="text-xs text-gray-500">
                                                        {getDocumentUrl(selectedDocument)?.split('.').pop()?.toUpperCase()} file
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 border border-gray-200 rounded bg-gray-50">
                                                <p className="text-sm text-gray-600">No document file available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                                    <button
                                        onClick={() => setShowDocumentModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                    >
                                        Close
                                    </button>
                                    {selectedDocument.status === 'pending' && (
                                        <>
                                            <Button
                                                onClick={() => {
                                                    handleVerifyDocument(selectedDocument._id || selectedDocument.id);
                                                    setShowDocumentModal(false);
                                                }}
                                                loading={processingAction === (selectedDocument._id || selectedDocument.id)}
                                                loadingText="Verifying..."
                                                variant="primary"
                                                size="sm"
                                                className="px-4 py-2"
                                            >
                                                Verify Document
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    handleRejectDocument(selectedDocument._id || selectedDocument.id, 'Document rejected');
                                                    setShowDocumentModal(false);
                                                }}
                                                loading={processingAction === (selectedDocument._id || selectedDocument.id)}
                                                loadingText="Rejecting..."
                                                variant="danger"
                                                size="sm"
                                                className="px-4 py-2"
                                            >
                                                Reject Document
                                            </Button>
                                            <button
                                                onClick={() => {
                                                    // TODO: Implement AI verification
                                                    toast.info('AI verification feature coming soon!');
                                                }}
                                                disabled={processingAction === (selectedDocument._id || selectedDocument.id)}
                                                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
                                            >
                                                <SparklesIcon className="w-4 h-4 mr-1" />
                                                AI Verify
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DocumentVerificationPage;
