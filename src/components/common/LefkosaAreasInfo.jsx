import React from 'react';
import { MapPinIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const LefkosaAreasInfo = ({ showTitle = true, compact = false }) => {
    const lefkosaAreas = [
        'Terminal/City Center',
        'Kaymakli',
        'Hamitköy',
        'Yenişehir',
        'Kumsal',
        'Gönyeli',
        'Dereboyu',
        'Ortaköy',
        'Yenikent',
        'Taskinkoy',
        'Metehan',
        'Gocmenkoy',
        'Haspolat',
        'Alaykoy',
        'Marmara',
        'Kucuk'
    ];

    if (compact) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center mb-2">
                    <MapPinIcon className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-900">Lefkosa Service Areas</span>
                </div>
                <div className="text-xs text-blue-800">
                    {lefkosaAreas.slice(0, 5).join(', ')} and {lefkosaAreas.length - 5} more areas
                </div>
            </div>
        );
    }

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            {showTitle && (
                <div className="flex items-center mb-3">
                    <MapPinIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-blue-900">Lefkosa Service Areas</h3>
                </div>
            )}

            <div className="mb-3">
                <div className="flex items-center text-sm text-blue-800">
                    <InformationCircleIcon className="h-4 w-4 mr-1" />
                    <span>We currently serve {lefkosaAreas.length} areas in Lefkosa</span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {lefkosaAreas.map((area, index) => (
                    <div key={index} className="flex items-center text-sm text-blue-800">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                        <span>{area}</span>
                    </div>
                ))}
            </div>

            <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-700">
                    All delivery services are currently focused on the Lefkosa area.
                    Drivers can select their preferred service area during registration.
                </p>
            </div>
        </div>
    );
};

export default LefkosaAreasInfo;
