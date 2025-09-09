import React, { useState, useEffect } from 'react';
import { GiftIcon, SparklesIcon } from '@heroicons/react/24/solid';

const PointsNotification = ({
    points,
    reason,
    isVisible,
    onClose,
    duration = 5000
}) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [bubbles, setBubbles] = useState([]);

    useEffect(() => {
        if (isVisible) {
            setIsAnimating(true);

            // Create floating bubbles
            const bubbleCount = Math.min(points, 10); // Max 10 bubbles
            const newBubbles = Array.from({ length: bubbleCount }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: Math.random() * 20 + 10,
                delay: Math.random() * 1000,
                duration: Math.random() * 2000 + 2000
            }));
            setBubbles(newBubbles);

            // Auto close after duration
            const timer = setTimeout(() => {
                setIsAnimating(false);
                setTimeout(onClose, 500); // Wait for animation to complete
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isVisible, points, duration, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            {/* Background overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-20" />

            {/* Main notification */}
            <div className={`
                relative bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 
                rounded-3xl shadow-2xl p-8 max-w-sm mx-4 transform transition-all duration-500
                ${isAnimating ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
            `}>
                {/* Sparkle effects */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-pulse">
                    <SparklesIcon className="w-4 h-4 text-white m-1" />
                </div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-yellow-300 rounded-full animate-pulse">
                    <SparklesIcon className="w-3 h-3 text-white m-0.5" />
                </div>

                {/* Content */}
                <div className="text-center text-white">
                    <div className="mb-4">
                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
                            <GiftIcon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Points Earned!</h3>
                        <div className="text-4xl font-black mb-2 animate-pulse">
                            +{points}
                        </div>
                        <p className="text-green-100 text-sm">
                            {reason || 'Great job!'}
                        </p>
                    </div>

                    {/* Progress bar animation */}
                    <div className="w-full bg-white bg-opacity-20 rounded-full h-2 mb-4">
                        <div className="bg-white h-2 rounded-full animate-pulse" style={{ width: '100%' }} />
                    </div>
                </div>

                {/* Floating bubbles */}
                {bubbles.map((bubble) => (
                    <div
                        key={bubble.id}
                        className="absolute w-2 h-2 bg-white bg-opacity-60 rounded-full animate-ping"
                        style={{
                            left: `${bubble.x}%`,
                            top: `${bubble.y}%`,
                            animationDelay: `${bubble.delay}ms`,
                            animationDuration: `${bubble.duration}ms`
                        }}
                    />
                ))}
            </div>

            {/* Confetti effect */}
            <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 20 }, (_, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2000}ms`,
                            animationDuration: `${Math.random() * 2000 + 1000}ms`
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default PointsNotification;
