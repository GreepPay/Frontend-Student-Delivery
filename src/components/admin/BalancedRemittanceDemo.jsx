import React, { useState } from 'react';
import { CalculatorIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import BalancedRemittanceExplanation from '../common/BalancedRemittanceExplanation';

const BalancedRemittanceDemo = () => {
    const [showExplanation, setShowExplanation] = useState(false);
    const [demoData, setDemoData] = useState({
        cashDeliveries: [
            { amount: 150, description: 'Cash delivery 1' },
            { amount: 150, description: 'Cash delivery 2' }
        ],
        nonCashDeliveries: [
            { amount: 100, type: 'transfer', description: 'Naira transfer 1' },
            { amount: 150, type: 'transfer', description: 'Naira transfer 2' },
            { amount: 250, type: 'transfer', description: 'Naira transfer 3' },
            { amount: 200, type: 'pos', description: 'POS delivery' }
        ]
    });

    const calculateDemo = () => {
        const cashTotal = demoData.cashDeliveries.reduce((sum, delivery) => sum + delivery.amount, 0);
        const nonCashTotal = demoData.nonCashDeliveries.reduce((sum, delivery) => sum + delivery.amount, 0);

        const cashRemittanceOwed = cashTotal * 0.33; // Company gets 33%
        const nonCashEarningsOwed = nonCashTotal * 0.67; // Driver gets 67%
        const netRemittance = cashRemittanceOwed - nonCashEarningsOwed;

        return {
            cashTotal,
            nonCashTotal,
            cashRemittanceOwed,
            nonCashEarningsOwed,
            netRemittance,
            breakdown: {
                cash: {
                    count: demoData.cashDeliveries.length,
                    totalAmount: cashTotal,
                    companyShare: cashRemittanceOwed
                },
                nonCash: {
                    count: demoData.nonCashDeliveries.length,
                    totalAmount: nonCashTotal,
                    driverShare: nonCashEarningsOwed
                }
            }
        };
    };

    const calculation = calculateDemo();

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <CalculatorIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Balanced Remittance Demo</h3>
                        <p className="text-sm text-gray-600">Live example with sample data</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowExplanation(true)}
                    className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                    <InformationCircleIcon className="h-4 w-4 mr-1" />
                    How it works
                </button>
            </div>

            {/* Sample Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-900 mb-3">Cash Deliveries (Driver owes company)</h4>
                    <div className="space-y-2 text-sm">
                        {demoData.cashDeliveries.map((delivery, index) => (
                            <div key={index} className="flex justify-between">
                                <span>{delivery.description}:</span>
                                <span className="font-medium">₺{delivery.amount}</span>
                            </div>
                        ))}
                        <div className="border-t border-red-300 pt-2 font-semibold">
                            <div className="flex justify-between">
                                <span>Total Cash:</span>
                                <span>₺{calculation.cashTotal}</span>
                            </div>
                            <div className="flex justify-between text-red-600">
                                <span>Company Share (33%):</span>
                                <span>₺{calculation.cashRemittanceOwed.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-3">Non-Cash Deliveries (Company owes driver)</h4>
                    <div className="space-y-2 text-sm">
                        {demoData.nonCashDeliveries.map((delivery, index) => (
                            <div key={index} className="flex justify-between">
                                <span>{delivery.description}:</span>
                                <span className="font-medium">₺{delivery.amount}</span>
                            </div>
                        ))}
                        <div className="border-t border-green-300 pt-2 font-semibold">
                            <div className="flex justify-between">
                                <span>Total Non-Cash:</span>
                                <span>₺{calculation.nonCashTotal}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                                <span>Driver Share (67%):</span>
                                <span>₺{calculation.nonCashEarningsOwed.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calculation Result */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">Balanced Remittance Calculation</h4>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>Cash Remittance Owed:</span>
                        <span className="font-mono">₺{calculation.cashRemittanceOwed.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Non-Cash Earnings Owed:</span>
                        <span className="font-mono">₺{calculation.nonCashEarningsOwed.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-blue-300 pt-2 mt-2">
                        <div className="flex justify-between font-semibold text-lg">
                            <span>Net Remittance:</span>
                            <span className="font-mono">
                                ₺{calculation.cashRemittanceOwed.toFixed(2)} - ₺{calculation.nonCashEarningsOwed.toFixed(2)} = ₺{calculation.netRemittance.toFixed(2)}
                            </span>
                        </div>
                    </div>
                    <div className="text-center mt-3">
                        <div className={`inline-block px-4 py-2 rounded-lg font-semibold ${calculation.netRemittance > 0
                                ? 'bg-red-100 text-red-800'
                                : calculation.netRemittance < 0
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-blue-100 text-blue-800'
                            }`}>
                            {calculation.netRemittance > 0
                                ? `Driver owes company ₺${Math.abs(calculation.netRemittance).toFixed(2)}`
                                : calculation.netRemittance < 0
                                    ? `Company owes driver ₺${Math.abs(calculation.netRemittance).toFixed(2)}`
                                    : 'Balanced (no remittance needed)'
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Benefits */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Why This System is Better</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>Fair Treatment:</strong> Drivers get credit for all delivery types</li>
                    <li>• <strong>Simplified Accounting:</strong> One net amount instead of multiple transactions</li>
                    <li>• <strong>Better Cash Flow:</strong> Drivers don't need to bring large cash amounts</li>
                    <li>• <strong>Transparency:</strong> Clear breakdown of all calculations</li>
                </ul>
            </div>

            {/* Explanation Modal */}
            <BalancedRemittanceExplanation
                isOpen={showExplanation}
                onClose={() => setShowExplanation(false)}
            />
        </div>
    );
};

export default BalancedRemittanceDemo;
