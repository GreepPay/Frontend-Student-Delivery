import React, { useState, useEffect } from 'react';
import { ClockIcon, FireIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import formMemory from '../../utils/formMemory';
import ConfirmationModal from './ConfirmationModal';

const FormMemoryPanel = ({
    formType,
    onFillForm,
    className = '',
    maxEntries = 5,
    showStats = true
}) => {
    const [recentEntries, setRecentEntries] = useState([]);
    const [stats, setStats] = useState(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const loadRecentEntries = () => {
        const entries = formMemory.getRecentFormData(formType, maxEntries);
        setRecentEntries(entries);
    };

    const loadStats = () => {
        const memoryStats = formMemory.getMemoryStats();
        setStats(memoryStats);
    };

    useEffect(() => {
        loadRecentEntries();
        if (showStats) {
            loadStats();
        }
    }, [formType, showStats, loadRecentEntries]);

    const handleFillForm = (entry) => {
        if (onFillForm) {
            onFillForm(entry);
        }
    };

    const handleClearMemory = () => {
        setShowClearConfirm(true);
    };

    const confirmClearMemory = () => {
        formMemory.clearMemory(formType);
        loadRecentEntries();
        if (showStats) {
            loadStats();
        }
        setShowClearConfirm(false);
    };

    const handleAddTestData = () => {
        const testData = {
            customerName: 'Test Customer',
            customerPhone: '123-456-7890',
            pickupLocationDescription: 'Test Pickup Description',
            deliveryLocationDescription: 'Test Delivery Description',
            fee: 150,
            paymentMethod: 'cash'
        };

        console.log('🧪 Adding test data:', testData);
        formMemory.saveFormData(formType, testData);
        loadRecentEntries();
        if (showStats) {
            loadStats();
        }
    };

    const formatLastUsed = (date) => {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const getKeyFields = (entry) => {
        const keyFields = ['customerName', 'customerPhone', 'pickupLocationDescription', 'deliveryLocationDescription'];
        return keyFields.filter(field => entry[field]).slice(0, 2);
    };

    if (recentEntries.length === 0) {
        return (
            <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900">Form Memory</h3>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleAddTestData}
                            className="text-blue-400 hover:text-blue-600 text-xs px-2 py-1 border border-blue-300 rounded"
                            title="Add test data"
                        >
                            Test
                        </button>
                        <button
                            onClick={loadRecentEntries}
                            className="text-gray-400 hover:text-gray-600"
                            title="Refresh"
                        >
                            <ArrowPathIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <p className="text-xs text-gray-500">No recent entries. Start creating deliveries to build memory.</p>
            </div>
        );
    }

    return (
        <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-900">Recent Entries</h3>
                    {stats && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {stats.forms[formType]?.historyEntries || 0} saved
                        </span>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={loadRecentEntries}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Refresh"
                    >
                        <ArrowPathIcon className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleClearMemory}
                        className="text-red-400 hover:text-red-600 p-1"
                        title="Clear memory"
                    >
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Entries List */}
            <div className="max-h-64 overflow-y-auto">
                {recentEntries.map((entry, index) => {
                    const keyFields = getKeyFields(entry);
                    const isFrequentlyUsed = entry.usageCount > 1;

                    return (
                        <div
                            key={`${entry.customerName}-${entry.customerPhone}-${index}`}
                            className="p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => handleFillForm(entry)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                        {isFrequentlyUsed ? (
                                            <FireIcon className="h-4 w-4 text-orange-500" />
                                        ) : (
                                            <ClockIcon className="h-4 w-4 text-gray-400" />
                                        )}
                                        <span className="text-sm font-medium text-gray-900 truncate">
                                            {entry.customerName || 'Unknown Customer'}
                                        </span>
                                        {isFrequentlyUsed && (
                                            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                                                Used {entry.usageCount}x
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-xs text-gray-600 space-y-1">
                                        {keyFields.map(field => (
                                            <div key={field} className="flex items-center space-x-2">
                                                <span className="font-medium capitalize">
                                                    {field === 'pickupLocationDescription' ? 'Pickup' :
                                                        field === 'deliveryLocationDescription' ? 'Delivery' :
                                                            field.replace(/([A-Z])/g, ' $1').trim()}:
                                                </span>
                                                <span className="truncate">{entry[field]}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-gray-400">
                                            {formatLastUsed(entry.lastUsed)}
                                        </span>
                                        <span className="text-xs text-blue-600 hover:text-blue-800">
                                            Click to fill
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Click any entry to auto-fill the form</span>
                    <span>{recentEntries.length} of {stats?.forms[formType]?.historyEntries || 0} entries</span>
                </div>
            </div>

            {/* Clear Memory Confirmation Modal */}
            <ConfirmationModal
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={confirmClearMemory}
                title="Clear Form Memory"
                message="Are you sure you want to clear all form memory? This action cannot be undone."
                confirmText="Clear"
                cancelText="Cancel"
                type="warning"
            />
        </div>
    );
};

export default FormMemoryPanel;
