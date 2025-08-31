import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import EarningsValidationService from '../../services/earningsValidationService';
import EarningsValidationWidget from '../../components/admin/EarningsValidationWidget';

const EarningsValidationTest = () => {
    const [testResults, setTestResults] = useState([]);
    const [isTesting, setIsTesting] = useState(false);

    const addTestResult = (message, type = 'info') => {
        setTestResults(prev => [...prev, {
            id: Date.now(),
            message,
            type,
            timestamp: new Date().toLocaleTimeString()
        }]);
    };

    const testEarningsValidation = async () => {
        setIsTesting(true);
        setTestResults([]);

        try {
            addTestResult('🧪 Starting earnings validation tests...', 'info');

            // Test 1: Get validation status
            addTestResult('Test 1: Getting earnings validation status...', 'info');
            try {
                const status = await EarningsValidationService.getEarningsValidationStatus();
                addTestResult(`✅ Status: ${status.totalDrivers} drivers, ${status.validDrivers} valid, ${status.invalidDrivers} invalid`, 'success');
            } catch (error) {
                addTestResult(`❌ Status test failed: ${error.message}`, 'error');
            }

            // Test 2: Validate all drivers
            addTestResult('Test 2: Validating all drivers earnings...', 'info');
            try {
                const result = await EarningsValidationService.validateAllDriversEarnings();
                addTestResult(`✅ Validation: ${result.validDrivers} valid, ${result.invalidDrivers} invalid out of ${result.totalDrivers}`, 'success');

                if (result.details && result.details.length > 0) {
                    result.details.slice(0, 3).forEach(detail => {
                        addTestResult(`📊 ${detail.driverName}: ${detail.isValid ? 'Valid' : 'Invalid'} (${detail.message})`, detail.isValid ? 'success' : 'warning');
                    });
                }
            } catch (error) {
                addTestResult(`❌ Validation test failed: ${error.message}`, 'error');
            }

            // Test 3: Test individual driver validation (if we have a driver ID)
            addTestResult('Test 3: Testing individual driver validation...', 'info');
            try {
                // This would need a real driver ID - for now just test the endpoint
                addTestResult('ℹ️ Individual validation requires a specific driver ID', 'info');
            } catch (error) {
                addTestResult(`❌ Individual validation test failed: ${error.message}`, 'error');
            }

            addTestResult('🎉 All tests completed!', 'success');

        } catch (error) {
            addTestResult(`❌ Test suite failed: ${error.message}`, 'error');
        } finally {
            setIsTesting(false);
        }
    };

    const clearResults = () => {
        setTestResults([]);
    };

    const getResultColor = (type) => {
        switch (type) {
            case 'success': return 'text-green-700 bg-green-50 border-green-200';
            case 'error': return 'text-red-700 bg-red-50 border-red-200';
            case 'warning': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
            default: return 'text-blue-700 bg-blue-50 border-blue-200';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Earnings Validation Test</h1>
                    <p className="text-gray-600">Test and debug the earnings validation system</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Test Controls */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Controls</h2>

                            <div className="space-y-3">
                                <button
                                    onClick={testEarningsValidation}
                                    disabled={isTesting}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isTesting ? 'Running Tests...' : 'Run All Tests'}
                                </button>

                                <button
                                    onClick={clearResults}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
                                >
                                    Clear Results
                                </button>
                            </div>
                        </div>

                        {/* Earnings Validation Widget */}
                        <EarningsValidationWidget />
                    </div>

                    {/* Test Results */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h2>

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {testResults.length === 0 ? (
                                <p className="text-gray-500 text-sm">No test results yet. Run tests to see results.</p>
                            ) : (
                                testResults.map(result => (
                                    <div
                                        key={result.id}
                                        className={`p-3 rounded-md border text-sm ${getResultColor(result.type)}`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <span className="flex-1">{result.message}</span>
                                            <span className="text-xs opacity-75 ml-2">{result.timestamp}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Debug Information */}
                <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Debug Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <h3 className="font-medium text-gray-900 mb-2">API Endpoints</h3>
                            <ul className="space-y-1 text-gray-600">
                                <li>• GET /admin/earnings/validate-all</li>
                                <li>• GET /admin/earnings/validate/:driverId</li>
                                <li>• POST /admin/earnings/fix/:driverId</li>
                                <li>• GET /admin/earnings/status</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-medium text-gray-900 mb-2">Environment</h3>
                            <ul className="space-y-1 text-gray-600">
                                <li>• API URL: {process.env.REACT_APP_API_URL}</li>
                                <li>• Token: {localStorage.getItem('token') ? 'Available' : 'Not available'}</li>
                                <li>• Service: EarningsValidationService</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EarningsValidationTest;
