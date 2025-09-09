import React, { useEffect, useState } from 'react';

const LoadingScreen = ({ message = "Loading..." }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [animationComplete, setAnimationComplete] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Trigger entrance animation with a slight delay for better effect
        const entranceTimer = setTimeout(() => {
            setIsVisible(true);
        }, 150);

        // Simulate progress for better user experience
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev;
                return prev + Math.random() * 15;
            });
        }, 800);

        // Set animation complete after a delay
        const completeTimer = setTimeout(() => {
            setAnimationComplete(true);
            setProgress(100);
        }, 3000);

        return () => {
            clearTimeout(entranceTimer);
            clearTimeout(completeTimer);
            clearInterval(progressInterval);
        };
    }, []);

    return (
        <div className={`
            fixed inset-0 z-50 flex items-center justify-center
            bg-gradient-to-br from-green-50 via-white to-green-100
            transition-all duration-1500 ease-out
            ${isVisible ? 'opacity-100' : 'opacity-0'}
        `}>
            {/* Enhanced animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Floating circles with better positioning and timing */}
                <div className={`
                    absolute top-1/4 left-1/4 w-40 h-40 bg-gradient-to-br from-green-200 to-green-300 rounded-full
                    opacity-15 blur-sm animate-pulse transition-all duration-3000 ease-in-out
                    ${isVisible ? 'scale-100 rotate-12' : 'scale-0 rotate-0'}
                `} style={{ animationDelay: '0s' }}></div>

                <div className={`
                    absolute top-2/3 right-1/3 w-32 h-32 bg-gradient-to-br from-green-300 to-green-400 rounded-full
                    opacity-20 blur-sm animate-pulse transition-all duration-3000 ease-in-out
                    ${isVisible ? 'scale-100 -rotate-12' : 'scale-0 rotate-0'}
                `} style={{ animationDelay: '0.8s' }}></div>

                <div className={`
                    absolute bottom-1/3 left-1/2 w-28 h-28 bg-gradient-to-br from-green-400 to-green-500 rounded-full
                    opacity-25 blur-sm animate-pulse transition-all duration-3000 ease-in-out
                    ${isVisible ? 'scale-100 rotate-6' : 'scale-0 rotate-0'}
                `} style={{ animationDelay: '1.6s' }}></div>

                {/* Subtle particle effects */}
                <div className={`
                    absolute top-1/2 left-1/2 w-2 h-2 bg-green-400 rounded-full
                    opacity-40 animate-ping transition-all duration-2000 ease-in-out
                    ${isVisible ? 'scale-100' : 'scale-0'}
                `} style={{ animationDelay: '0.4s' }}></div>

                <div className={`
                    absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-green-500 rounded-full
                    opacity-30 animate-ping transition-all duration-2000 ease-in-out
                    ${isVisible ? 'scale-100' : 'scale-0'}
                `} style={{ animationDelay: '1.2s' }}></div>
            </div>

            {/* Main content with enhanced animations */}
            <div className={`
                relative z-10 text-center transition-all duration-1200 ease-out
                ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95'}
            `}>
                {/* Enhanced Logo with better shadow and glow */}
                <div className={`
                    mb-10 transition-all duration-1200 ease-out loading-scale-in
                    ${isVisible ? 'scale-100 rotate-0' : 'scale-75 rotate-12'}
                `} style={{ animationDelay: '0.2s' }}>
                    <div className="relative">
                        <div className="absolute inset-0 bg-green-400 rounded-xl blur-lg opacity-30 animate-pulse loading-glow"></div>
                        <img
                            src="/icons/White.png"
                            alt="Logo"
                            className="relative w-24 h-24 mx-auto rounded-xl shadow-2xl loading-float"
                            style={{
                                filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1))',
                                animation: 'float 4s ease-in-out infinite'
                            }}
                        />
                    </div>
                </div>

                {/* CSS-based Loading Spinner */}
                <div className={`
                    mb-8 transition-all duration-1200 ease-out
                    ${isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}
                `} style={{ animationDelay: '0.5s' }}>
                    <div className="w-36 h-36 mx-auto relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-green-200 rounded-full blur-sm opacity-50"></div>
                        <div className="relative flex items-center justify-center">
                            <div className="w-24 h-24 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Loading text with better typography */}
                <div className={`
                    transition-all duration-1200 ease-out loading-fade-in
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                `} style={{ animationDelay: '0.8s' }}>
                    <h2 className="text-3xl font-bold text-gray-800 mb-3 bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                        Welcome Back!
                    </h2>
                    <p className="text-gray-600 text-lg font-medium">
                        {message}
                    </p>
                </div>

                {/* Enhanced Progress dots with better spacing and colors */}
                <div className={`
                    flex justify-center space-x-3 mt-8 transition-all duration-1200 ease-out
                    ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
                `} style={{ animationDelay: '1.1s' }}>
                    {[0, 1, 2].map((index) => (
                        <div
                            key={index}
                            className={`
                                w-4 h-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full 
                                animate-pulse transition-all duration-500 ease-in-out
                                shadow-lg
                            `}
                            style={{
                                animationDelay: `${index * 0.3}s`,
                                animationDuration: '1.6s'
                            }}
                        ></div>
                    ))}
                </div>

                {/* Enhanced loading bar with gradient and better animation */}
                <div className={`
                    mt-8 w-56 h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner
                    transition-all duration-1200 ease-out
                    ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
                `} style={{ animationDelay: '1.4s' }}>
                    <div
                        className="
                            h-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-full
                            transition-all duration-1000 ease-out shadow-sm
                        "
                        style={{
                            width: `${Math.min(progress, 100)}%`,
                            transition: 'width 0.8s ease-out'
                        }}
                    ></div>
                </div>

                {/* Progress percentage */}
                <div className={`
                    mt-3 text-sm text-gray-500 font-medium transition-all duration-1000 ease-out
                    ${isVisible ? 'opacity-100' : 'opacity-0'}
                `} style={{ animationDelay: '1.6s' }}>
                    {Math.round(progress)}% Complete
                </div>
            </div>

            {/* Enhanced success indicator */}
            {animationComplete && (
                <div className={`
                    absolute bottom-10 left-1/2 transform -translate-x-1/2
                    flex items-center space-x-3 text-green-600 font-semibold
                    transition-all duration-700 ease-out
                    ${animationComplete ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}
                `}>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                    <span className="text-lg">Almost ready...</span>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '0.3s' }}></div>
                </div>
            )}
        </div>
    );
};

export default LoadingScreen;
