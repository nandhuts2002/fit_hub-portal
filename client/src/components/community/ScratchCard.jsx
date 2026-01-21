import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Sparkles, ShoppingBag } from 'lucide-react';
import Confetti from 'react-confetti';
import useWindowSize from 'react-use/lib/useWindowSize';

const ScratchCard = ({ reward, onClose, title = "🎉 Challenge Completed!", context = "challenge" }) => {
    const [isScratching, setIsScratching] = useState(false);
    const [scratchPercentage, setScratchPercentage] = useState(0);
    const [copiedCode, setCopiedCode] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);

    // Milestone tier colors
    const tierColors = {
        bronze: { from: 'from-orange-500', to: 'to-amber-600', glow: 'rgba(255, 165, 0, 0.6)' },
        silver: { from: 'from-gray-400', to: 'to-gray-600', glow: 'rgba(192, 192, 192, 0.6)' },
        gold: { from: 'from-yellow-400', to: 'to-yellow-600', glow: 'rgba(255, 215, 0, 0.8)' },
        diamond: { from: 'from-cyan-400', to: 'to-purple-500', glow: 'rgba(0, 255, 255, 0.8)' }
    };

    // Get milestone tier for visual theming
    const milestoneTier = reward?.milestone_tier || 'bronze';
    const currentTier = tierColors[milestoneTier] || tierColors.bronze;
    const isMilestone = reward?.is_milestone || false;

    const [canvasRef, setCanvasRef] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const { width, height } = useWindowSize();


    useEffect(() => {
        if (canvasRef && !isRevealed) {
            const canvas = canvasRef;
            const ctx = canvas.getContext('2d');

            // Set canvas size to match container
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width || 600;
            canvas.height = 380;

            // Draw scratch-off surface with shimmer effect
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(0.3, '#FFC125');
            gradient.addColorStop(0.5, '#FFD700');
            gradient.addColorStop(0.7, '#FFA500');
            gradient.addColorStop(1, '#FFD700');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Add metallic pattern
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 3;
            for (let i = 0; i < canvas.width; i += 20) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i + 40, canvas.height);
                ctx.stroke();
            }

            // Add "Scratch to Reveal" text with glow
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = 10;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('✨ Scratch to Reveal ✨', canvas.width / 2, canvas.height / 2);

            // Set composite operation for scratching
            ctx.globalCompositeOperation = 'destination-out';
        }
    }, [canvasRef, isRevealed]);

    useEffect(() => {
        if (isRevealed && reward.won) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
        }
    }, [isRevealed, reward.won]);

    const handleScratch = (e) => {
        if (!canvasRef || isRevealed) return;

        const canvas = canvasRef;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        let x, y;
        if (e.type.includes('mouse')) {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        } else {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        }

        // Draw scratch effect with larger brush
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, 2 * Math.PI);
        ctx.fill();

        // Calculate scratched percentage
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let transparent = 0;
        for (let i = 3; i < imageData.data.length; i += 4) {
            if (imageData.data[i] === 0) transparent++;
        }
        const percentage = (transparent / (imageData.data.length / 4)) * 100;
        setScratchPercentage(percentage);

        // Auto-reveal after 40% scratched
        if (percentage > 40 && !isRevealed) {
            setIsRevealed(true);
        }
    };

    const handleMouseDown = () => setIsScratching(true);
    const handleMouseUp = () => setIsScratching(false);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('✅ Coupon code copied to clipboard!');
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                {/* Confetti for winning */}
                {showConfetti && reward?.won && (
                    <Confetti
                        width={width}
                        height={height}
                        recycle={true}
                        numberOfPieces={milestoneTier === 'diamond' ? 500 : milestoneTier === 'gold' ? 300 : 200}
                        colors={milestoneTier === 'diamond'
                            ? ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff0000']
                            : milestoneTier === 'gold'
                                ? ['#FFD700', '#FFA500', '#FFFF00']
                                : milestoneTier === 'silver'
                                    ? ['#C0C0C0', '#D3D3D3', '#FFFFFF']
                                    : ['#FF8C00', '#FFA500', '#FFD700']
                        }
                    />
                )}

                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 50 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className={`bg-gradient-to-br ${currentTier.from} ${currentTier.to} rounded-2xl shadow-2xl max-w-md w-full p-1 relative`}
                    style={{
                        boxShadow: `0 0 40px ${currentTier.glow}, 0 0 80px ${currentTier.glow}`
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-gray-900 rounded-2xl p-4 relative overflow-hidden">
                        {/* Animated background sparkles */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {[...Array(30)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute text-yellow-300 opacity-50"
                                    initial={{
                                        x: Math.random() * 600,
                                        y: Math.random() * 500,
                                        scale: 0
                                    }}
                                    animate={{
                                        y: [null, Math.random() * -150 - 50],
                                        scale: [0, 1, 0.5, 0],
                                        opacity: [0, 1, 0.8, 0]
                                    }}
                                    transition={{
                                        duration: 3 + Math.random() * 2,
                                        repeat: Infinity,
                                        delay: Math.random() * 3
                                    }}
                                >
                                    <Sparkles size={12 + Math.random() * 20} />
                                </motion.div>
                            ))}
                        </div>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 text-white hover:bg-white hover:bg-opacity-10 rounded-full p-2 transition-all z-20 backdrop-blur-sm"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Header */}
                        <motion.div
                            initial={{ y: -30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-center mb-8 relative z-10"
                        >
                            <motion.div
                                animate={{
                                    rotate: [0, -10, 10, -10, 0],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatDelay: 1
                                }}
                                className="mb-4 inline-block"
                            >
                                <Gift className="w-12 h-12 text-yellow-400 drop-shadow-lg" />
                            </motion.div>
                            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 mb-1">
                                {title}
                            </h2>
                            <p className="text-gray-300 text-sm">
                                Scratch the card below to reveal your reward!
                            </p>
                        </motion.div>

                        {/* Scratch Card */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="relative bg-gradient-to-br from-white to-gray-100 rounded-xl mb-4 shadow-2xl overflow-hidden border-3 border-yellow-400"
                            style={{ minHeight: '240px' }}
                        >
                            {/* Content that is always visible (underneath canvas) */}
                            <div className="p-6">
                                <div className="text-center">
                                    {reward.won ? (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: isRevealed ? 1 : 0 }}
                                            transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                                        >
                                            <motion.div
                                                animate={isRevealed ? {
                                                    scale: [1, 1.2, 1],
                                                    rotate: [0, 5, -5, 0]
                                                } : {}}
                                                transition={{ duration: 0.6 }}
                                                className="text-5xl mb-3"
                                            >
                                                🎁
                                            </motion.div>
                                            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600 mb-3">
                                                YOU WON!
                                            </h3>
                                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 mb-3 shadow-lg border-2 border-green-300">
                                                <p className="text-gray-700 mb-2 font-bold text-sm">🎫 Your Coupon Code:</p>
                                                <div className="bg-white border-3 border-dashed border-green-500 rounded-lg p-3 mb-3 shadow-inner">
                                                    <code className="text-2xl font-black text-green-700 tracking-widest block animate-pulse">
                                                        {reward.code}
                                                    </code>
                                                </div>
                                                <button
                                                    onClick={() => copyToClipboard(reward.code)}
                                                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 font-bold text-sm transition-all transform hover:scale-105 shadow-lg"
                                                >
                                                    📋 Copy Coupon Code
                                                </button>
                                            </div>
                                            <div className="text-sm text-gray-800 space-y-1 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border-2 border-yellow-300">
                                                <p className="font-bold text-base">💰 {reward.discount} OFF (Maximum ₹{reward.max_discount})</p>
                                                <p className="font-semibold text-xs">📅 Valid for 30 days from today</p>
                                                <p className="font-semibold text-xs">🛒 Minimum purchase: ₹{reward.min_purchase}</p>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: isRevealed ? 1 : 0 }}
                                            transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                                        >
                                            <div className="text-8xl mb-6">😊</div>
                                            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 mb-3">
                                                Better Luck Next Time!
                                            </h3>
                                            <p className="text-gray-700 mb-4 text-base font-semibold">
                                                {context === 'purchase'
                                                    ? 'Make another purchase for another chance to win!'
                                                    : 'Complete another challenge for another chance to win!'}
                                            </p>
                                            <div className="flex justify-center gap-4 mb-4">
                                                {[...Array(5)].map((_, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ scale: 0, rotate: 0 }}
                                                        animate={isRevealed ? {
                                                            scale: [0, 1.2, 1],
                                                            rotate: [0, 360]
                                                        } : {}}
                                                        transition={{ delay: i * 0.1, duration: 0.5 }}
                                                        className="text-5xl"
                                                    >
                                                        🍀
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Canvas overlay for scratching */}
                            {!isRevealed && (
                                <canvas
                                    ref={(el) => {
                                        setCanvasRef(el);
                                        if (el) el.height = 240;
                                    }}
                                    className="absolute top-0 left-0 w-full cursor-pointer hover:cursor-grab active:cursor-grabbing"
                                    style={{ touchAction: 'none', zIndex: 10, height: '240px' }}
                                    onMouseDown={handleMouseDown}
                                    onMouseUp={handleMouseUp}
                                    onMouseMove={isScratching ? handleScratch : undefined}
                                    onTouchStart={handleMouseDown}
                                    onTouchEnd={handleMouseUp}
                                    onTouchMove={handleScratch}
                                />
                            )}
                        </motion.div>

                        {/* Action buttons */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="flex gap-4"
                        >
                            {reward.won && isRevealed && (
                                <a
                                    href="/shop"
                                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2 text-base shadow-lg transform hover:scale-105"
                                >
                                    <ShoppingBag className="w-6 h-6" />
                                    Shop Now & Use Coupon
                                </a>
                            )}
                            <button
                                onClick={onClose}
                                className="flex-1 bg-gradient-to-r from-gray-700 to-gray-800 text-white font-bold py-3 px-6 rounded-lg hover:from-gray-800 hover:to-gray-900 transition-all shadow-lg"
                            >
                                Close
                            </button>
                        </motion.div>

                        {/* Scratch progress indicator */}
                        {!isRevealed && scratchPercentage > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 text-center"
                            >
                                <div className="bg-gray-800 rounded-full h-3 w-full max-w-xs mx-auto overflow-hidden">
                                    <motion.div
                                        className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${scratchPercentage}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                                <p className="text-gray-400 text-sm mt-2 font-semibold">
                                    {Math.round(scratchPercentage)}% Revealed
                                </p>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence >
    );
};

export default ScratchCard;
