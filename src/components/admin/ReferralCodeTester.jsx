import React, { useState } from 'react';
import {
    MagnifyingGlassIcon,
    ClipboardDocumentIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

const ReferralCodeTester = () => {
    const [testResults, setTestResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [availableCodes, setAvailableCodes] = useState([]);
    const [testReferralCode, setTestReferralCode] = useState('');

    const addTestResult = (test, status, message, data = null) => {
        const result = {
            id: Date.now(),
            test,
            status, // 'success', 'error', 'warning'
            message,
            data,
            timestamp: new Date().toLocaleTimeString()
        };
        setTestResults(prev => [result, ...prev]);
    };

    const runAllTests = async () => {
        setIsLoading(true);
        setTestResults([]);

        try {
            // Test 1: Get Available Referral Codes
            addTestResult('Get Available Referral Codes', 'info', 'Testing...');
            try {
                const response = await apiService.getAvailableReferralCodes();
                console.log('🔍 Test: Available referral codes response:', response);

                if (response.success) {
                    setAvailableCodes(response.data || []);
                    addTestResult(
                        'Get Available Referral Codes',
                        'success',
                        `Found ${response.data?.length || 0} available referral codes`,
                        response.data
                    );
                } else {
                    addTestResult(
                        'Get Available Referral Codes',
                        'error',
                        response.message || 'Failed to get referral codes',
                        response
                    );
                }
            } catch (error) {
                addTestResult(
                    'Get Available Referral Codes',
                    'error',
                    error.message || 'Network error',
                    error
                );
            }

            // Test 2: Test Driver Invitation with Referral Code
            if (availableCodes.length > 0) {
                const testCode = availableCodes[0].code || availableCodes[0].referralCode;
                addTestResult('Test Driver Invitation', 'info', `Testing with code: ${testCode}`);

                const testDriverData = {
                    name: 'Test Driver',
                    email: `test-${Date.now()}@example.com`,
                    referralCode: testCode
                };

                try {
                    const response = await apiService.inviteDriver(testDriverData);
                    addTestResult(
                        'Test Driver Invitation',
                        'success',
                        'Driver invitation with permanent referral code successful',
                        response
                    );
                } catch (error) {
                    addTestResult(
                        'Test Driver Invitation',
                        'error',
                        error.response?.data?.error || error.message,
                        error.response?.data
                    );
                }
            } else {
                addTestResult(
                    'Test Driver Invitation',
                    'warning',
                    'Skipped - No referral codes available'
                );
            }

            // Test 2.5: Validate Referral Code
            if (availableCodes.length > 0) {
                const testCode = availableCodes[0].code || availableCodes[0].referralCode;
                addTestResult('Validate Referral Code', 'info', `Validating code: ${testCode}`);

                try {
                    const response = await apiService.validateReferralCode(testCode);
                    addTestResult(
                        'Validate Referral Code',
                        'success',
                        `Code ${testCode} is valid and active`,
                        response
                    );
                } catch (error) {
                    addTestResult(
                        'Validate Referral Code',
                        'error',
                        error.response?.data?.error || error.message,
                        error.response?.data
                    );
                }
            }

            // Test 3: Generate Referral Code (if we have a driver ID)
            addTestResult('Generate Referral Code', 'info', 'Testing referral code generation...');
            try {
                // This would need a valid driver ID - we'll test the endpoint structure
                const response = await apiService.generateReferralCode('test-driver-id');
                addTestResult(
                    'Generate Referral Code',
                    'success',
                    'Referral code generation endpoint accessible',
                    response
                );
            } catch (error) {
                if (error.response?.status === 404) {
                    addTestResult(
                        'Generate Referral Code',
                        'warning',
                        'Endpoint exists but test driver ID not found (expected)',
                        error.response?.data
                    );
                } else {
                    addTestResult(
                        'Generate Referral Code',
                        'error',
                        error.response?.data?.error || error.message,
                        error.response?.data
                    );
                }
            }

            // Test 4: Get Driver Referral Code
            addTestResult('Get Driver Referral Code', 'info', 'Testing get driver referral code...');
            try {
                const response = await apiService.getDriverReferralCode('test-driver-id');
                addTestResult(
                    'Get Driver Referral Code',
                    'success',
                    'Get driver referral code endpoint accessible',
                    response
                );
            } catch (error) {
                if (error.response?.status === 404) {
                    addTestResult(
                        'Get Driver Referral Code',
                        'warning',
                        'Endpoint exists but test driver ID not found (expected)',
                        error.response?.data
                    );
                } else {
                    addTestResult(
                        'Get Driver Referral Code',
                        'error',
                        error.response?.data?.error || error.message,
                        error.response?.data
                    );
                }
            }

            // Test 5: Use Referral Code
            addTestResult('Use Referral Code', 'info', 'Testing use referral code...');
            try {
                const response = await apiService.useReferralCode('test-driver-id', 'TEST123');
                addTestResult(
                    'Use Referral Code',
                    'success',
                    'Use referral code endpoint accessible',
                    response
                );
            } catch (error) {
                if (error.response?.status === 400) {
                    addTestResult(
                        'Use Referral Code',
                        'warning',
                        'Endpoint exists but test referral code invalid (expected)',
                        error.response?.data
                    );
                } else {
                    addTestResult(
                        'Use Referral Code',
                        'error',
                        error.response?.data?.error || error.message,
                        error.response?.data
                    );
                }
            }

            // Test 6: Get Referral Code Usage History
            if (availableCodes.length > 0) {
                const testCode = availableCodes[0].code || availableCodes[0].referralCode;
                addTestResult('Get Referral Code Usage History', 'info', `Getting usage history for: ${testCode}`);

                try {
                    const response = await apiService.getReferralCodeUsageHistory(testCode);
                    addTestResult(
                        'Get Referral Code Usage History',
                        'success',
                        `Usage history retrieved - ${response.data?.usageHistory?.length || 0} uses recorded`,
                        response
                    );
                } catch (error) {
                    addTestResult(
                        'Get Referral Code Usage History',
                        'error',
                        error.response?.data?.error || error.message,
                        error.response?.data
                    );
                }
            }

            // Test 7: Get Referral Rewards Configuration
            addTestResult('Get Referral Rewards Configuration', 'info', 'Testing configuration...');
            try {
                const response = await apiService.getReferralRewardsConfiguration();
                addTestResult(
                    'Get Referral Rewards Configuration',
                    'success',
                    'Referral rewards configuration accessible',
                    response
                );
            } catch (error) {
                addTestResult(
                    'Get Referral Rewards Configuration',
                    'error',
                    error.response?.data?.error || error.message,
                    error.response?.data
                );
            }

        } catch (error) {
            addTestResult('Test Suite', 'error', 'Test suite failed', error);
        } finally {
            setIsLoading(false);
        }
    };

    const testSpecificCode = async () => {
        if (!testReferralCode.trim()) {
            toast.error('Please enter a referral code to test');
            return;
        }

        addTestResult('Test Specific Code', 'info', `Testing code: ${testReferralCode}`);

        try {
            const testDriverData = {
                name: 'Specific Test Driver',
                email: `specific-test-${Date.now()}@example.com`,
                referralCode: testReferralCode.trim()
            };

            const response = await apiService.inviteDriver(testDriverData);
            addTestResult(
                'Test Specific Code',
                'success',
                'Specific referral code test successful',
                response
            );
        } catch (error) {
            addTestResult(
                'Test Specific Code',
                'error',
                error.response?.data?.error || error.message,
                error.response?.data
            );
        }
    };

    const clearResults = () => {
        setTestResults([]);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
            case 'error':
                return <XCircleIcon className="w-5 h-5 text-red-500" />;
            case 'warning':
                return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
            case 'info':
                return <MagnifyingGlassIcon className="w-5 h-5 text-blue-500" />;
            default:
                return <MagnifyingGlassIcon className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'error':
                return 'bg-red-50 border-red-200';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200';
            case 'info':
                return 'bg-blue-50 border-blue-200';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Referral Code System Tester</h2>
                    <p className="text-sm text-gray-600">Comprehensive testing of all referral code functionality</p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={clearResults}
                        className="px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Clear Results
                    </button>
                    <button
                        onClick={runAllTests}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        {isLoading ? 'Running Tests...' : 'Run All Tests'}
                    </button>
                </div>
            </div>

            {/* Test Specific Code */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Test Specific Referral Code</h3>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={testReferralCode}
                        onChange={(e) => setTestReferralCode(e.target.value)}
                        placeholder="Enter referral code to test"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                        onClick={testSpecificCode}
                        className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Test Code
                    </button>
                </div>
            </div>

            {/* Available Codes */}
            {availableCodes.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-900 mb-3">
                        Available Referral Codes ({availableCodes.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {availableCodes.slice(0, 6).map((code, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                <span className="text-sm font-mono text-gray-700">
                                    {code.code || code.referralCode}
                                </span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(code.code || code.referralCode);
                                        toast.success('Code copied!');
                                    }}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    <ClipboardDocumentIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Test Results */}
            <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Test Results ({testResults.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {testResults.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>No test results yet. Click "Run All Tests" to start testing.</p>
                        </div>
                    ) : (
                        testResults.map((result) => (
                            <div
                                key={result.id}
                                className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                            >
                                <div className="flex items-start space-x-3">
                                    {getStatusIcon(result.status)}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-medium text-gray-900">
                                                {result.test}
                                            </h4>
                                            <span className="text-xs text-gray-500">
                                                {result.timestamp}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 mt-1">
                                            {result.message}
                                        </p>
                                        {result.data && (
                                            <details className="mt-2">
                                                <summary className="text-xs text-gray-600 cursor-pointer">
                                                    View Data
                                                </summary>
                                                <pre className="text-xs text-gray-600 mt-1 bg-white p-2 rounded border overflow-x-auto">
                                                    {JSON.stringify(result.data, null, 2)}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReferralCodeTester;
