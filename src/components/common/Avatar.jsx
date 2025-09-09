import React from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { isAdmin } from '../../utils/userHelpers';
import { isDriverVerified } from '../../utils/verificationHelpers';
import VerifiedBadge from './VerifiedBadge';

const Avatar = ({ user, profile, size = 'md', className = '', showVerifiedBadge = false }) => {
    const sizeClasses = {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-16 w-16',
        xl: 'h-24 w-24',
        '2xl': 'h-32 w-32'
    };

    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-lg',
        xl: 'text-2xl',
        '2xl': 'text-3xl'
    };

    // Get user initials
    const getInitials = (name) => {
        if (!name) return '?';
        // First capitalize the name, then get initials
        const capitalizedName = name.split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');

        return capitalizedName
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Get the best available name for initials
    const userName = user?.name ||
        user?.profile?.personalDetails?.fullName ||
        profile?.profile?.personalDetails?.fullName ||
        user?.email;

    const initials = getInitials(userName);

    // Check if user is admin - always show White.png logo for admin users
    const isAdminUser = isAdmin(user);

    // Check for profile image in various possible locations
    let profileImage = user?.avatar ||
        user?.profileImage ||
        user?.profilePicture ||
        user?.profile?.profileImage ||
        user?.profile?.profilePicture ||
        user?.profile?.personalDetails?.profileImage ||
        user?.profile?.personalDetails?.profilePicture ||
        profile?.profileImage ||
        profile?.profilePicture ||
        profile?.profile?.profileImage ||
        profile?.profile?.profilePicture ||
        profile?.profile?.personalDetails?.profileImage ||
        profile?.profile?.personalDetails?.profilePicture;

    // Add cache-busting parameter to prevent browser caching
    if (profileImage && !profileImage.startsWith('data:')) {
        profileImage = `${profileImage}?t=${Date.now()}`;
    }

    // For admin users, always show the White.png logo
    if (isAdminUser) {
        return (
            <div className={`${sizeClasses[size]} rounded-full overflow-hidden relative ${className}`}>
                <img
                    src="/icons/White.png"
                    alt="Admin Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        // Fallback to admin initials if logo fails to load
                        e.target.style.display = 'none';
                        e.target.parentElement.nextSibling.style.display = 'flex';
                    }}
                />
                {/* Hidden fallback div that shows when logo fails to load */}
                <div
                    className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white font-semibold ${textSizeClasses[size]} absolute inset-0`}
                    style={{ display: 'none' }}
                >
                    {initials !== '?' ? (
                        <span className={`avatar-name ${size}`}>{initials}</span>
                    ) : (
                        <UserCircleIcon className={`${sizeClasses[size]} text-gray-300`} />
                    )}
                </div>
                {/* Verified badge overlay */}
                {showVerifiedBadge && isDriverVerified(user || profile) && (
                    <div className="absolute -bottom-0.5 -right-0.5 z-10">
                        <VerifiedBadge isVerified={true} size="xs" iconOnly={true} />
                    </div>
                )}
            </div>
        );
    }

    // For non-admin users, show their profile image if available
    if (profileImage) {
        return (
            <div className={`${sizeClasses[size]} rounded-full overflow-hidden relative ${className}`}>
                <img
                    src={profileImage}
                    alt={userName || 'User avatar'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        // Fallback to initials if image fails to load
                        e.target.style.display = 'none';
                        e.target.parentElement.nextSibling.style.display = 'flex';
                    }}
                />
                {/* Hidden fallback div that shows when image fails to load */}
                <div
                    className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white font-semibold ${textSizeClasses[size]} absolute inset-0`}
                    style={{ display: 'none' }}
                >
                    {initials !== '?' ? (
                        <span className={`avatar-name ${size}`}>{initials}</span>
                    ) : (
                        <UserCircleIcon className={`${sizeClasses[size]} text-gray-300`} />
                    )}
                </div>
                {/* Verified badge overlay */}
                {showVerifiedBadge && isDriverVerified(user || profile) && (
                    <div className="absolute -bottom-0.5 -right-0.5 z-10">
                        <VerifiedBadge isVerified={true} size="xs" iconOnly={true} />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white font-semibold ${textSizeClasses[size]} relative ${className}`}>
            {initials !== '?' ? (
                <span className={`avatar-name ${size}`}>{initials}</span>
            ) : (
                <UserCircleIcon className={`${sizeClasses[size]} text-gray-300`} />
            )}
            {/* Verified badge overlay */}
            {showVerifiedBadge && isDriverVerified(user || profile) && (
                <div className="absolute -bottom-0.5 -right-0.5 z-10">
                    <VerifiedBadge isVerified={true} size="xs" iconOnly={true} />
                </div>
            )}
        </div>
    );
};

export default Avatar;
