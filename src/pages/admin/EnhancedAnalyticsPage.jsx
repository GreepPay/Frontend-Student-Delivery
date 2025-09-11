import React, { useState, useEffect, useCallback, useRef } from 'react';
import { capitalizeName } from '../../utils/nameUtils';
import {
    ChartBarIcon,
    CurrencyDollarIcon,
    UsersIcon,
    TruckIcon,
    DocumentCheckIcon,
    ArrowTrendingUpIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    CalendarIcon,
    DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/api';
import { toast } from 'react-hot-toast';

// Skeleton Loader Components
const SkeletonMetricCard = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 animate-pulse">
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-20 sm:w-24 mb-1 sm:mb-2"></div>
                <div className="h-6 sm:h-8 bg-gray-200 rounded w-12 sm:w-16 mb-1"></div>
                <div className="h-2 sm:h-3 bg-gray-200 rounded w-16 sm:w-20"></div>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-gray-200 w-10 h-10 sm:w-12 sm:h-12"></div>
        </div>
    </div>
);

const SkeletonTable = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 animate-pulse">
        <div className="h-4 sm:h-6 bg-gray-200 rounded w-24 sm:w-32 mb-3 sm:mb-4"></div>
        <div className="space-y-2 sm:space-y-3">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-200 rounded-full"></div>
                        <div className="h-3 sm:h-4 bg-gray-200 rounded w-16 sm:w-20"></div>
                    </div>
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-10 sm:w-12"></div>
                </div>
            ))}
        </div>
    </div>
);

const SkeletonChart = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 animate-pulse">
        <div className="h-4 sm:h-6 bg-gray-200 rounded w-24 sm:w-32 mb-3 sm:mb-4"></div>
        <div className="h-48 sm:h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-200 rounded mx-auto mb-1 sm:mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-24 sm:w-32 mb-1"></div>
                <div className="h-2 sm:h-3 bg-gray-200 rounded w-20 sm:w-24"></div>
            </div>
        </div>
    </div>
);

const SkeletonSummary = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center animate-pulse">
                <div className="h-6 sm:h-8 bg-gray-200 rounded w-12 sm:w-16 mx-auto mb-1 sm:mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-16 sm:w-20 mx-auto"></div>
            </div>
        ))}
    </div>
);

const EnhancedAnalyticsPage = () => {
    const [loading, setLoading] = useState(true);
    const [sectionLoading, setSectionLoading] = useState({});
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [analyticsData, setAnalyticsData] = useState(null);
    const [selectedSection, setSelectedSection] = useState('overview');
    const [exporting, setExporting] = useState(false);
    const loadedSections = useRef(new Set());

    // Analytics sections
    const analyticsSections = [
        { key: 'overview', label: 'Overview', icon: ChartBarIcon, color: 'blue' },
        { key: 'financial', label: 'Financial', icon: CurrencyDollarIcon, color: 'green' },
        { key: 'drivers', label: 'Drivers', icon: UsersIcon, color: 'purple' },
        { key: 'deliveries', label: 'Deliveries', icon: TruckIcon, color: 'orange' },
        { key: 'documents', label: 'Documents', icon: DocumentCheckIcon, color: 'indigo' },
        { key: 'performance', label: 'Performance', icon: ArrowTrendingUpIcon, color: 'teal' },
        { key: 'remittances', label: 'Remittances', icon: ClockIcon, color: 'pink' },
        { key: 'growth', label: 'Growth', icon: ArrowTrendingUpIcon, color: 'emerald' }
    ];

    // Time periods
    const timePeriods = [
        { key: 'today', label: 'Today' },
        { key: 'week', label: 'This Week' },
        { key: 'month', label: 'This Month' },
        { key: 'quarter', label: 'This Quarter' },
        { key: 'year', label: 'This Year' }
    ];

    // Load analytics data
    const loadAnalyticsData = useCallback(async () => {
        try {
            setLoading(true);
            console.log('📊 EnhancedAnalyticsPage: Loading analytics data for period:', selectedPeriod);

            const response = await apiService.getEnhancedAnalytics(selectedPeriod);
            console.log('📊 EnhancedAnalyticsPage: Analytics data received:', response);

            // Handle the nested response structure from the backend
            if (response && response.success && response.data) {
                setAnalyticsData(response.data);
            } else {
                console.warn('📊 EnhancedAnalyticsPage: Invalid response structure:', response);
                setAnalyticsData(null);
            }
        } catch (error) {
            console.error('📊 EnhancedAnalyticsPage: Error loading analytics:', error);
            toast.error('Failed to load analytics data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod]);

    // Load specific section data
    const loadSectionData = useCallback(async (section) => {
        try {
            console.log('📊 EnhancedAnalyticsPage: Loading section data:', section);
            setSectionLoading(prev => ({ ...prev, [section]: true }));

            let response;
            switch (section) {
                case 'financial':
                    response = await apiService.getFinancialAnalytics(selectedPeriod);
                    break;
                case 'drivers':
                    response = await apiService.getDriverAnalytics(selectedPeriod);
                    break;
                case 'deliveries':
                    response = await apiService.getDeliveryAnalytics(selectedPeriod);
                    break;
                case 'documents':
                    response = await apiService.getDocumentAnalytics(selectedPeriod);
                    break;
                case 'performance':
                    response = await apiService.getPerformanceAnalytics(selectedPeriod);
                    break;
                case 'remittances':
                    response = await apiService.getRemittanceAnalytics(selectedPeriod);
                    break;
                case 'growth':
                    response = await apiService.getGrowthAnalytics(selectedPeriod);
                    break;
                default:
                    return;
            }

            console.log('📊 EnhancedAnalyticsPage: Section data received:', response);

            // Handle the nested response structure
            if (response && response.success && response.data) {
                // For individual section APIs, the data is nested under 'metrics'
                // For enhanced analytics, the data is directly in the section
                const sectionData = response.data.metrics || response.data;
                setAnalyticsData(prev => ({ ...prev, [section]: sectionData }));
                console.log(`📊 EnhancedAnalyticsPage: Set ${section} data:`, sectionData);
            } else {
                console.warn('📊 EnhancedAnalyticsPage: Invalid section response structure:', response);
            }
        } catch (error) {
            console.error('📊 EnhancedAnalyticsPage: Error loading section data:', error);
            toast.error(`Failed to load ${section} data. Please try again.`);
        } finally {
            setSectionLoading(prev => ({ ...prev, [section]: false }));
        }
    }, [selectedPeriod]);

    // Export data as comprehensive PDF using backend API
    const handleExportData = async () => {
        try {
            setExporting(true);
            console.log('📊 EnhancedAnalyticsPage: Exporting PDF for period:', selectedPeriod);

            // Get authentication token
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Authentication required. Please log in again.');
                return;
            }

            // Call the backend PDF export API
            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/analytics/export?period=${selectedPeriod}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Create blob from response
            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.pdf`;

            // Trigger download
            document.body.appendChild(a);
            a.click();

            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('PDF report downloaded successfully!');
            console.log('📊 EnhancedAnalyticsPage: PDF export completed successfully');

        } catch (error) {
            console.error('📊 EnhancedAnalyticsPage: Error exporting PDF:', error);
            toast.error('PDF export failed. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    // Load data on component mount and period change
    useEffect(() => {
        loadAnalyticsData();
        loadedSections.current.clear(); // Clear loaded sections when period changes
    }, [loadAnalyticsData]);

    // Load section data when section changes
    useEffect(() => {
        if (selectedSection !== 'overview' && analyticsData && !loading && !loadedSections.current.has(selectedSection)) {
            loadSectionData(selectedSection);
            loadedSections.current.add(selectedSection);
        }
    }, [selectedSection, loadSectionData, analyticsData, loading]);

    // Metric card component
    const MetricCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                    {trend && (
                        <div className={`flex items-center mt-2 text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trend > 0 ? (
                                <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />
                            ) : (
                                <ArrowTrendingUpIcon className="w-3 h-3 mr-1 transform rotate-180" />
                            )}
                            {Math.abs(trend)}% from last period
                        </div>
                    )}
                </div>
                <div className={`p-2 sm:p-3 rounded-lg bg-${color}-100`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${color}-600`} />
                </div>
            </div>
        </div>
    );

    // Overview section
    const renderOverview = () => {
        if (loading) {
            return (
                <div className="space-y-6">
                    {/* Skeleton for Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <SkeletonMetricCard key={i} />
                        ))}
                    </div>

                    {/* Skeleton for Driver Status */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="text-center">
                                    <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Skeleton for Document Verification */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        if (!analyticsData) {
            return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto" />
                    <h3 className="text-lg font-medium text-gray-900 mt-4">No Analytics Data</h3>
                    <p className="text-sm text-gray-600 mt-2">Unable to load analytics data. Please try again.</p>
                    <button
                        onClick={loadAnalyticsData}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Retry Loading
                    </button>
                </div>
            );
        }

        console.log('📊 EnhancedAnalyticsPage: Rendering overview with data:', analyticsData);

        const { core, financial, drivers, documents, deliveries, growth } = analyticsData;

        // Debug logging to understand the data structure
        console.log('📊 EnhancedAnalyticsPage: Overview data structure:', {
            core,
            financial,
            drivers,
            documents,
            deliveries,
            growth
        });

        return (
            <div className="space-y-4 sm:space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                    <MetricCard
                        title="Total Drivers"
                        value={core?.totalDrivers || 0}
                        subtitle={`${core?.activeDrivers || 0} active`}
                        icon={UsersIcon}
                        color="blue"
                    />
                    <MetricCard
                        title="Total Deliveries"
                        value={core?.totalDeliveries || 0}
                        subtitle={`${core?.completedDeliveries || 0} completed`}
                        icon={TruckIcon}
                        color="green"
                    />
                    <MetricCard
                        title="Total Revenue"
                        value={`₺${core?.totalRevenue?.toLocaleString() || 0}`}
                        subtitle={`₺${financial?.averageOrderValue?.toFixed(0) || 0} avg order`}
                        icon={CurrencyDollarIcon}
                        color="emerald"
                    />
                    <MetricCard
                        title="Growth Rate"
                        value={`${growth?.deliveryGrowth?.toFixed(1) || 0}%`}
                        subtitle="Delivery growth"
                        icon={ArrowTrendingUpIcon}
                        color="teal"
                    />
                </div>

                {/* Driver Status */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Driver Status</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div className="text-center">
                            <div className="text-lg sm:text-2xl font-bold text-green-600">{core?.activeDrivers || 0}</div>
                            <div className="text-xs sm:text-sm text-gray-600">Active Drivers</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg sm:text-2xl font-bold text-blue-600">{core?.onlineDrivers || 0}</div>
                            <div className="text-xs sm:text-sm text-gray-600">Online Now</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg sm:text-2xl font-bold text-purple-600">{documents?.verificationRate || 0}%</div>
                            <div className="text-xs sm:text-sm text-gray-600">Verification Rate</div>
                        </div>
                    </div>
                </div>

                {/* Document Verification Progress */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Document Verification</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Verification Rate</span>
                            <span className="text-sm font-medium text-green-600">{documents?.verificationRate || 0}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total Documents</span>
                            <span className="text-sm font-medium text-gray-900">{documents?.stats?.totalPendingDocuments || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Verified Documents</span>
                            <span className="text-sm font-medium text-green-600">{documents?.stats?.totalVerifiedDocuments || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Financial section
    const renderFinancial = () => {
        if (loading || sectionLoading.financial) {
            return (
                <div className="space-y-6">
                    {/* Skeleton for Financial Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <SkeletonMetricCard key={i} />
                        ))}
                    </div>

                    {/* Skeleton for Revenue Details */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Skeleton for Revenue Trends Chart */}
                    <SkeletonChart />
                </div>
            );
        }

        if (!analyticsData?.financial) {
            return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto" />
                    <h3 className="text-lg font-medium text-gray-900 mt-4">No Financial Data</h3>
                    <p className="text-sm text-gray-600 mt-2">Financial analytics data is not available.</p>
                </div>
            );
        }

        const { financial, growth, deliveries, performance } = analyticsData;
        console.log('📊 EnhancedAnalyticsPage: Rendering financial with data:', financial);
        console.log('📊 EnhancedAnalyticsPage: Financial metrics structure:', {
            totalRevenue: financial?.totalRevenue || financial?.metrics?.totalRevenue,
            averageOrderValue: financial?.averageOrderValue || financial?.metrics?.averageOrderValue,
            averageDriverEarning: financial?.averageDriverEarning || financial?.metrics?.averageDriverEarning,
            revenueGrowth: growth?.revenueGrowth || growth?.metrics?.revenueGrowth
        });

        return (
            <div className="space-y-6">
                {/* Financial Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Total Revenue"
                        value={`₺${financial?.totalRevenue?.toLocaleString() || 0}`}
                        subtitle="All time revenue"
                        icon={CurrencyDollarIcon}
                        color="green"
                    />
                    <MetricCard
                        title="Average Order Value"
                        value={`₺${financial?.averageOrderValue?.toFixed(0) || 0}`}
                        subtitle="Per delivery"
                        icon={CurrencyDollarIcon}
                        color="blue"
                    />
                    <MetricCard
                        title="Average Driver Earning"
                        value={`₺${financial?.averageDriverEarning?.toFixed(0) || 0}`}
                        subtitle="Per delivery"
                        icon={UsersIcon}
                        color="purple"
                    />
                    <MetricCard
                        title="Revenue Growth"
                        value={`${growth?.revenueGrowth?.toFixed(1) || 0}%`}
                        subtitle="This period"
                        icon={ArrowTrendingUpIcon}
                        color="emerald"
                        trend={growth?.revenueGrowth}
                    />
                </div>

                {/* Revenue Details */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Total Deliveries</span>
                                <span className="text-sm font-medium text-gray-900">{deliveries?.metrics?.totalDeliveries || deliveries?.totalDeliveries || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Completed Deliveries</span>
                                <span className="text-sm font-medium text-green-600">{deliveries?.metrics?.completedDeliveries || deliveries?.completedDeliveries || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Average Delivery Time</span>
                                <span className="text-sm font-medium text-gray-900">{performance?.avgDeliveryTime?.toFixed(1) || 0} min</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Payment Methods</span>
                                <span className="text-sm font-medium text-gray-900">{financial?.paymentMethodBreakdown?.length || 0} types</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Revenue Trends</span>
                                <span className="text-sm font-medium text-gray-900">{financial?.revenueData?.length || 0} periods</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Last Updated</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {analyticsData?.lastUpdated ? new Date(analyticsData.lastUpdated).toLocaleDateString('en-US') : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Revenue Trends Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>

                    {financial?.revenueData && financial.revenueData.length > 0 ? (
                        <div className="space-y-4">
                            {/* Revenue Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-green-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        ₺{financial.revenueData.reduce((sum, item) => sum + (item.revenue || 0), 0).toLocaleString()}
                                    </div>
                                    <div className="text-sm text-green-600">Total Revenue</div>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        ₺{(financial.revenueData.reduce((sum, item) => sum + (item.revenue || 0), 0) / financial.revenueData.length).toFixed(0)}
                                    </div>
                                    <div className="text-sm text-blue-600">Average Revenue</div>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {financial.revenueData.length}
                                    </div>
                                    <div className="text-sm text-purple-600">Data Points</div>
                                </div>
                            </div>

                            {/* Revenue Data Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deliveries</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {financial.revenueData.slice(0, 10).map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {item.period || `Period ${index + 1}`}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    ₺{item.revenue?.toLocaleString() || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {item.deliveries || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.growth > 0 ? 'bg-green-100 text-green-800' :
                                                        item.growth < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {item.growth > 0 ? '+' : ''}{item.growth?.toFixed(1) || 0}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Revenue Insights */}
                            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                                <h5 className="text-sm font-medium text-gray-900 mb-3">Revenue Insights</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Highest Revenue:</span>
                                        <span className="font-medium text-gray-900">
                                            ₺{Math.max(...financial.revenueData.map(item => item.revenue || 0)).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Lowest Revenue:</span>
                                        <span className="font-medium text-gray-900">
                                            ₺{Math.min(...financial.revenueData.map(item => item.revenue || 0)).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Average Growth:</span>
                                        <span className="font-medium text-gray-900">
                                            {(financial.revenueData.reduce((sum, item) => sum + (item.growth || 0), 0) / financial.revenueData.length).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Deliveries:</span>
                                        <span className="font-medium text-gray-900">
                                            {financial.revenueData.reduce((sum, item) => sum + (item.deliveries || 0), 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">No revenue trend data available</p>
                                <p className="text-xs text-gray-500 mt-1">Revenue trends will appear here when available</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Drivers section
    const renderDrivers = () => {
        if (loading || sectionLoading.drivers) {
            return (
                <div className="space-y-6">
                    {/* Skeleton for Driver Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <SkeletonMetricCard key={i} />
                        ))}
                    </div>

                    {/* Skeleton for Driver Activity */}
                    <SkeletonTable />

                    {/* Skeleton for Driver Performance Chart */}
                    <SkeletonChart />
                </div>
            );
        }

        if (!analyticsData?.drivers) {
            return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto" />
                    <h3 className="text-lg font-medium text-gray-900 mt-4">No Driver Data</h3>
                    <p className="text-sm text-gray-600 mt-2">Driver analytics data is not available.</p>
                </div>
            );
        }

        const { drivers, core } = analyticsData;
        console.log('📊 EnhancedAnalyticsPage: Rendering drivers with data:', drivers);
        console.log('📊 EnhancedAnalyticsPage: Driver metrics structure:', {
            totalDrivers: core?.totalDrivers || drivers?.metrics?.totalDrivers,
            activeDrivers: core?.activeDrivers || drivers?.metrics?.activeDrivers,
            onlineDrivers: core?.onlineDrivers || drivers?.metrics?.onlineDrivers,
            topPerformers: drivers?.topPerformers?.length || drivers?.metrics?.topPerformers?.length
        });

        return (
            <div className="space-y-6">
                {/* Driver Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Total Drivers"
                        value={drivers?.stats?.totalDrivers || 0}
                        subtitle="All registered drivers"
                        icon={UsersIcon}
                        color="blue"
                    />
                    <MetricCard
                        title="Active Drivers"
                        value={drivers?.stats?.activeDrivers || 0}
                        subtitle={`${((drivers?.stats?.activeDrivers || 0) / (drivers?.stats?.totalDrivers || 1) * 100).toFixed(1) || 0}% active rate`}
                        icon={CheckCircleIcon}
                        color="green"
                    />
                    <MetricCard
                        title="Online Drivers"
                        value={drivers?.stats?.onlineDrivers || 0}
                        subtitle={`${((drivers?.stats?.onlineDrivers || 0) / (drivers?.stats?.totalDrivers || 1) * 100).toFixed(1) || 0}% online rate`}
                        icon={ClockIcon}
                        color="purple"
                    />
                    <MetricCard
                        title="Top Performers"
                        value={drivers?.topPerformers?.length || 0}
                        subtitle="High-performing drivers"
                        icon={ArrowTrendingUpIcon}
                        color="teal"
                    />
                </div>

                {/* Driver Activity */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Activity</h3>
                    <div className="space-y-4">
                        {/* Driver Activity Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-blue-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-blue-600">{drivers?.activity?.length || 0}</div>
                                <div className="text-sm text-blue-600">Active Days</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-green-600">{drivers?.stats?.avgDeliveriesPerDriver?.toFixed(1) || 0}</div>
                                <div className="text-sm text-green-600">Avg Deliveries/Driver</div>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-purple-600">₺{drivers?.stats?.avgEarningsPerDriver?.toFixed(0) || 0}</div>
                                <div className="text-sm text-purple-600">Avg Earnings/Driver</div>
                            </div>
                        </div>

                        {/* Recent Driver Activity */}
                        <div>
                            <h4 className="text-md font-medium text-gray-900 mb-3">Recent Activity</h4>
                            <div className="space-y-2">
                                {drivers?.activity?.slice(0, 5).map((activity, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span className="text-sm text-gray-700">
                                                {new Date(activity._id.year, activity._id.month - 1, activity._id.day).toLocaleDateString('en-US')}
                                            </span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {activity.activeDrivers} active drivers
                                        </span>
                                    </div>
                                ))}
                                {(!drivers?.activity || drivers.activity.length === 0) && (
                                    <div className="text-center py-4 text-gray-500">
                                        No recent activity data available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Driver Performance Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Performance</h3>

                    {drivers?.topPerformers && drivers.topPerformers.length > 0 ? (
                        <div className="space-y-4">
                            {/* Performance Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-blue-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-600">{drivers.topPerformers.length}</div>
                                    <div className="text-sm text-blue-600">Top Performers</div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {drivers.topPerformers.reduce((sum, driver) => sum + (driver.deliveries || 0), 0)}
                                    </div>
                                    <div className="text-sm text-green-600">Total Deliveries</div>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {(drivers.topPerformers.reduce((sum, driver) => sum + (driver.rating || 0), 0) / drivers.topPerformers.length).toFixed(1)}
                                    </div>
                                    <div className="text-sm text-purple-600">Avg Rating</div>
                                </div>
                            </div>

                            {/* Top Performers List */}
                            <div className="space-y-3">
                                <h4 className="text-md font-medium text-gray-900">Top Performing Drivers</h4>
                                {drivers.topPerformers.slice(0, 5).map((driver, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 text-white text-sm font-bold rounded-full">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{capitalizeName(driver.name) || `Driver ${index + 1}`}</div>
                                                <div className="text-xs text-gray-600">{driver.role || 'Driver'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-gray-900">{driver.deliveries || 0} deliveries</div>
                                                <div className="text-xs text-gray-600">Completed</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-gray-900">{driver.rating?.toFixed(1) || 'N/A'}/5</div>
                                                <div className="text-xs text-gray-600">Rating</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-gray-900">₺{driver.earnings?.toLocaleString() || 0}</div>
                                                <div className="text-xs text-gray-600">Earnings</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Performance Metrics */}
                            {drivers.performance && (
                                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                                    <h5 className="text-sm font-medium text-gray-900 mb-3">Performance Insights</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Average Deliveries per Driver:</span>
                                            <span className="font-medium text-gray-900">
                                                {(drivers.topPerformers.reduce((sum, driver) => sum + (driver.deliveries || 0), 0) / drivers.topPerformers.length).toFixed(1)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Highest Rating:</span>
                                            <span className="font-medium text-gray-900">
                                                {Math.max(...drivers.topPerformers.map(driver => driver.rating || 0)).toFixed(1)}/5
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Total Earnings:</span>
                                            <span className="font-medium text-gray-900">
                                                ₺{drivers.topPerformers.reduce((sum, driver) => sum + (driver.earnings || 0), 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Active Drivers:</span>
                                            <span className="font-medium text-gray-900">
                                                {drivers.topPerformers.filter(driver => driver.isActive).length}/{drivers.topPerformers.length}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                                <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">No driver performance data available</p>
                                <p className="text-xs text-gray-500 mt-1">Driver performance metrics will appear here when available</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Deliveries section
    const renderDeliveries = () => {
        if (loading || sectionLoading.deliveries) {
            return (
                <div className="space-y-6">
                    {/* Skeleton for Delivery Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <SkeletonMetricCard key={i} />
                        ))}
                    </div>

                    {/* Skeleton for Delivery Status Breakdown */}
                    <SkeletonTable />

                    {/* Skeleton for Delivery Trends Chart */}
                    <SkeletonChart />
                </div>
            );
        }

        if (!analyticsData?.deliveries) {
            return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto" />
                    <h3 className="text-lg font-medium text-gray-900 mt-4">No Delivery Data</h3>
                    <p className="text-sm text-gray-600 mt-2">Delivery analytics data is not available.</p>
                </div>
            );
        }

        const { deliveries, performance, growth } = analyticsData;
        console.log('📊 EnhancedAnalyticsPage: Rendering deliveries with data:', deliveries);
        console.log('📊 EnhancedAnalyticsPage: Delivery metrics structure:', {
            totalDeliveries: deliveries?.metrics?.totalDeliveries || deliveries?.totalDeliveries,
            completedDeliveries: deliveries?.metrics?.completedDeliveries || deliveries?.completedDeliveries,
            directAccess: {
                totalDeliveries: deliveries?.totalDeliveries,
                completedDeliveries: deliveries?.completedDeliveries
            },
            metricsAccess: {
                totalDeliveries: deliveries?.metrics?.totalDeliveries,
                completedDeliveries: deliveries?.metrics?.completedDeliveries
            }
        });

        return (
            <div className="space-y-6">
                {/* Delivery Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Total Deliveries"
                        value={deliveries?.totalDeliveries || 0}
                        subtitle="All time deliveries"
                        icon={TruckIcon}
                        color="blue"
                    />
                    <MetricCard
                        title="Completed Deliveries"
                        value={deliveries?.completedDeliveries || 0}
                        subtitle={`${((deliveries?.completedDeliveries || 0) / (deliveries?.totalDeliveries || 1) * 100).toFixed(1) || 0}% success rate`}
                        icon={CheckCircleIcon}
                        color="green"
                    />
                    <MetricCard
                        title="Average Delivery Time"
                        value={`${performance?.avgDeliveryTime?.toFixed(1) || 0} min`}
                        subtitle="Per delivery"
                        icon={ClockIcon}
                        color="orange"
                    />
                    <MetricCard
                        title="Delivery Growth"
                        value={`${growth?.deliveryGrowth?.toFixed(1) || 0}%`}
                        subtitle="This period"
                        icon={ArrowTrendingUpIcon}
                        color="teal"
                        trend={growth?.deliveryGrowth}
                    />
                </div>

                {/* Delivery Status Breakdown */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Status Breakdown</h3>
                    <div className="space-y-4">
                        {deliveries?.statusBreakdown?.map((status, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${status._id === 'delivered' ? 'bg-green-500' :
                                        status._id === 'assigned' ? 'bg-blue-500' :
                                            status._id === 'pending' ? 'bg-yellow-500' :
                                                status._id === 'cancelled' ? 'bg-red-500' : 'bg-gray-500'
                                        }`}></div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-900 capitalize">{status._id}</span>
                                        <div className="text-xs text-gray-600">₺{status.revenue?.toLocaleString() || 0} revenue</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900">{status.count}</div>
                                    <div className="text-xs text-gray-600">deliveries</div>
                                </div>
                            </div>
                        )) || (
                                <div className="text-center py-4 text-sm text-gray-500">No status breakdown available</div>
                            )}
                    </div>
                </div>

                {/* Delivery Trends Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Trends</h3>

                    {deliveries?.trends && deliveries.trends.length > 0 ? (
                        <div className="space-y-4">
                            {/* Delivery Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-blue-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {deliveries.trends.reduce((sum, item) => sum + (item.total || 0), 0)}
                                    </div>
                                    <div className="text-sm text-blue-600">Total Deliveries</div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {deliveries.trends.reduce((sum, item) => sum + (item.completed || 0), 0)}
                                    </div>
                                    <div className="text-sm text-green-600">Completed</div>
                                </div>
                                <div className="bg-orange-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-orange-600">
                                        {deliveries.trends.length}
                                    </div>
                                    <div className="text-sm text-orange-600">Time Periods</div>
                                </div>
                            </div>

                            {/* Delivery Trends Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {deliveries.trends.slice(0, 10).map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {new Date(item._id.year, item._id.month - 1, item._id.day).toLocaleDateString('en-US')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {item.total || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {item.completed || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${((item.completed || 0) / (item.total || 1) * 100) >= 80 ? 'bg-green-100 text-green-800' :
                                                        ((item.completed || 0) / (item.total || 1) * 100) >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {((item.completed || 0) / (item.total || 1) * 100).toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    ₺{item.revenue?.toLocaleString() || 0}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Delivery Insights */}
                            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                                <h5 className="text-sm font-medium text-gray-900 mb-3">Delivery Insights</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Average Success Rate:</span>
                                        <span className="font-medium text-gray-900">
                                            {(deliveries.trends.reduce((sum, item) => sum + ((item.completed || 0) / (item.deliveries || 1) * 100), 0) / deliveries.trends.length).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Peak Delivery Period:</span>
                                        <span className="font-medium text-gray-900">
                                            {deliveries.trends.reduce((max, item) => (item.deliveries || 0) > (max.deliveries || 0) ? item : max, {}).period || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Average Delivery Time:</span>
                                        <span className="font-medium text-gray-900">
                                            {(deliveries.trends.reduce((sum, item) => sum + (item.avgTime || 0), 0) / deliveries.trends.filter(item => item.avgTime).length).toFixed(1)} min
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Time Periods:</span>
                                        <span className="font-medium text-gray-900">
                                            {deliveries.trends.length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                                <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">No delivery trend data available</p>
                                <p className="text-xs text-gray-500 mt-1">Delivery trends will appear here when available</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Documents section
    const renderDocuments = () => {
        if (loading || sectionLoading.documents) {
            return (
                <div className="space-y-6">
                    {/* Skeleton for Document Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <SkeletonMetricCard key={i} />
                        ))}
                    </div>

                    {/* Skeleton for Document Verification Trends */}
                    <SkeletonTable />

                    {/* Skeleton for Document Verification Chart */}
                    <SkeletonChart />
                </div>
            );
        }

        if (!analyticsData?.documents) {
            return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto" />
                    <h3 className="text-lg font-medium text-gray-900 mt-4">No Document Data</h3>
                    <p className="text-sm text-gray-600 mt-2">Document analytics data is not available.</p>
                </div>
            );
        }

        const { documents } = analyticsData;
        console.log('📊 EnhancedAnalyticsPage: Rendering documents with data:', documents);
        console.log('📊 EnhancedAnalyticsPage: Document metrics structure:', {
            totalDocuments: documents?.stats?.total || documents?.metrics?.totalDocuments,
            verifiedDocuments: documents?.stats?.verified || documents?.metrics?.verifiedDocuments,
            pendingDocuments: documents?.stats?.pending || documents?.metrics?.pendingDocuments,
            rejectedDocuments: documents?.stats?.rejected || documents?.metrics?.rejectedDocuments,
            verificationRate: documents?.verificationRate || documents?.metrics?.verificationRate
        });

        return (
            <div className="space-y-6">
                {/* Document Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Total Documents"
                        value={documents?.stats?.totalPendingDocuments || 0}
                        subtitle="All submitted documents"
                        icon={DocumentCheckIcon}
                        color="blue"
                    />
                    <MetricCard
                        title="Verified Documents"
                        value={documents?.stats?.totalVerifiedDocuments || 0}
                        subtitle={`${(documents?.verificationRate || 0).toFixed(1)}% verified`}
                        icon={CheckCircleIcon}
                        color="green"
                    />
                    <MetricCard
                        title="Pending Documents"
                        value={documents?.stats?.totalPendingDocuments || 0}
                        subtitle="Awaiting verification"
                        icon={ClockIcon}
                        color="orange"
                    />
                    <MetricCard
                        title="Rejected Documents"
                        value={documents?.stats?.totalRejectedDocuments || 0}
                        subtitle="Failed verification"
                        icon={ExclamationTriangleIcon}
                        color="red"
                    />
                </div>

                {/* Document Verification Trends */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Trends</h3>
                    <div className="space-y-4">
                        {/* Document Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-blue-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-blue-600">{documents?.stats?.totalDrivers || 0}</div>
                                <div className="text-sm text-blue-600">Total Drivers</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-green-600">{documents?.stats?.verifiedDrivers || 0}</div>
                                <div className="text-sm text-green-600">Verified Drivers</div>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-orange-600">{documents?.stats?.pendingDrivers || 0}</div>
                                <div className="text-sm text-orange-600">Pending Drivers</div>
                            </div>
                        </div>

                        {/* Recent Verification Activity */}
                        <div>
                            <h4 className="text-md font-medium text-gray-900 mb-3">Recent Activity</h4>
                            <div className="space-y-2">
                                {documents?.trends?.slice(0, 5).map((trend, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span className="text-sm text-gray-700">
                                                {new Date(trend._id.year, trend._id.month - 1, trend._id.day).toLocaleDateString('en-US')}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-gray-900">{trend.newDrivers} new drivers</div>
                                            <div className="text-xs text-gray-600">{trend.verifiedDrivers} verified</div>
                                        </div>
                                    </div>
                                ))}
                                {(!documents?.trends || documents.trends.length === 0) && (
                                    <div className="text-center py-4 text-gray-500">
                                        No recent verification activity
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Document Verification Status */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Verification Status</h3>
                    <div className="space-y-4">
                        {/* Verification Rate Summary */}
                        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 text-center">
                            <div className="text-3xl font-bold text-gray-900 mb-2">{documents?.verificationRate?.toFixed(1) || 0}%</div>
                            <div className="text-sm text-gray-600">Overall Verification Rate</div>
                        </div>

                        {/* Document Status Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-green-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-green-600">{documents?.stats?.totalVerifiedDocuments || 0}</div>
                                <div className="text-sm text-green-600">Verified Documents</div>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-orange-600">{documents?.stats?.totalPendingDocuments || 0}</div>
                                <div className="text-sm text-orange-600">Pending Documents</div>
                            </div>
                            <div className="bg-red-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-red-600">{documents?.stats?.totalRejectedDocuments || 0}</div>
                                <div className="text-sm text-red-600">Rejected Documents</div>
                            </div>
                        </div>

                        {/* Verification Insights */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="text-sm font-medium text-gray-900 mb-3">Verification Insights</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Documents:</span>
                                    <span className="font-medium text-gray-900">
                                        {(documents?.stats?.totalVerifiedDocuments || 0) + (documents?.stats?.totalPendingDocuments || 0) + (documents?.stats?.totalRejectedDocuments || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Verification Rate:</span>
                                    <span className="font-medium text-gray-900">{documents?.verificationRate?.toFixed(1) || 0}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Pending Rate:</span>
                                    <span className="font-medium text-gray-900">
                                        {(((documents?.stats?.totalPendingDocuments || 0) / ((documents?.stats?.totalVerifiedDocuments || 0) + (documents?.stats?.totalPendingDocuments || 0) + (documents?.stats?.totalRejectedDocuments || 0) || 1)) * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Rejection Rate:</span>
                                    <span className="font-medium text-gray-900">
                                        {(((documents?.stats?.totalRejectedDocuments || 0) / ((documents?.stats?.totalVerifiedDocuments || 0) + (documents?.stats?.totalPendingDocuments || 0) + (documents?.stats?.totalRejectedDocuments || 0) || 1)) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Performance section
    const renderPerformance = () => {
        if (loading || sectionLoading.performance) {
            return (
                <div className="space-y-6">
                    {/* Skeleton for Performance Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <SkeletonMetricCard key={i} />
                        ))}
                    </div>

                    {/* Skeleton for Driver Performance */}
                    <SkeletonTable />

                    {/* Skeleton for Performance Chart */}
                    <SkeletonChart />
                </div>
            );
        }

        if (!analyticsData?.performance) {
            return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto" />
                    <h3 className="text-lg font-medium text-gray-900 mt-4">No Performance Data</h3>
                    <p className="text-sm text-gray-600 mt-2">Performance analytics data is not available.</p>
                </div>
            );
        }

        const { performance } = analyticsData;
        console.log('📊 EnhancedAnalyticsPage: Rendering performance with data:', performance);
        console.log('📊 EnhancedAnalyticsPage: Performance metrics structure:', {
            avgDeliveryTime: performance?.avgDeliveryTime || performance?.metrics?.avgDeliveryTime,
            avgRating: performance?.avgRating || performance?.metrics?.avgRating,
            totalDrivers: performance?.totalDrivers || performance?.metrics?.totalDrivers
        });

        return (
            <div className="space-y-6">
                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <MetricCard
                        title="Average Delivery Time"
                        value={`${performance?.avgDeliveryTime?.toFixed(1) || 0} min`}
                        subtitle="Per delivery"
                        icon={ClockIcon}
                        color="blue"
                    />
                    <MetricCard
                        title="Average Rating"
                        value={`${performance?.avgRating?.toFixed(1) || 0}/5`}
                        subtitle="Customer satisfaction"
                        icon={CheckCircleIcon}
                        color="green"
                    />
                    <MetricCard
                        title="Total Drivers"
                        value={performance?.totalDrivers || 0}
                        subtitle="Active drivers"
                        icon={UsersIcon}
                        color="purple"
                    />
                </div>

                {/* Driver Performance */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Performance</h3>
                    <div className="space-y-4">
                        {performance?.driverPerformance?.map((driver, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <span className="text-sm font-medium text-gray-900">{capitalizeName(driver.name)}</span>
                                    <p className="text-xs text-gray-600">{driver.role}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-medium text-gray-900">{driver.deliveries} deliveries</span>
                                    <p className="text-xs text-gray-600">{driver.rating} rating</p>
                                </div>
                            </div>
                        )) || (
                                <div className="text-center py-4 text-sm text-gray-500">No driver performance data available</div>
                            )}
                    </div>
                </div>

                {/* Performance Trends */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
                    <div className="space-y-4">
                        {/* Performance Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-blue-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-blue-600">{performance?.totalDrivers || 0}</div>
                                <div className="text-sm text-blue-600">Active Drivers</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-green-600">{performance?.avgDeliveryTime?.toFixed(1) || 0} min</div>
                                <div className="text-sm text-green-600">Avg Delivery Time</div>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-purple-600">{performance?.avgRating?.toFixed(1) || 0}/5</div>
                                <div className="text-sm text-purple-600">Avg Rating</div>
                            </div>
                        </div>

                        {/* Driver Performance Table */}
                        <div>
                            <h4 className="text-md font-medium text-gray-900 mb-3">Driver Performance Details</h4>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deliveries</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {performance?.driverPerformance?.slice(0, 10).map((driver, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {capitalizeName(driver.name) || `Driver ${index + 1}`}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {driver.area || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {driver.deliveries || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {driver.avgDeliveryTime?.toFixed(1) || 'N/A'} min
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${(driver.avgRating || 0) >= 4 ? 'bg-green-100 text-green-800' :
                                                        (driver.avgRating || 0) >= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {driver.avgRating?.toFixed(1) || 'N/A'}/5
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!performance?.driverPerformance || performance.driverPerformance.length === 0) && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                                                    No driver performance data available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Performance Insights */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="text-sm font-medium text-gray-900 mb-3">Performance Insights</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Best Delivery Time:</span>
                                    <span className="font-medium text-gray-900">
                                        {performance?.driverPerformance?.length > 0 ?
                                            Math.min(...performance.driverPerformance.map(d => d.avgDeliveryTime || 999)).toFixed(1) : 'N/A'} min
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Worst Delivery Time:</span>
                                    <span className="font-medium text-gray-900">
                                        {performance?.driverPerformance?.length > 0 ?
                                            Math.max(...performance.driverPerformance.map(d => d.avgDeliveryTime || 0)).toFixed(1) : 'N/A'} min
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Most Active Driver:</span>
                                    <span className="font-medium text-gray-900">
                                        {performance?.driverPerformance?.length > 0 ?
                                            performance.driverPerformance.reduce((max, driver) =>
                                                (driver.deliveries || 0) > (max.deliveries || 0) ? driver : max
                                            ).name || 'N/A' : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Deliveries:</span>
                                    <span className="font-medium text-gray-900">
                                        {performance?.driverPerformance?.reduce((sum, driver) => sum + (driver.deliveries || 0), 0) || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Remittances section
    const renderRemittances = () => {
        if (loading || sectionLoading.remittances) {
            return (
                <div className="space-y-6">
                    {/* Skeleton for Remittance Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <SkeletonMetricCard key={i} />
                        ))}
                    </div>

                    {/* Skeleton for Remittance Status Breakdown */}
                    <SkeletonTable />

                    {/* Skeleton for Remittance Trends Chart */}
                    <SkeletonChart />
                </div>
            );
        }

        if (!analyticsData?.remittances) {
            return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto" />
                    <h3 className="text-lg font-medium text-gray-900 mt-4">No Remittance Data</h3>
                    <p className="text-sm text-gray-600 mt-2">Remittance analytics data is not available.</p>
                </div>
            );
        }

        const { remittances } = analyticsData;
        console.log('📊 EnhancedAnalyticsPage: Rendering remittances with data:', remittances);
        console.log('📊 EnhancedAnalyticsPage: Remittance metrics structure:', {
            totalRemittances: remittances?.totalRemittances || remittances?.metrics?.totalRemittances,
            completedRemittances: remittances?.completedRemittances || remittances?.metrics?.completedRemittances,
            pendingRemittances: remittances?.pendingRemittances || remittances?.metrics?.pendingRemittances,
            totalAmount: remittances?.totalAmount || remittances?.metrics?.totalAmount
        });

        return (
            <div className="space-y-6">
                {/* Remittance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Total Remittances"
                        value={remittances?.totalRemittances || 0}
                        subtitle="All time remittances"
                        icon={ClockIcon}
                        color="blue"
                    />
                    <MetricCard
                        title="Completed Remittances"
                        value={remittances?.completedRemittances || 0}
                        subtitle={`${((remittances?.completedRemittances || 0) / (remittances?.totalRemittances || 1) * 100).toFixed(1) || 0}% completed`}
                        icon={CheckCircleIcon}
                        color="green"
                    />
                    <MetricCard
                        title="Pending Remittances"
                        value={remittances?.pendingRemittances || 0}
                        subtitle="Awaiting completion"
                        icon={ClockIcon}
                        color="orange"
                    />
                    <MetricCard
                        title="Total Amount"
                        value={`₺${remittances?.totalAmount?.toLocaleString() || 0}`}
                        subtitle="Total remittance value"
                        icon={CurrencyDollarIcon}
                        color="emerald"
                    />
                </div>

                {/* Remittance Status Breakdown */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Remittance Status Breakdown</h3>
                    <div className="space-y-4">
                        {remittances?.statusBreakdown?.map((status, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${status._id === 'completed' ? 'bg-green-500' :
                                        status._id === 'pending' ? 'bg-yellow-500' :
                                            status._id === 'cancelled' ? 'bg-red-500' : 'bg-gray-500'
                                        }`}></div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-900 capitalize">{status._id}</span>
                                        <div className="text-xs text-gray-600">₺{status.totalAmount?.toLocaleString() || 0} total</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900">{status.count}</div>
                                    <div className="text-xs text-gray-600">remittances</div>
                                </div>
                            </div>
                        )) || (
                                <div className="text-center py-4 text-sm text-gray-500">No status breakdown available</div>
                            )}
                    </div>
                </div>

                {/* Remittance Trends */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Remittance Trends</h3>
                    <div className="space-y-4">
                        {/* Remittance Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-blue-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-blue-600">{remittances?.trends?.length || 0}</div>
                                <div className="text-sm text-blue-600">Trend Periods</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-green-600">₺{remittances?.totalAmount?.toLocaleString() || 0}</div>
                                <div className="text-sm text-green-600">Total Amount</div>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-purple-600">{remittances?.totalRemittances || 0}</div>
                                <div className="text-sm text-purple-600">Total Remittances</div>
                            </div>
                        </div>

                        {/* Recent Remittance Activity */}
                        <div>
                            <h4 className="text-md font-medium text-gray-900 mb-3">Recent Activity</h4>
                            <div className="space-y-2">
                                {remittances?.trends?.slice(0, 5).map((trend, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span className="text-sm text-gray-700">
                                                {new Date(trend._id.year, trend._id.month - 1, trend._id.day).toLocaleDateString('en-US')}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-gray-900">{trend.count} remittances</div>
                                            <div className="text-xs text-gray-600">₺{trend.totalAmount?.toLocaleString() || 0}</div>
                                        </div>
                                    </div>
                                ))}
                                {(!remittances?.trends || remittances.trends.length === 0) && (
                                    <div className="text-center py-4 text-gray-500">
                                        No recent remittance activity
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Remittance Insights */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="text-sm font-medium text-gray-900 mb-3">Remittance Insights</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Completion Rate:</span>
                                    <span className="font-medium text-gray-900">
                                        {((remittances?.completedRemittances || 0) / (remittances?.totalRemittances || 1) * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Average Amount:</span>
                                    <span className="font-medium text-gray-900">
                                        ₺{((remittances?.totalAmount || 0) / (remittances?.totalRemittances || 1)).toFixed(0)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Pending Amount:</span>
                                    <span className="font-medium text-gray-900">
                                        ₺{(remittances?.pendingRemittances || 0) * ((remittances?.totalAmount || 0) / (remittances?.totalRemittances || 1)).toFixed(0)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Completed Amount:</span>
                                    <span className="font-medium text-gray-900">
                                        ₺{(remittances?.completedRemittances || 0) * ((remittances?.totalAmount || 0) / (remittances?.totalRemittances || 1)).toFixed(0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Growth section
    const renderGrowth = () => {
        if (loading || sectionLoading.growth) {
            return (
                <div className="space-y-6">
                    {/* Skeleton for Growth Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <SkeletonMetricCard key={i} />
                        ))}
                    </div>

                    {/* Skeleton for Growth Comparison */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
                                <div className="space-y-2">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="flex justify-between items-center">
                                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                                            <div className="h-4 bg-gray-200 rounded w-8"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
                                <div className="space-y-2">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="flex justify-between items-center">
                                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                                            <div className="h-4 bg-gray-200 rounded w-8"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Skeleton for Growth Chart */}
                    <SkeletonChart />
                </div>
            );
        }

        if (!analyticsData?.growth) {
            return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto" />
                    <h3 className="text-lg font-medium text-gray-900 mt-4">No Growth Data</h3>
                    <p className="text-sm text-gray-600 mt-2">Growth analytics data is not available.</p>
                </div>
            );
        }

        const { growth } = analyticsData;
        console.log('📊 EnhancedAnalyticsPage: Rendering growth with data:', growth);
        console.log('📊 EnhancedAnalyticsPage: Growth metrics structure:', {
            driverGrowth: growth?.driverGrowth || growth?.metrics?.driverGrowth,
            revenueGrowth: growth?.revenueGrowth || growth?.metrics?.revenueGrowth,
            deliveryGrowth: growth?.deliveryGrowth || growth?.metrics?.deliveryGrowth
        });

        return (
            <div className="space-y-6">
                {/* Growth Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <MetricCard
                        title="Driver Growth"
                        value={`${growth?.driverGrowth?.toFixed(1) || 0}%`}
                        subtitle="New drivers this period"
                        icon={UsersIcon}
                        color="blue"
                        trend={growth?.driverGrowth}
                    />
                    <MetricCard
                        title="Revenue Growth"
                        value={`${growth?.revenueGrowth?.toFixed(1) || 0}%`}
                        subtitle="Revenue increase"
                        icon={CurrencyDollarIcon}
                        color="green"
                        trend={growth?.revenueGrowth}
                    />
                    <MetricCard
                        title="Delivery Growth"
                        value={`${growth?.deliveryGrowth?.toFixed(1) || 0}%`}
                        subtitle="Delivery increase"
                        icon={TruckIcon}
                        color="orange"
                        trend={growth?.deliveryGrowth}
                    />
                </div>


                {/* Growth Trends */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Trends</h3>
                    <div className="space-y-4">
                        {/* Growth Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-blue-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-blue-600">{growth?.driverGrowth?.toFixed(1) || 0}%</div>
                                <div className="text-sm text-blue-600">Driver Growth</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-green-600">{growth?.deliveryGrowth?.toFixed(1) || 0}%</div>
                                <div className="text-sm text-green-600">Delivery Growth</div>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold text-purple-600">{growth?.revenueGrowth?.toFixed(1) || 0}%</div>
                                <div className="text-sm text-purple-600">Revenue Growth</div>
                            </div>
                        </div>


                        {/* Growth Insights */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="text-sm font-medium text-gray-900 mb-3">Growth Insights</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Revenue Growth:</span>
                                    <span className={`font-medium ${(growth?.revenueGrowth || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {growth?.revenueGrowth?.toFixed(1) || 0}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Delivery Growth:</span>
                                    <span className={`font-medium ${(growth?.deliveryGrowth || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {growth?.deliveryGrowth?.toFixed(1) || 0}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Driver Growth:</span>
                                    <span className={`font-medium ${(growth?.driverGrowth || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {growth?.driverGrowth?.toFixed(1) || 0}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Completion Rate Change:</span>
                                    <span className={`font-medium ${((growth?.currentPeriod?.completionRate || 0) - (growth?.previousPeriod?.completionRate || 0)) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {((growth?.currentPeriod?.completionRate || 0) - (growth?.previousPeriod?.completionRate || 0)).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Revenue per Delivery:</span>
                                    <span className="font-medium text-gray-900">
                                        ₺{((growth?.currentPeriod?.totalRevenue || 0) / (growth?.currentPeriod?.totalDeliveries || 1)).toFixed(0)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Platform Fee Rate:</span>
                                    <span className="font-medium text-gray-900">
                                        {(((growth?.currentPeriod?.platformFees || 0) / (growth?.currentPeriod?.totalRevenue || 1)) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Render selected section
    const renderSelectedSection = () => {
        switch (selectedSection) {
            case 'overview':
                return renderOverview();
            case 'financial':
                return renderFinancial();
            case 'drivers':
                return renderDrivers();
            case 'deliveries':
                return renderDeliveries();
            case 'documents':
                return renderDocuments();
            case 'performance':
                return renderPerformance();
            case 'remittances':
                return renderRemittances();
            case 'growth':
                return renderGrowth();
            default:
                return (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">{selectedSection.charAt(0).toUpperCase() + selectedSection.slice(1)} Analytics</h2>
                        <p className="text-sm text-gray-600">This section will be implemented with detailed analytics for {selectedSection}.</p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 space-y-3 sm:space-y-4">
            {/* Header */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics & Insights</h1>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">Comprehensive platform analytics and business intelligence</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                        {/* Period Selector */}
                        <div className="flex items-center space-x-2">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="text-xs sm:text-sm border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            >
                                {timePeriods.map(period => (
                                    <option key={period.key} value={period.key}>
                                        {period.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Export Button */}
                        <button
                            onClick={handleExportData}
                            disabled={exporting || !analyticsData}
                            className="inline-flex items-center px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {exporting ? (
                                <>
                                    <ArrowPathIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" />
                                    <span className="hidden sm:inline">Generating PDF...</span>
                                    <span className="sm:hidden">Generating...</span>
                                </>
                            ) : (
                                <>
                                    <DocumentArrowDownIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    <span className="hidden sm:inline">Export PDF Report</span>
                                    <span className="sm:hidden">Export</span>
                                </>
                            )}
                        </button>

                        {/* Refresh Button */}
                        <button
                            onClick={loadAnalyticsData}
                            disabled={loading}
                            className="inline-flex items-center px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {loading ? (
                                <ArrowPathIcon className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                            ) : (
                                <ArrowPathIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center space-x-1 overflow-x-auto pb-2">
                    {analyticsSections.map(section => {
                        const Icon = section.icon;
                        return (
                            <button
                                key={section.key}
                                onClick={() => setSelectedSection(section.key)}
                                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${selectedSection === section.key
                                    ? `bg-${section.color}-100 text-${section.color}-700 border border-${section.color}-200`
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>{section.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="space-y-3 sm:space-y-4">
                {loading || sectionLoading[selectedSection] ? (
                    <div className="space-y-4 sm:space-y-6">
                        {/* Skeleton for Overview when initially loading */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                            {[...Array(4)].map((_, i) => (
                                <SkeletonMetricCard key={i} />
                            ))}
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 animate-pulse">
                            <div className="h-4 sm:h-6 bg-gray-200 rounded w-24 sm:w-32 mb-3 sm:mb-4"></div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="text-center">
                                        <div className="h-6 sm:h-8 bg-gray-200 rounded w-12 sm:w-16 mx-auto mb-1 sm:mb-2"></div>
                                        <div className="h-3 sm:h-4 bg-gray-200 rounded w-16 sm:w-20 mx-auto"></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 animate-pulse">
                            <div className="h-4 sm:h-6 bg-gray-200 rounded w-32 sm:w-40 mb-3 sm:mb-4"></div>
                            <div className="space-y-2 sm:space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <div className="h-3 sm:h-4 bg-gray-200 rounded w-20 sm:w-24"></div>
                                        <div className="h-3 sm:h-4 bg-gray-200 rounded w-10 sm:w-12"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : !analyticsData ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-12 text-center">
                        <ExclamationTriangleIcon className="h-8 w-8 sm:h-12 sm:w-12 text-red-400 mx-auto" />
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mt-3 sm:mt-4">No Analytics Data</h3>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">Unable to load analytics data. Please try again.</p>
                        <button
                            onClick={loadAnalyticsData}
                            className="mt-3 sm:mt-4 px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Retry Loading
                        </button>
                    </div>
                ) : (
                    renderSelectedSection()
                )}
            </div>
        </div>
    );
};

export default EnhancedAnalyticsPage;
