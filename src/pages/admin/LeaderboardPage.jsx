import React, { useState, useEffect, useCallback, useRef } from 'react';
import './LeaderboardPage.css';
import {
    TrophyIcon,
    StarIcon,
    BoltIcon,
    ShareIcon,
    CameraIcon,
    ChartBarIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    ClockIcon,
    CalendarIcon,
    GlobeAltIcon,
    ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import {
    TrophyIcon as TrophySolidIcon,
    StarIcon as StarSolidIcon,
    FireIcon as FireSolidIcon
} from '@heroicons/react/24/solid';
import { useSystemSettings } from '../../context/SystemSettingsContext';
import { getDashboardData, getTopDrivers } from '../../services/dashboardService';
import apiService from '../../services/api';
import dashboardWebSocketService from '../../services/dashboardWebSocketService';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import { capitalizeName } from '../../utils/nameUtils';
import VerifiedBadge from '../../components/common/VerifiedBadge';
import { isDriverVerified } from '../../utils/verificationHelpers';

const LeaderboardPage = () => {
    const { formatCurrency } = useSystemSettings();
    const [leaderboardData, setLeaderboardData] = useState({
        overall: [],
        drivers: [],
        referrals: [],
        earnings: [],
        rating: []
    });
    const [selectedCategory, setSelectedCategory] = useState('overall');
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [isLoading, setIsLoading] = useState(true);
    const [totalParticipants, setTotalParticipants] = useState(0);
    const [isExporting, setIsExporting] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
    const leaderboardRef = useRef(null);

    const categories = [
        { id: 'overall', name: 'Overall Champions', icon: TrophyIcon, color: 'from-amber-500 to-orange-600' },
        { id: 'delivery', name: 'Delivery Masters', icon: ChartBarIcon, color: 'from-blue-600 to-indigo-700' },
        { id: 'referrals', name: 'Referral Kings', icon: UserGroupIcon, color: 'from-emerald-600 to-teal-700' },
        { id: 'earnings', name: 'Top Earners', icon: CurrencyDollarIcon, color: 'from-green-600 to-emerald-700' },
        { id: 'rating', name: 'Performance Stars', icon: StarIcon, color: 'from-yellow-500 to-orange-600' }
    ];

    const periods = [
        { id: 'today', name: 'Today', icon: ClockIcon },
        { id: 'thisWeek', name: 'This Week', icon: CalendarIcon },
        { id: 'month', name: 'This Month', icon: ChartBarIcon },
        { id: 'allTime', name: 'All Time', icon: GlobeAltIcon }
    ];

    // Calculate points based on category
    const calculatePoints = (driver, category) => {
        switch (category) {
            case 'overall':
                return (driver.totalDeliveries * 10) +
                    (driver.totalEarnings * 0.1) +
                    (driver.rating * 10) +
                    (driver.totalReferrals * 20);
            case 'delivery':
                return driver.totalDeliveries * 10;
            case 'earnings':
                return driver.totalEarnings * 0.1;
            case 'referrals':
                return driver.totalReferrals * 20;
            case 'rating':
                return driver.rating * 10;
            default:
                return (driver.totalDeliveries * 10) + (driver.totalEarnings * 0.1);
        }
    };

    const loadLeaderboardData = useCallback(async () => {
        try {
            setIsLoading(true);
            console.log('🏆 Loading leaderboard data for period:', selectedPeriod, 'category:', selectedCategory);

            // Use the dedicated leaderboard API
            const leaderboardResponse = await apiService.getLeaderboard(selectedCategory, selectedPeriod, 20);

            if (leaderboardResponse.success && leaderboardResponse.data) {
                console.log('✅ Leaderboard data loaded successfully:', leaderboardResponse.data);

                // The API response structure is: { data: { leaderboard: [...], period: "...", generatedAt: "..." } }
                const leaderboardData = leaderboardResponse.data.leaderboard || leaderboardResponse.data;

                // Validate that we have actual data
                if (!leaderboardData || !Array.isArray(leaderboardData)) {
                    console.warn('⚠️ Invalid leaderboard data structure:', leaderboardData);
                    throw new Error('Invalid leaderboard data structure');
                }

                // Transform the data to match the expected format
                const transformedData = {
                    overall: leaderboardData,
                    drivers: leaderboardData,
                    referrals: leaderboardData,
                    earnings: leaderboardData,
                    rating: leaderboardData
                };

                setLeaderboardData(transformedData);
                setTotalParticipants(leaderboardData.length);

                console.log('📊 Processed leaderboard data:', {
                    category: selectedCategory,
                    period: selectedPeriod,
                    participants: leaderboardData.length,
                    total: leaderboardData.length
                });
            } else {
                console.error('❌ Invalid leaderboard response:', leaderboardResponse);

                // Try to extract data from different response structures
                let fallbackData = [];
                if (leaderboardResponse.data && Array.isArray(leaderboardResponse.data)) {
                    fallbackData = leaderboardResponse.data;
                } else if (leaderboardResponse.leaderboard && Array.isArray(leaderboardResponse.leaderboard)) {
                    fallbackData = leaderboardResponse.leaderboard;
                } else if (Array.isArray(leaderboardResponse)) {
                    fallbackData = leaderboardResponse;
                }

                if (fallbackData.length > 0) {
                    console.log('✅ Using fallback data structure:', fallbackData);
                    const transformedData = {
                        overall: fallbackData,
                        drivers: fallbackData,
                        referrals: fallbackData,
                        earnings: fallbackData,
                        rating: fallbackData
                    };
                    setLeaderboardData(transformedData);
                    setTotalParticipants(fallbackData.length);
                } else {
                    throw new Error('Invalid leaderboard response structure');
                }
            }

        } catch (error) {
            console.error('❌ Error loading leaderboard data:', error);

            // Provide specific error messages
            if (error.message?.includes('401')) {
                toast.error('Session expired. Please log in again.');
            } else if (error.message?.includes('403')) {
                toast.error('Access denied. Please contact support.');
            } else if (error.message?.includes('500')) {
                toast.error('Server error. Please try again later.');
            } else if (error.message?.includes('Network Error')) {
                toast.error('Network error. Please check your connection.');
            } else {
                toast.error('Failed to load leaderboard data. Please try again.');
            }

            // Set empty data on error to prevent UI from breaking
            setLeaderboardData({
                overall: [],
                drivers: [],
                referrals: [],
                earnings: [],
                rating: []
            });
            setTotalParticipants(0);
        } finally {
            setIsLoading(false);
        }
    }, [selectedPeriod, selectedCategory]);

    // Initialize WebSocket for real-time updates
    useEffect(() => {
        dashboardWebSocketService.initialize();

        // Subscribe to leaderboard updates
        const unsubscribe = dashboardWebSocketService.subscribe('leaderboard-update', (data) => {
            console.log('🏆 Received real-time leaderboard update:', data);
            if (data.period === selectedPeriod && data.category === selectedCategory) {
                setLeaderboardData(data.leaderboardData);
                setIsWebSocketConnected(true);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [selectedPeriod, selectedCategory]);

    // Load leaderboard data when component mounts or when period/category changes
    useEffect(() => {
        loadLeaderboardData();
    }, [loadLeaderboardData]);

    const calculateOverallScores = (drivers, referrals) => {
        const driverMap = new Map();

        drivers.forEach(driver => {
            const driverId = driver._id || driver.id;
            driverMap.set(driverId, {
                ...driver,
                deliveryScore: (driver.totalDeliveries || 0) * 10,
                earningsScore: (driver.totalEarnings || 0) * 0.1,
                ratingScore: (driver.rating || 0) * 20,
                referralScore: 0,
                overallScore: 0
            });
        });

        referrals.forEach(referral => {
            const driverId = referral.driverId || referral._id;
            if (driverMap.has(driverId)) {
                const driver = driverMap.get(driverId);
                driver.referralScore = (referral.totalReferrals || 0) * 50;
                driverMap.set(driverId, driver);
            } else {
                driverMap.set(driverId, {
                    ...referral,
                    deliveryScore: 0,
                    earningsScore: 0,
                    ratingScore: 0,
                    referralScore: (referral.totalReferrals || 0) * 50,
                    overallScore: 0
                });
            }
        });

        const overall = Array.from(driverMap.values()).map(driver => ({
            ...driver,
            overallScore: driver.deliveryScore + driver.earningsScore + driver.ratingScore + driver.referralScore
        }));

        return overall.sort((a, b) => b.overallScore - a.overallScore);
    };

    const getCurrentData = () => {
        try {
            // Ensure all leaderboardData properties are arrays
            const safeData = {
                drivers: Array.isArray(leaderboardData.drivers) ? leaderboardData.drivers : [],
                referrals: Array.isArray(leaderboardData.referrals) ? leaderboardData.referrals : [],
                overall: Array.isArray(leaderboardData.overall) ? leaderboardData.overall : [],
                earnings: Array.isArray(leaderboardData.earnings) ? leaderboardData.earnings : [],
                rating: Array.isArray(leaderboardData.rating) ? leaderboardData.rating : []
            };

            // Get the appropriate data based on selected category
            let currentData;
            switch (selectedCategory) {
                case 'delivery':
                    currentData = safeData.drivers.sort((a, b) => (b.totalDeliveries || 0) - (a.totalDeliveries || 0));
                    break;
                case 'referrals':
                    currentData = safeData.referrals.sort((a, b) => (b.totalReferrals || 0) - (a.totalReferrals || 0));
                    break;
                case 'earnings':
                    currentData = safeData.earnings.sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0));
                    break;
                case 'rating':
                    currentData = safeData.rating.filter(d => d.rating).sort((a, b) => (b.rating || 0) - (a.rating || 0));
                    break;
                case 'overall':
                default:
                    currentData = safeData.overall;
                    break;
            }

            // Ensure we return an array
            if (!Array.isArray(currentData)) {
                console.warn('Current data is not an array:', currentData);
                return [];
            }

            console.log('🏆 getCurrentData:', {
                category: selectedCategory,
                dataLength: currentData.length,
                data: currentData.slice(0, 3), // Log first 3 items
                firstItemPoints: currentData[0]?.points,
                firstItemOverallScore: currentData[0]?.overallScore
            });

            return currentData;
        } catch (error) {
            console.error('Error processing leaderboard data:', error);
            toast.error('Error processing data. Please refresh the page.');
            return [];
        }
    };

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1:
                return (
                    <div className="relative">
                        <TrophySolidIcon className="w-10 h-10 text-yellow-300 drop-shadow-lg" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-yellow-900">1</span>
                        </div>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                    </div>
                );
            case 2:
                return (
                    <div className="relative">
                        <TrophySolidIcon className="w-10 h-10 text-gray-200 drop-shadow-lg" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-700">2</span>
                        </div>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-slate-400 rounded-full animate-pulse"></div>
                    </div>
                );
            case 3:
                return (
                    <div className="relative">
                        <TrophySolidIcon className="w-10 h-10 text-amber-500 drop-shadow-lg" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-amber-900">3</span>
                        </div>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                    </div>
                );
            default:
                return (
                    <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-lg font-bold text-white drop-shadow-sm">#{rank}</span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
                    </div>
                );
        }
    };

    const getRankBadge = (rank) => {
        switch (rank) {
            case 1:
                return 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/30';
            case 2:
                return 'bg-gradient-to-br from-gray-300 via-slate-400 to-gray-600 text-white shadow-lg shadow-gray-500/30';
            case 3:
                return 'bg-gradient-to-br from-amber-600 via-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30';
            default:
                return 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md';
        }
    };

    const getCategoryIcon = (category) => {
        const categoryData = categories.find(c => c.id === category);
        return categoryData ? React.createElement(categoryData.icon, { className: "w-5 h-5" }) : null;
    };

    const exportAsImage = async () => {
        try {
            setIsExporting(true);
            toast.loading('Creating professional leaderboard export...');

            const currentData = getCurrentData();
            if (!Array.isArray(currentData) || currentData.length === 0) {
                toast.error('No data available to export. Please try loading data first.');
                return;
            }

            // Create a temporary container for the export (Instagram 1:1 format)
            const exportContainer = document.createElement('div');
            exportContainer.style.cssText = `
                position: fixed;
                top: -9999px;
                left: -9999px;
                width: 1080px;
                height: 1080px;
                background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 25%, #45b7d1 50%, #96ceb4 75%, #feca57 100%);
                padding: 60px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: white;
                z-index: -1;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            `;

            // Create the header section with bubbly design
            const header = document.createElement('div');
            header.style.cssText = `
                text-align: center;
                margin-bottom: 30px;
                padding: 40px;
                background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%);
                border-radius: 30px;
                backdrop-filter: blur(20px);
                border: 2px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 15px 35px rgba(0,0,0,0.2);
            `;

            const title = document.createElement('h1');
            title.textContent = `${categories.find(c => c.id === selectedCategory)?.name || 'Leaderboard'}`;
            title.style.cssText = `
                font-size: 56px;
                font-weight: 900;
                margin: 0 0 20px 0;
                background: linear-gradient(45deg, #fff, #ffeb3b, #ff9800, #e91e63);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                text-shadow: 3px 3px 6px rgba(0,0,0,0.4);
                letter-spacing: 2px;
            `;

            const subtitle = document.createElement('p');
            subtitle.textContent = `${periods.find(p => p.id === selectedPeriod)?.name || 'This Month'} • ${currentData.length} Participants`;
            subtitle.style.cssText = `
                font-size: 28px;
                margin: 0 0 15px 0;
                opacity: 0.95;
                font-weight: 700;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.4);
                background: linear-gradient(45deg, #fff, #e3f2fd);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                letter-spacing: 1px;
            `;

            const timestamp = document.createElement('p');
            timestamp.textContent = `Generated on ${new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}`;
            timestamp.style.cssText = `
                font-size: 16px;
                margin: 10px 0 0 0;
                opacity: 0.7;
                font-weight: 300;
            `;

            header.appendChild(title);
            header.appendChild(subtitle);
            header.appendChild(timestamp);

            // Create summary stats section with bubbly design
            const summaryStats = document.createElement('div');
            summaryStats.style.cssText = `
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 25px;
                margin-bottom: 30px;
            `;

            const totalDrivers = currentData.length;
            const totalDeliveries = currentData.reduce((sum, driver) => sum + (driver.totalDeliveries || 0), 0);
            const totalEarnings = currentData.reduce((sum, driver) => sum + (driver.totalEarnings || 0), 0);
            const avgRating = (currentData.reduce((sum, driver) => sum + (driver.rating || 0), 0) / currentData.length).toFixed(1);

            const stats = [
                { label: 'Total Drivers', value: totalDrivers, color: '#ff6b6b', bgGradient: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)' },
                { label: 'Total Deliveries', value: totalDeliveries, color: '#4ecdc4', bgGradient: 'linear-gradient(135deg, #4ecdc4, #44a08d)' },
                { label: 'Total Earnings', value: `₺${totalEarnings.toLocaleString()}`, color: '#45b7d1', bgGradient: 'linear-gradient(135deg, #45b7d1, #96c93d)' },
                { label: 'Avg Performance', value: avgRating, color: '#feca57', bgGradient: 'linear-gradient(135deg, #feca57, #ff9ff3)' }
            ];

            stats.forEach(stat => {
                const statCard = document.createElement('div');
                statCard.style.cssText = `
                    background: ${stat.bgGradient};
                    border-radius: 25px;
                    padding: 25px;
                    text-align: center;
                    backdrop-filter: blur(20px);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                    transform: perspective(1000px) rotateX(5deg);
                `;

                const value = document.createElement('div');
                value.textContent = stat.value;
                value.style.cssText = `
                    font-size: 36px;
                    font-weight: 900;
                    color: white;
                    margin-bottom: 8px;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                    letter-spacing: 1px;
                `;

                const label = document.createElement('div');
                label.textContent = stat.label;
                label.style.cssText = `
                    font-size: 16px;
                    opacity: 0.95;
                    font-weight: 700;
                    color: white;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
                    letter-spacing: 0.5px;
                `;

                statCard.appendChild(value);
                statCard.appendChild(label);
                summaryStats.appendChild(statCard);
            });

            // Create leaderboard entries with bubbly design
            const leaderboardContainer = document.createElement('div');
            leaderboardContainer.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 25px;
            `;

            currentData.slice(0, 5).forEach((item, index) => {
                const rank = index + 1;
                const name = capitalizeName(item.name || item.fullNameComputed || 'Unknown Driver');
                const email = item.email || '';

                const entry = document.createElement('div');
                entry.style.cssText = `
                    background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%);
                    border-radius: 30px;
                    padding: 30px;
                    display: flex;
                    align-items: center;
                    gap: 25px;
                    backdrop-filter: blur(20px);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    box-shadow: 0 15px 35px rgba(0,0,0,0.2);
                    transform: perspective(1000px) rotateX(2deg);
                    position: relative;
                    overflow: hidden;
                `;

                // Add rank badge
                const rankBadge = document.createElement('div');
                rankBadge.style.cssText = `
                    width: 90px;
                    height: 90px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 28px;
                    font-weight: 900;
                    flex-shrink: 0;
                    ${rank === 1 ? 'background: linear-gradient(135deg, #ff6b6b, #ffeb3b, #ff9800);' :
                        rank === 2 ? 'background: linear-gradient(135deg, #4ecdc4, #44a08d, #96c93d);' :
                            rank === 3 ? 'background: linear-gradient(135deg, #45b7d1, #96c93d, #feca57);' :
                                'background: linear-gradient(135deg, #96ceb4, #feca57, #ff9ff3);'}
                    box-shadow: 0 15px 30px rgba(0,0,0,0.4);
                    border: 3px solid rgba(255,255,255,0.5);
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                `;
                rankBadge.textContent = `#${rank}`;

                // Add driver info
                const driverInfo = document.createElement('div');
                driverInfo.style.cssText = `
                    flex: 1;
                `;

                const driverName = document.createElement('div');
                driverName.textContent = name;
                driverName.style.cssText = `
                    font-size: 32px;
                    font-weight: 900;
                    margin-bottom: 8px;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.4);
                    letter-spacing: 1px;
                `;

                const driverEmail = document.createElement('div');
                driverEmail.textContent = email;
                driverEmail.style.cssText = `
                    font-size: 18px;
                    opacity: 0.9;
                    margin-bottom: 12px;
                    color: rgba(255,255,255,0.9);
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
                `;

                // Add performance metrics
                const metrics = document.createElement('div');
                metrics.style.cssText = `
                    display: flex;
                    gap: 35px;
                    align-items: center;
                `;

                const getMetricValue = () => {
                    switch (selectedCategory) {
                        case 'delivery':
                            return `${item.totalDeliveries || 0} Deliveries`;
                        case 'earnings':
                            return `₺${(item.totalEarnings || 0).toLocaleString()}`;
                        case 'referrals':
                            return `${item.totalReferrals || 0} Referrals`;
                        case 'rating':
                            return `${(item.rating || 0).toFixed(1)} Performance`;
                        default:
                            return `${Math.round(item.points || item.overallScore || 0)} Points`;
                    }
                };

                const metricValue = document.createElement('div');
                metricValue.textContent = getMetricValue();
                metricValue.style.cssText = `
                    font-size: 28px;
                    font-weight: 900;
                    color: #ffeb3b;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.4);
                    letter-spacing: 1px;
                `;

                const metricLabel = document.createElement('div');
                metricLabel.textContent = selectedCategory === 'delivery' ? 'Total Deliveries' :
                    selectedCategory === 'earnings' ? 'Total Earnings' :
                        selectedCategory === 'referrals' ? 'Total Referrals' :
                            selectedCategory === 'rating' ? 'Performance Rating' : 'Total Points';
                metricLabel.style.cssText = `
                    font-size: 16px;
                    opacity: 0.9;
                    color: rgba(255,255,255,0.9);
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
                    font-weight: 600;
                `;

                const metricContainer = document.createElement('div');
                metricContainer.appendChild(metricValue);
                metricContainer.appendChild(metricLabel);

                // Add achievements
                const achievements = document.createElement('div');
                achievements.style.cssText = `
                    display: flex;
                    gap: 10px;
                    align-items: center;
                `;

                if (rank === 1) {
                    const trophy = document.createElement('span');
                    trophy.textContent = '🏆';
                    trophy.style.cssText = 'font-size: 24px;';
                    achievements.appendChild(trophy);
                }

                if (item.rating >= 4.8) {
                    const star = document.createElement('span');
                    star.textContent = '⭐';
                    star.style.cssText = 'font-size: 20px;';
                    achievements.appendChild(star);
                }

                if (item.totalDeliveries >= 50) {
                    const fire = document.createElement('span');
                    fire.textContent = '🔥';
                    fire.style.cssText = 'font-size: 20px;';
                    achievements.appendChild(fire);
                }

                metrics.appendChild(metricContainer);
                metrics.appendChild(achievements);

                driverInfo.appendChild(driverName);
                driverInfo.appendChild(driverEmail);
                driverInfo.appendChild(metrics);

                entry.appendChild(rankBadge);
                entry.appendChild(driverInfo);
                leaderboardContainer.appendChild(entry);
            });

            // Add footer
            const footer = document.createElement('div');
            footer.style.cssText = `
                text-align: center;
                margin-top: 30px;
                padding: 20px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            `;

            const footerText = document.createElement('p');
            footerText.textContent = '🚀 Join our delivery network and start earning today!';
            footerText.style.cssText = `
                font-size: 18px;
                margin: 0 0 10px 0;
                font-weight: 500;
            `;

            const contactInfo = document.createElement('p');
            contactInfo.textContent = '📞 Contact: +90 533 832 97 85 • 📧 info@deliveryapp.com';
            contactInfo.style.cssText = `
                font-size: 14px;
                margin: 0;
                opacity: 0.8;
            `;

            footer.appendChild(footerText);
            footer.appendChild(contactInfo);

            // Assemble the export
            exportContainer.appendChild(header);
            exportContainer.appendChild(summaryStats);
            exportContainer.appendChild(leaderboardContainer);
            exportContainer.appendChild(footer);

            document.body.appendChild(exportContainer);

            // Generate the image (Instagram 1:1 format)
            const canvas = await html2canvas(exportContainer, {
                width: 1080,
                height: 1080,
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null
            });

            // Create download link
            const link = document.createElement('a');
            link.download = `leaderboard-${selectedCategory}-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();

            // Cleanup
            document.body.removeChild(exportContainer);
            toast.dismiss();
            toast.success('Professional leaderboard export created successfully! 🎉');

        } catch (error) {
            console.error('Export error:', error);
            toast.dismiss();
            toast.error('Failed to create export. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const shareToSocialMedia = async (platform) => {
        try {
            const currentData = getCurrentData();
            if (!Array.isArray(currentData) || currentData.length === 0) {
                toast.error('No data available to share. Please try loading data first.');
                return;
            }

            const categoryName = categories.find(c => c.id === selectedCategory)?.name || 'Leaderboard';
            const periodName = periods.find(p => p.id === selectedPeriod)?.name || 'This Month';

            // Get top 3 performers
            const top3 = currentData.slice(0, 3);
            const totalDrivers = currentData.length;
            const totalDeliveries = currentData.reduce((sum, driver) => sum + (driver.totalDeliveries || 0), 0);
            const totalEarnings = currentData.reduce((sum, driver) => sum + (driver.totalEarnings || 0), 0);

            // Create engaging share text
            let shareText = `🏆 ${categoryName} - ${periodName}\n\n`;
            shareText += `📊 ${totalDrivers} drivers • ${totalDeliveries} deliveries • ₺${totalEarnings.toLocaleString()} earnings\n\n`;
            shareText += `🥇 Top Performers:\n`;

            top3.forEach((item, index) => {
                const rank = index + 1;
                const name = capitalizeName(item.name || item.fullNameComputed || 'Unknown Driver');
                const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';

                const getMetricValue = () => {
                    switch (selectedCategory) {
                        case 'delivery':
                            return `${item.totalDeliveries || 0} deliveries`;
                        case 'earnings':
                            return `₺${(item.totalEarnings || 0).toLocaleString()}`;
                        case 'referrals':
                            return `${item.totalReferrals || 0} referrals`;
                        case 'rating':
                            return `${(item.rating || 0).toFixed(1)} performance`;
                        default:
                            return `${Math.round(item.points || item.overallScore || 0)} points`;
                    }
                };

                shareText += `${rankEmoji} ${name}: ${getMetricValue()}\n`;
            });

            shareText += `\n🚀 Join our delivery network and start earning today!\n`;
            shareText += `📞 Contact: +90 533 832 97 85\n`;
            shareText += `🌐 #DeliveryNetwork #TopPerformers #EarnMore`;

            switch (platform) {
                case 'whatsapp':
                    try {
                        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`);
                        toast.success('Opening WhatsApp... 📱');
                    } catch (error) {
                        toast.error('Failed to open WhatsApp. Please copy the text manually.');
                    }
                    break;
                case 'telegram':
                    try {
                        window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText)}`);
                        toast.success('Opening Telegram... ✈️');
                    } catch (error) {
                        toast.error('Failed to open Telegram. Please copy the text manually.');
                    }
                    break;
                case 'twitter':
                    try {
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`);
                        toast.success('Opening Twitter... 🐦');
                    } catch (error) {
                        toast.error('Failed to open Twitter. Please copy the text manually.');
                    }
                    break;
                case 'facebook':
                    try {
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareText)}`);
                        toast.success('Opening Facebook... 📘');
                    } catch (error) {
                        toast.error('Failed to open Facebook. Please copy the text manually.');
                    }
                    break;
                case 'copy':
                    try {
                        await navigator.clipboard.writeText(shareText);
                        toast.success('📋 Leaderboard copied to clipboard! Ready to paste anywhere.');
                    } catch (error) {
                        console.error('Clipboard error:', error);
                        toast.error('Failed to copy to clipboard. Please select and copy the text manually.');
                    }
                    break;
                default:
                    toast.error('Unknown sharing platform. Please try again.');
                    return;
            }

            setShowShareModal(false);
        } catch (error) {
            console.error('Error sharing:', error);

            if (error.message?.includes('clipboard')) {
                toast.error('Clipboard access denied. Please copy the text manually.');
            } else if (error.message?.includes('window.open')) {
                toast.error('Pop-up blocked. Please allow pop-ups for this site.');
            } else {
                toast.error('Failed to share leaderboard. Please try again.');
            }
        }
    };

    const currentData = getCurrentData();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-12 bg-gray-200 rounded-lg mb-8"></div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="h-96 bg-gray-200 rounded-lg"></div>
                            <div className="h-96 bg-gray-200 rounded-lg"></div>
                            <div className="h-96 bg-gray-200 rounded-lg"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const getProgressBarColor = (category) => {
        const colors = {
            'overall': 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600',
            'delivery': 'bg-gradient-to-r from-blue-500 to-indigo-600',
            'earnings': 'bg-gradient-to-r from-green-500 to-emerald-600',
            'referrals': 'bg-gradient-to-r from-emerald-500 to-teal-600',
            'rating': 'bg-gradient-to-r from-yellow-500 to-orange-600'
        };
        return colors[category] || 'bg-gradient-to-r from-blue-500 to-purple-600';
    };

    const calculateProgressWidth = (item, category, allData) => {
        if (!allData || allData.length === 0) return 0;

        let maxValue = 0;
        let currentValue = 0;

        switch (category) {
            case 'overall':
                maxValue = allData[0]?.points || allData[0]?.overallScore || 1;
                currentValue = item.points || item.overallScore || 0;
                break;
            case 'delivery':
                maxValue = allData[0]?.totalDeliveries || 1;
                currentValue = item.totalDeliveries || 0;
                break;
            case 'referrals':
                maxValue = allData[0]?.totalReferrals || 1;
                currentValue = item.totalReferrals || 0;
                break;
            case 'earnings':
                maxValue = allData[0]?.totalEarnings || 1;
                currentValue = item.totalEarnings || 0;
                break;
            case 'rating':
                maxValue = allData[0]?.rating || 1;
                currentValue = item.rating || 0;
                break;
            default:
                maxValue = 1;
                currentValue = 0;
        }

        return Math.max(0, Math.min(100, (currentValue / maxValue) * 100));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-4 lg:p-6">
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes scaleIn {
                        from { 
                            opacity: 0; 
                            transform: scale(0.9); 
                        }
                        to { 
                            opacity: 1; 
                            transform: scale(1); 
                        }
                    }
                `}
            </style>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-4 sm:mb-6 lg:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">
                                🏆 Platform Leaderboard
                            </h1>
                            <p className="text-gray-600 text-xs sm:text-sm lg:text-base">
                                Celebrating our top performers across all platform activities
                            </p>
                        </div>



                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            <button
                                onClick={() => {
                                    if (isLoading) {
                                        toast.error('Please wait for data to load before exporting.');
                                        return;
                                    }
                                    const currentData = getCurrentData();
                                    if (!Array.isArray(currentData) || currentData.length === 0) {
                                        toast.error('No data available to export. Please try loading data first.');
                                        return;
                                    }
                                    exportAsImage();
                                }}
                                disabled={isExporting || isLoading}
                                className="group relative flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                <div className="relative">
                                    <CameraIcon className="w-5 h-5 group-hover:animate-pulse" />
                                    {isExporting && (
                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                                    )}
                                </div>
                                <span className="font-medium">
                                    {isExporting ? 'Generating...' : 'Export Image'}
                                </span>
                                {!isExporting && (
                                    <div className="text-xs opacity-80">PNG</div>
                                )}
                            </button>

                            <button
                                onClick={() => {
                                    if (isLoading) {
                                        toast.error('Please wait for data to load before sharing.');
                                        return;
                                    }
                                    const currentData = getCurrentData();
                                    if (!Array.isArray(currentData) || currentData.length === 0) {
                                        toast.error('No data available to share. Please try loading data first.');
                                        return;
                                    }
                                    setShowShareModal(true);
                                }}
                                disabled={isLoading}
                                className="group relative flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:via-teal-700 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                <div className="relative">
                                    <ShareIcon className="w-5 h-5 group-hover:animate-bounce" />
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-0 group-hover:opacity-100"></div>
                                </div>
                                <span className="font-medium">Share</span>
                                <div className="text-xs opacity-80">Social</div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-4 sm:mb-6 lg:mb-8">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        {/* Period Filter */}
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                            {periods.map(period => (
                                <button
                                    key={period.id}
                                    onClick={() => {
                                        if (isLoading) {
                                            toast.error('Please wait for current data to load.');
                                            return;
                                        }
                                        setSelectedPeriod(period.id);
                                    }}
                                    disabled={isLoading}
                                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg transition-all duration-200 text-xs sm:text-sm ${selectedPeriod === period.id
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <period.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="hidden xs:inline">{period.name}</span>
                                    <span className="xs:hidden">{period.name.split(' ')[0]}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="mb-4 sm:mb-6 lg:mb-8">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 max-w-6xl mx-auto">
                        {categories.map(category => (
                            <button
                                key={category.id}
                                onClick={() => {
                                    if (isLoading) {
                                        toast.error('Please wait for current data to load.');
                                        return;
                                    }
                                    setSelectedCategory(category.id);
                                }}
                                disabled={isLoading}
                                className={`relative p-3 sm:p-4 lg:p-6 rounded-xl transition-all duration-300 transform hover:scale-105 ${selectedCategory === category.id
                                    ? `bg-gradient-to-r ${category.color} text-white shadow-xl`
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
                                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className="flex flex-col items-center gap-2 sm:gap-3">
                                    <category.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
                                    <span className="text-xs sm:text-sm font-medium text-center leading-tight">{category.name}</span>
                                </div>
                                {selectedCategory === category.id && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Leaderboard */}
                <div ref={leaderboardRef} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-4 sm:p-6 lg:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
                            <div className="flex items-center gap-2 sm:gap-3">
                                {getCategoryIcon(selectedCategory)}
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                                        {categories.find(c => c.id === selectedCategory)?.name}
                                    </h2>
                                    <p className="text-xs text-gray-500">
                                        {periods.find(p => p.id === selectedPeriod)?.name} • {Array.isArray(currentData) ? currentData.length : 0} participants
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <div className={`w-2 h-2 rounded-full ${isWebSocketConnected ? 'bg-green-500' : 'bg-blue-400'}`}></div>
                                <span>
                                    {isWebSocketConnected ? 'Live Updates' : 'Real-time Data'}
                                </span>
                                {Array.isArray(currentData) && currentData.length > 0 && (
                                    <>
                                        <span>•</span>
                                        <span>Last updated: {new Date().toLocaleTimeString()}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Summary Stats */}
                        {Array.isArray(currentData) && currentData.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-blue-100">
                                <div className="text-center">
                                    <div className="text-lg sm:text-xl font-bold text-blue-600">
                                        {currentData.length}
                                    </div>
                                    <div className="text-xs text-gray-600">Total Drivers</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg sm:text-xl font-bold text-green-600">
                                        {currentData.reduce((sum, driver) => sum + (driver.totalDeliveries || 0), 0)}
                                    </div>
                                    <div className="text-xs text-gray-600">Total Deliveries</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg sm:text-xl font-bold text-purple-600">
                                        {formatCurrency(currentData.reduce((sum, driver) => sum + (driver.totalEarnings || 0), 0))}
                                    </div>
                                    <div className="text-xs text-gray-600">Total Earnings</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg sm:text-xl font-bold text-yellow-600">
                                        {(currentData.reduce((sum, driver) => sum + (driver.rating || 0), 0) / currentData.length).toFixed(1)}
                                    </div>
                                    <div className="text-xs text-gray-600">Avg Performance</div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3 sm:space-y-4 ">
                            {Array.isArray(currentData) && currentData.slice(0, 10).map((item, index) => {
                                const rank = index + 1;
                                const name = capitalizeName(item.name || item.fullNameComputed || 'Unknown Driver');
                                const email = item.email || '';

                                // Better avatar handling with fallback
                                const getAvatarUrl = () => {
                                    if (item.profilePicture && item.profilePicture !== '') {
                                        return item.profilePicture;
                                    }
                                    if (item.profileImage && item.profileImage !== '') {
                                        return item.profileImage;
                                    }
                                    if (item.avatar && item.avatar !== '') {
                                        return item.avatar;
                                    }
                                    if (item.image && item.image !== '') {
                                        return item.image;
                                    }
                                    // Fallback to generated avatar with better styling
                                    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=ffffff&size=128&font-size=0.4&bold=true`;
                                };

                                return (
                                    <div
                                        key={item._id || item.id || index}
                                        className={`relative p-3 sm:p-4 lg:p-6 rounded-xl transition-all duration-300 hover:shadow-lg ${rank <= 3 ? 'bg-gradient-to-r from-gray-50 to-white border-2' : 'bg-gray-50 hover:bg-white'
                                            } ${rank === 1 ? 'border-yellow-300' : rank === 2 ? 'border-gray-300' : rank === 3 ? 'border-amber-400' : 'border-transparent'}`}
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
                                            {/* Rank */}
                                            <div className="flex-shrink-0">
                                                <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center ${getRankBadge(rank)}`}>
                                                    {getRankIcon(rank)}
                                                </div>
                                            </div>

                                            {/* Avatar & Info */}
                                            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
                                                <img
                                                    src={getAvatarUrl()}
                                                    alt={name}
                                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                                                    onError={(e) => {
                                                        // Fallback to generated avatar if image fails to load
                                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=ffffff&size=128&font-size=0.4&bold=true`;
                                                    }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{name}</h3>
                                                        <VerifiedBadge
                                                            isVerified={isDriverVerified(item)}
                                                            size="xs"
                                                            className="flex-shrink-0"
                                                        />
                                                    </div>
                                                    <p className="text-xs sm:text-sm text-gray-500 truncate">{email}</p>
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 flex-shrink-0">
                                                {selectedCategory === 'delivery' && (
                                                    <div className="text-center">
                                                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                                                            {item.totalDeliveries || 0}
                                                        </div>
                                                        <div className="text-xs sm:text-sm text-gray-500">Deliveries</div>
                                                        <div className="text-xs text-blue-400 font-medium">
                                                            {item.completionRate ? `${Math.round(item.completionRate)}%` : '100%'} Success
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedCategory === 'referrals' && (
                                                    <div className="text-center">
                                                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                                                            {item.totalReferrals || 0}
                                                        </div>
                                                        <div className="text-xs sm:text-sm text-gray-500">Referrals</div>
                                                        <div className="text-xs text-green-400 font-medium">
                                                            {item.totalReferrals * 20 || 0} Points
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedCategory === 'earnings' && (
                                                    <div className="text-center">
                                                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                                                            {formatCurrency(item.totalEarnings || 0)}
                                                        </div>
                                                        <div className="text-xs sm:text-sm text-gray-500">Earnings</div>
                                                        <div className="text-xs text-green-400 font-medium">
                                                            {item.totalDeliveries || 0} Deliveries
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedCategory === 'rating' && (
                                                    <div className="text-center">
                                                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">
                                                            {item.rating ? parseFloat(item.rating).toFixed(1) : '0.0'}
                                                        </div>
                                                        <div className="text-xs sm:text-sm text-gray-500">Performance Rating</div>
                                                        <div className="text-xs text-yellow-400 font-medium">
                                                            {item.totalDeliveries || 0} Completed Deliveries
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedCategory === 'overall' && (
                                                    <div className="text-center">
                                                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">
                                                            {Math.round(item.points || item.overallScore || 0)}
                                                        </div>
                                                        <div className="text-xs sm:text-sm text-gray-500">Points</div>
                                                        <div className="text-xs text-purple-400 font-medium">
                                                            #{rank} Rank
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Enhanced Achievements */}
                                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                                {rank === 1 && (
                                                    <div className="relative">
                                                        <TrophySolidIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 drop-shadow-lg animate-bounce" />
                                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
                                                    </div>
                                                )}
                                                {rank === 2 && (
                                                    <div className="relative">
                                                        <TrophySolidIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 drop-shadow-lg" />
                                                        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-gray-400 rounded-full animate-ping"></div>
                                                    </div>
                                                )}
                                                {rank === 3 && (
                                                    <div className="relative">
                                                        <TrophySolidIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 drop-shadow-lg" />
                                                        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping"></div>
                                                    </div>
                                                )}
                                                {item.rating >= 4.8 && (
                                                    <div className="relative">
                                                        <StarSolidIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 drop-shadow-lg animate-pulse" />
                                                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping"></div>
                                                    </div>
                                                )}
                                                {item.totalDeliveries >= 50 && (
                                                    <div className="relative">
                                                        <FireSolidIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 drop-shadow-lg animate-pulse" />
                                                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-300 rounded-full animate-ping"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Enhanced Progress Bars for All Categories */}
                                        <div className="mt-3 sm:mt-4">
                                            <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 shadow-inner">
                                                <div
                                                    className={`h-2 sm:h-3 rounded-full transition-all duration-700 shadow-lg relative overflow-hidden ${getProgressBarColor(selectedCategory)}`}
                                                    style={{
                                                        width: `${Math.min(calculateProgressWidth(item, selectedCategory, currentData), 100)}%`
                                                    }}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {(!Array.isArray(currentData) || currentData.length === 0) && (
                            <div className="text-center py-12">
                                {isLoading ? (
                                    <div className="space-y-4">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                        <h3 className="text-xl font-semibold text-gray-500">Loading Leaderboard...</h3>
                                        <p className="text-gray-400">Fetching the latest performance data</p>
                                    </div>
                                ) : (
                                    <>
                                        <TrophyIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold text-gray-500 mb-2">No Data Available</h3>
                                        <p className="text-gray-400 mb-4">No leaderboard data found for the selected criteria.</p>
                                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                            <button
                                                onClick={() => setSelectedPeriod('allTime')}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                            >
                                                Try All Time
                                            </button>
                                            <button
                                                onClick={() => setSelectedCategory('overall')}
                                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                                            >
                                                Overall Champions
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Enhanced Share Modal */}
            {showShareModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    style={{
                        animation: 'fadeIn 0.3s ease-out'
                    }}
                >
                    <div
                        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
                        style={{
                            animation: 'scaleIn 0.3s ease-out'
                        }}
                    >
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShareIcon className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Share Leaderboard</h3>
                            <p className="text-gray-600">Share this amazing leaderboard with your team!</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <button
                                onClick={() => shareToSocialMedia('whatsapp')}
                                className="group relative flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                <div className="text-3xl group-hover:animate-bounce">📱</div>
                                <span className="font-semibold">WhatsApp</span>
                                <div className="text-xs opacity-80">Instant Share</div>
                            </button>

                            <button
                                onClick={() => shareToSocialMedia('telegram')}
                                className="group relative flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                <div className="text-3xl group-hover:animate-bounce">✈️</div>
                                <span className="font-semibold">Telegram</span>
                                <div className="text-xs opacity-80">Fast & Secure</div>
                            </button>

                            <button
                                onClick={() => shareToSocialMedia('twitter')}
                                className="group relative flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-xl hover:from-sky-600 hover:to-sky-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                <div className="text-3xl group-hover:animate-bounce">🐦</div>
                                <span className="font-semibold">Twitter</span>
                                <div className="text-xs opacity-80">Tweet It</div>
                            </button>

                            <button
                                onClick={() => shareToSocialMedia('facebook')}
                                className="group relative flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                <div className="text-3xl group-hover:animate-bounce">📘</div>
                                <span className="font-semibold">Facebook</span>
                                <div className="text-xs opacity-80">Post & Share</div>
                            </button>

                            <button
                                onClick={() => shareToSocialMedia('copy')}
                                className="group relative flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl col-span-2"
                            >
                                <ClipboardDocumentIcon className="w-8 h-8 group-hover:animate-pulse" />
                                <span className="font-semibold">Copy to Clipboard</span>
                                <div className="text-xs opacity-80">Paste Anywhere</div>
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowShareModal(false);
                                    exportAsImage();
                                }}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                            >
                                Export & Share
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaderboardPage;