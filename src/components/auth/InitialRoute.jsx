import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoginPage from '../../pages/LoginPage';
import Lottie from 'lottie-react';
import loadingAnimation from '../../assets/loading-animation.json';

const InitialRoute = () => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const [redirectTimeout, setRedirectTimeout] = useState(false);

    // Set a timeout to prevent infinite redirect screen
    useEffect(() => {
        if (isAuthenticated && user) {
            const timeout = setTimeout(() => {
                console.warn('⚠️ Redirect timeout - navigation may have failed');
                setRedirectTimeout(true);
            }, 5000); // 5 second timeout

            return () => clearTimeout(timeout);
        }
    }, [isAuthenticated, user]);

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-4">
                        <Lottie
                            animationData={loadingAnimation}
                            loop={true}
                            autoplay={true}
                        />
                    </div>
                    <p className="text-white text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    // If authenticated, show a brief loading state before redirect
    // The AuthContext will handle the actual navigation
    if (isAuthenticated && user) {
        // If redirect has timed out, show error message
        if (redirectTimeout) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-32 h-32 mx-auto mb-4">
                            <Lottie
                                animationData={loadingAnimation}
                                loop={true}
                                autoplay={true}
                            />
                        </div>
                        <p className="text-white text-lg mb-4">Navigation taking longer than expected...</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-all"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-4">
                        <Lottie
                            animationData={loadingAnimation}
                            loop={true}
                            autoplay={true}
                        />
                    </div>
                    <p className="text-white text-lg">Redirecting to dashboard...</p>
                </div>
            </div>
        );
    }

    // Show login page if not authenticated
    return <LoginPage />;
};

export default InitialRoute;
