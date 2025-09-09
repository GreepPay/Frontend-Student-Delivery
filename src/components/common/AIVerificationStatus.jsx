import React, { useState, useEffect } from 'react';
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    ShieldCheckIcon,
    DocumentMagnifyingGlassIcon,
    FaceSmileIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import aiVerificationService from '../../services/aiVerificationService';

const AIVerificationStatus = ({ documentType, file, userId, onVerificationComplete }) => {
    const [verificationStatus, setVerificationStatus] = useState('idle'); // idle, processing, completed, failed
    const [verificationResult, setVerificationResult] = useState(null);
    const [currentStep, setCurrentStep] = useState('');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    // Verification steps with descriptions
    const verificationSteps = [
        {
            key: 'classifying',
            label: 'Classifying Document',
            description: 'AI is analyzing document type and format',
            icon: DocumentMagnifyingGlassIcon
        },
        {
            key: 'extracting',
            label: 'Extracting Text',
            description: 'Using OCR to extract text and data',
            icon: EyeIcon
        },
        {
            key: 'detecting_face',
            label: 'Face Detection',
            description: 'Detecting and analyzing faces in document',
            icon: FaceSmileIcon,
            condition: ['profilePhoto', 'passportPhoto'].includes(documentType)
        },
        {
            key: 'verifying_authenticity',
            label: 'Verifying Authenticity',
            description: 'Checking document authenticity and security features',
            icon: ShieldCheckIcon
        },
        {
            key: 'detecting_fraud',
            label: 'Fraud Detection',
            description: 'Analyzing for signs of fraud or tampering',
            icon: ExclamationTriangleIcon
        },
        {
            key: 'finalizing',
            label: 'Finalizing Results',
            description: 'Compiling verification results and recommendations',
            icon: SparklesIcon
        }
    ];

    // Start AI verification process
    const startVerification = async () => {
        if (!file || !userId) {
            setError('Missing required data for verification');
            return;
        }

        setVerificationStatus('processing');
        setProgress(0);
        setError(null);

        try {
            // Simulate step-by-step progress
            const stepDuration = 1000; // 1 second per step
            const totalSteps = verificationSteps.filter(step =>
                !step.condition || step.condition(documentType)
            ).length;

            for (let i = 0; i < totalSteps; i++) {
                const step = verificationSteps[i];
                setCurrentStep(step.key);
                setProgress(((i + 1) / totalSteps) * 100);

                // Wait for step to complete
                await new Promise(resolve => setTimeout(resolve, stepDuration));
            }

            // Perform actual AI verification
            console.log(`🤖 Starting AI verification for ${documentType}...`);
            const result = await aiVerificationService.verifyDocument(documentType, file, userId);

            setVerificationResult(result);
            setVerificationStatus('completed');

            // Notify parent component
            if (onVerificationComplete) {
                onVerificationComplete(result);
            }

        } catch (error) {
            console.error('AI verification failed:', error);
            setError(error.message || 'Verification failed');
            setVerificationStatus('failed');
        }
    };

    // Auto-start verification when component mounts
    useEffect(() => {
        if (file && userId && verificationStatus === 'idle') {
            startVerification();
        }
    }, [file, userId]);

    // Get status icon and color
    const getStatusDisplay = () => {
        switch (verificationStatus) {
            case 'processing':
                return {
                    icon: ClockIcon,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200'
                };
            case 'completed':
                return {
                    icon: verificationResult?.verification?.isAuthentic ? CheckCircleIcon : XCircleIcon,
                    color: verificationResult?.verification?.isAuthentic ? 'text-green-600' : 'text-red-600',
                    bgColor: verificationResult?.verification?.isAuthentic ? 'bg-green-50' : 'bg-red-50',
                    borderColor: verificationResult?.verification?.isAuthentic ? 'border-green-200' : 'border-red-200'
                };
            case 'failed':
                return {
                    icon: XCircleIcon,
                    color: 'text-red-600',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200'
                };
            default:
                return {
                    icon: ClockIcon,
                    color: 'text-gray-600',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200'
                };
        }
    };

    const statusDisplay = getStatusDisplay();
    const StatusIcon = statusDisplay.icon;

    return (
        <div className={`border rounded-lg p-4 ${statusDisplay.bgColor} ${statusDisplay.borderColor}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <StatusIcon className={`w-6 h-6 ${statusDisplay.color}`} />
                    <div>
                        <h3 className="font-semibold text-gray-900">AI Verification</h3>
                        <p className="text-sm text-gray-600">
                            {verificationStatus === 'processing' && 'Analyzing document with AI...'}
                            {verificationStatus === 'completed' && 'Verification completed'}
                            {verificationStatus === 'failed' && 'Verification failed'}
                        </p>
                    </div>
                </div>

                {verificationStatus === 'processing' && (
                    <div className="text-right">
                        <div className="text-sm font-medium text-blue-600">{Math.round(progress)}%</div>
                        <div className="text-xs text-gray-500">Complete</div>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            {verificationStatus === 'processing' && (
                <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Current Step */}
            {verificationStatus === 'processing' && currentStep && (
                <div className="mb-4">
                    {verificationSteps.map((step, index) => {
                        const StepIcon = step.icon;
                        const isActive = step.key === currentStep;
                        const isCompleted = progress > (index / verificationSteps.length) * 100;

                        if (step.condition && !step.condition(documentType)) return null;

                        return (
                            <div key={step.key} className={`flex items-center space-x-3 py-2 ${isActive ? 'bg-blue-100 rounded-lg px-3' : ''}`}>
                                <StepIcon className={`w-5 h-5 ${isCompleted ? 'text-green-600' :
                                    isActive ? 'text-blue-600' : 'text-gray-400'
                                    }`} />
                                <div className="flex-1">
                                    <p className={`text-sm font-medium ${isActive ? 'text-blue-900' : 'text-gray-700'
                                        }`}>
                                        {step.label}
                                    </p>
                                    <p className={`text-xs ${isActive ? 'text-blue-700' : 'text-gray-500'
                                        }`}>
                                        {step.description}
                                    </p>
                                </div>
                                {isCompleted && <CheckCircleIcon className="w-4 h-4 text-green-600" />}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Verification Results */}
            {verificationStatus === 'completed' && verificationResult && (
                <div className="space-y-4">
                    {/* Overall Result */}
                    <div className="bg-white rounded-lg p-4 border">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">Verification Result</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${verificationResult.verification?.isAuthentic
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}>
                                {verificationResult.verification?.isAuthentic ? 'Verified' : 'Rejected'}
                            </span>
                        </div>

                        {/* Confidence Scores */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {verificationResult.confidence && Object.entries(verificationResult.confidence).map(([key, value]) => (
                                <div key={key} className="text-center">
                                    <div className="text-lg font-bold text-gray-900">
                                        {Math.round(value * 100)}%
                                    </div>
                                    <div className="text-xs text-gray-500 capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Extracted Data */}
                        {verificationResult.extractedData && (
                            <div className="border-t pt-3">
                                <h5 className="font-medium text-gray-900 mb-2">Extracted Information</h5>
                                <div className="grid grid-cols-1 gap-2">
                                    {Object.entries(verificationResult.extractedData.fields || {}).map(([key, value]) => (
                                        <div key={key} className="flex justify-between text-sm">
                                            <span className="text-gray-600 capitalize">
                                                {key.replace(/_/g, ' ')}:
                                            </span>
                                            <span className="font-medium text-gray-900">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Issues and Recommendations */}
                        {verificationResult.verification?.issues?.length > 0 && (
                            <div className="border-t pt-3">
                                <h5 className="font-medium text-red-900 mb-2">Issues Found</h5>
                                <ul className="text-sm text-red-700 space-y-1">
                                    {verificationResult.verification.issues.map((issue, index) => (
                                        <li key={index} className="flex items-start space-x-2">
                                            <ExclamationTriangleIcon className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                            <span>{issue}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {verificationResult.verification?.recommendations?.length > 0 && (
                            <div className="border-t pt-3">
                                <h5 className="font-medium text-blue-900 mb-2">Recommendations</h5>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    {verificationResult.verification.recommendations.map((rec, index) => (
                                        <li key={index} className="flex items-start space-x-2">
                                            <SparklesIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Processing Metadata */}
                    {verificationResult.metadata && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between text-xs text-gray-600">
                                <span>Processing Time: {verificationResult.metadata.processingTime}s</span>
                                <span>AI Model: {verificationResult.metadata.aiModel}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Error Display */}
            {verificationStatus === 'failed' && error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <XCircleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="font-medium text-red-900">Verification Failed</h4>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                            <button
                                onClick={startVerification}
                                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                            >
                                Retry Verification
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIVerificationStatus;
