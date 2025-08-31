// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL;

// AI Document Verification Service
// This service handles automatic verification of uploaded documents using AI capabilities

class AIVerificationService {
    constructor() {
        this.verificationEndpoints = {
            // Document classification and validation
            classify: `${API_BASE_URL}/ai/documents/classify`,
            // OCR text extraction
            extractText: `${API_BASE_URL}/ai/documents/extract-text`,
            // Face detection and comparison
            detectFace: `${API_BASE_URL}/ai/documents/detect-face`,
            // Document authenticity verification
            verifyAuthenticity: `${API_BASE_URL}/ai/documents/verify-authenticity`,
            // Fraud detection
            detectFraud: `${API_BASE_URL}/ai/documents/detect-fraud`,
            // Complete verification pipeline
            verifyDocument: `${API_BASE_URL}/ai/documents/verify`
        };
    }

    // Main verification method that orchestrates the entire AI verification process
    async verifyDocument(documentType, file, userId) {
        try {
            console.log(`🤖 Starting AI verification for ${documentType}...`);

            const formData = new FormData();
            formData.append('document', file);
            formData.append('documentType', documentType);
            formData.append('userId', userId);

            const response = await fetch(this.verificationEndpoints.verifyDocument, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                console.log(`✅ AI verification completed for ${documentType}:`, result.data);
                return result.data;
            } else {
                throw new Error(result.message || 'AI verification failed');
            }
        } catch (error) {
            console.error(`❌ AI verification error for ${documentType}:`, error);
            throw error;
        }
    }

    // Document classification - determines what type of document it is
    async classifyDocument(file) {
        try {
            const formData = new FormData();
            formData.append('document', file);

            const response = await fetch(this.verificationEndpoints.classify, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Document classification error:', error);
            throw error;
        }
    }

    // OCR text extraction from documents
    async extractText(file) {
        try {
            const formData = new FormData();
            formData.append('document', file);

            const response = await fetch(this.verificationEndpoints.extractText, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Text extraction error:', error);
            throw error;
        }
    }

    // Face detection and comparison (for profile photos and ID cards)
    async detectAndCompareFace(file, referenceImage = null) {
        try {
            const formData = new FormData();
            formData.append('document', file);
            if (referenceImage) {
                formData.append('referenceImage', referenceImage);
            }

            const response = await fetch(this.verificationEndpoints.detectFace, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Face detection error:', error);
            throw error;
        }
    }

    // Document authenticity verification
    async verifyAuthenticity(file, documentType) {
        try {
            const formData = new FormData();
            formData.append('document', file);
            formData.append('documentType', documentType);

            const response = await fetch(this.verificationEndpoints.verifyAuthenticity, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Authenticity verification error:', error);
            throw error;
        }
    }

    // Fraud detection
    async detectFraud(file, documentType) {
        try {
            const formData = new FormData();
            formData.append('document', file);
            formData.append('documentType', documentType);

            const response = await fetch(this.verificationEndpoints.detectFraud, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Fraud detection error:', error);
            throw error;
        }
    }

    // Get verification status for a document
    async getVerificationStatus(documentId) {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/documents/status/${documentId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Status check error:', error);
            throw error;
        }
    }

    // Batch verification for multiple documents
    async verifyMultipleDocuments(documents) {
        try {
            const formData = new FormData();
            documents.forEach((doc, index) => {
                formData.append(`document_${index}`, doc.file);
                formData.append(`type_${index}`, doc.type);
            });

            const response = await fetch(`${API_BASE_URL}/ai/documents/verify-batch`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Batch verification error:', error);
            throw error;
        }
    }
}

// AI Verification Rules and Validation Logic
export const AIVerificationRules = {
    // Student ID validation rules
    studentId: {
        requiredFields: ['student_id', 'university_name', 'student_name', 'expiry_date'],
        textPatterns: {
            studentId: /^\d{8,12}$/, // 8-12 digit student ID
            universityName: /university|college|institute/i,
            expiryDate: /^\d{2}\/\d{2}\/\d{4}$|^\d{4}-\d{2}-\d{2}$/
        },
        confidenceThreshold: 0.85,
        fraudIndicators: ['blurred_text', 'inconsistent_fonts', 'missing_watermarks']
    },

    // Profile Photo validation rules
    profilePhoto: {
        requiredElements: ['face_detected', 'clear_image', 'proper_lighting'],
        faceDetectionConfidence: 0.9,
        imageQualityThreshold: 0.8,
        fraudIndicators: ['multiple_faces', 'screenshot_detected', 'low_quality']
    },

    // University Enrollment validation rules
    universityEnrollment: {
        requiredFields: ['university_name', 'student_name', 'enrollment_date', 'course_program'],
        textPatterns: {
            enrollmentDate: /^\d{2}\/\d{2}\/\d{4}$|^\d{4}-\d{2}-\d{2}$/,
            courseProgram: /bachelor|master|phd|diploma/i
        },
        confidenceThreshold: 0.9,
        fraudIndicators: ['forged_signatures', 'inconsistent_dates', 'template_detected']
    },

    // Identity Card validation rules
    identityCard: {
        requiredFields: ['full_name', 'date_of_birth', 'national_id', 'expiry_date'],
        textPatterns: {
            nationalId: /^\d{10,12}$/,
            dateOfBirth: /^\d{2}\/\d{2}\/\d{4}$|^\d{4}-\d{2}-\d{2}$/,
            expiryDate: /^\d{2}\/\d{2}\/\d{4}$|^\d{4}-\d{2}-\d{2}$/
        },
        confidenceThreshold: 0.9,
        fraudIndicators: ['tampered_photo', 'altered_dates', 'fake_watermarks']
    },

    // Transportation License validation rules
    transportationLicense: {
        requiredFields: ['license_number', 'holder_name', 'vehicle_type', 'expiry_date'],
        textPatterns: {
            licenseNumber: /^[A-Z0-9]{8,15}$/,
            vehicleType: /car|motorcycle|truck|bus/i,
            expiryDate: /^\d{2}\/\d{2}\/\d{4}$|^\d{4}-\d{2}-\d{2}$/
        },
        confidenceThreshold: 0.9,
        fraudIndicators: ['expired_license', 'forged_signature', 'altered_dates']
    }
};

// AI Verification Results Interface
export const AIVerificationResult = {
    // Verification status
    status: 'pending' | 'verified' | 'rejected' | 'manual_review',

    // Confidence scores
    confidence: {
        overall: 0.95, // Overall confidence score
        classification: 0.98, // Document type classification confidence
        textExtraction: 0.92, // OCR text extraction confidence
        authenticity: 0.94, // Document authenticity confidence
        fraudDetection: 0.96 // Fraud detection confidence
    },

    // Extracted data
    extractedData: {
        documentType: 'student_id',
        fields: {
            student_id: '20223056',
            university_name: 'Eastern Mediterranean University',
            student_name: 'Wisdom Agunta',
            expiry_date: '2025-12-31'
        },
        confidence: 0.95
    },

    // Verification details
    verification: {
        isAuthentic: true,
        isNotFraudulent: true,
        meetsRequirements: true,
        issues: [],
        recommendations: []
    },

    // Processing metadata
    metadata: {
        processingTime: 2.5, // seconds
        aiModel: 'gpt-4-vision',
        processingDate: '2025-01-21T10:30:00Z'
    }
};

// Export the service instance
const aiVerificationService = new AIVerificationService();
export default aiVerificationService;
