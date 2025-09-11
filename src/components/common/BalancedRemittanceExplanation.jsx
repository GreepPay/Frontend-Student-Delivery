import React, { useState } from 'react';
import {
    InformationCircleIcon,
    XMarkIcon,
    CurrencyDollarIcon,
    BanknotesIcon,
    CreditCardIcon,
    CalculatorIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const BalancedRemittanceExplanation = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('overview');

    if (!isOpen) return null;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: InformationCircleIcon },
        { id: 'how-it-works', label: 'How It Works', icon: CalculatorIcon },
        { id: 'example', label: 'Example', icon: BanknotesIcon },
        { id: 'benefits', label: 'Benefits', icon: CheckCircleIcon }
    ];

    const renderOverview = () => (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                    <InformationCircleIcon className="h-6 w-6 text-blue-600 mt-0.5 mr-3" />
                    <div>
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">What is Balanced Remittance?</h3>
                        <p className="text-blue-800">
                            Balanced Remittance is a fair system that accounts for both cash deliveries (where drivers owe the company)
                            and non-cash deliveries (where the company owes drivers), calculating a single net amount.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                        <CurrencyDollarIcon className="h-5 w-5 text-red-600 mr-2" />
                        <h4 className="font-semibold text-red-900">Cash Deliveries</h4>
                    </div>
                    <p className="text-red-800 text-sm">
                        When customers pay with cash, drivers collect the full amount and owe the company their share.
                    </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                        <CreditCardIcon className="h-5 w-5 text-green-600 mr-2" />
                        <h4 className="font-semibold text-green-900">Non-Cash Deliveries</h4>
                    </div>
                    <p className="text-green-800 text-sm">
                        When customers pay via transfer/POS, the company receives payment and owes drivers their share.
                    </p>
                </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mt-0.5 mr-3" />
                    <div>
                        <h4 className="font-semibold text-yellow-900 mb-2">The Problem with Old System</h4>
                        <p className="text-yellow-800">
                            Previously, drivers had to remit cash amounts without getting credit for their non-cash earnings,
                            creating unfair cash flow situations.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderHowItWorks = () => (
        <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculation Formula</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4 font-mono text-sm">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-2">
                            Net Remittance = Cash Remittance Owed - Non-Cash Earnings Owed
                        </div>
                        <div className="text-gray-600">
                            If positive: Driver owes company<br />
                            If negative: Company owes driver
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">1</span>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900">Calculate Cash Remittance</h4>
                        <p className="text-gray-600 text-sm">
                            Sum up all cash deliveries and calculate the company's share (usually 33% of total cash collected).
                        </p>
                    </div>
                </div>

                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold text-sm">2</span>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900">Calculate Non-Cash Earnings</h4>
                        <p className="text-gray-600 text-sm">
                            Sum up all non-cash deliveries and calculate the driver's share (usually 67% of total non-cash amount).
                        </p>
                    </div>
                </div>

                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-sm">3</span>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900">Calculate Net Amount</h4>
                        <p className="text-gray-600 text-sm">
                            Subtract non-cash earnings from cash remittance to get the final net amount to be settled.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderExample = () => (
        <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Real Example</h3>

                <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Cash Deliveries (Driver owes company)</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Delivery 1: ₺150 (cash)</span>
                                <span className="text-red-600">Company share: ₺50</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Delivery 2: ₺150 (cash)</span>
                                <span className="text-red-600">Company share: ₺50</span>
                            </div>
                            <div className="border-t pt-2 font-semibold">
                                <div className="flex justify-between">
                                    <span>Total Cash Remittance Owed:</span>
                                    <span className="text-red-600">₺100</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Non-Cash Deliveries (Company owes driver)</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Transfer 1: ₺100</span>
                                <span className="text-green-600">Driver share: ₺67</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Transfer 2: ₺150</span>
                                <span className="text-green-600">Driver share: ₺100</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Transfer 3: ₺250</span>
                                <span className="text-green-600">Driver share: ₺167</span>
                            </div>
                            <div className="flex justify-between">
                                <span>POS: ₺200</span>
                                <span className="text-green-600">Driver share: ₺133</span>
                            </div>
                            <div className="border-t pt-2 font-semibold">
                                <div className="flex justify-between">
                                    <span>Total Non-Cash Earnings Owed:</span>
                                    <span className="text-green-600">₺467</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-3">Final Calculation</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Cash Remittance Owed:</span>
                                <span className="text-red-600">₺100</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Non-Cash Earnings Owed:</span>
                                <span className="text-green-600">₺467</span>
                            </div>
                            <div className="border-t pt-2 font-bold text-lg">
                                <div className="flex justify-between">
                                    <span>Net Remittance:</span>
                                    <span className="text-green-600">₺100 - ₺467 = -₺367</span>
                                </div>
                            </div>
                            <div className="text-center text-blue-800 font-semibold mt-2">
                                Company owes driver ₺367
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderBenefits = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                        <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                        <h4 className="font-semibold text-green-900">Fair Treatment</h4>
                    </div>
                    <p className="text-green-800 text-sm">
                        Drivers get full credit for all their deliveries, regardless of payment method.
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                        <CalculatorIcon className="h-5 w-5 text-blue-600 mr-2" />
                        <h4 className="font-semibold text-blue-900">Simplified Accounting</h4>
                    </div>
                    <p className="text-blue-800 text-sm">
                        One net amount instead of multiple separate transactions.
                    </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                        <BanknotesIcon className="h-5 w-5 text-purple-600 mr-2" />
                        <h4 className="font-semibold text-purple-900">Better Cash Flow</h4>
                    </div>
                    <p className="text-purple-800 text-sm">
                        Drivers don't need to bring large amounts of cash for remittance.
                    </p>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                        <CheckCircleIcon className="h-5 w-5 text-orange-600 mr-2" />
                        <h4 className="font-semibold text-orange-900">Transparency</h4>
                    </div>
                    <p className="text-orange-800 text-sm">
                        Clear breakdown of all calculations and earnings.
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Why This System is Better</h4>
                <ul className="text-gray-700 text-sm space-y-1">
                    <li>• <strong>Eliminates unfair cash flow situations</strong> where drivers had to remit without getting their earnings</li>
                    <li>• <strong>Reduces administrative complexity</strong> by handling all delivery types in one calculation</li>
                    <li>• <strong>Improves driver satisfaction</strong> by ensuring they receive their rightful earnings</li>
                    <li>• <strong>Provides accurate financial tracking</strong> for both drivers and the company</li>
                </ul>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return renderOverview();
            case 'how-it-works':
                return renderHowItWorks();
            case 'example':
                return renderExample();
            case 'benefits':
                return renderBenefits();
            default:
                return renderOverview();
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    {/* Header */}
                    <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                    <CalculatorIcon className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Balanced Remittance System</h3>
                                    <p className="text-sm text-gray-600">Understanding fair remittance calculations</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`${activeTab === tab.id
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                                    >
                                        <Icon className="h-4 w-4 mr-2" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6 max-h-96 overflow-y-auto">
                        {renderContent()}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                This system ensures fair treatment for all delivery types
                            </p>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BalancedRemittanceExplanation;
