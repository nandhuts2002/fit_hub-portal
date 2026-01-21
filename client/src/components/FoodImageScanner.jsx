import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Sparkles, Zap, Image as ImageIcon, Loader, Brain, Search } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

const FoodImageScanner = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [modelLoading, setModelLoading] = useState(true);
    const [model, setModel] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const fileInputRef = useRef(null);
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const imageRef = useRef(null);

    // Load TensorFlow MobileNet model on component mount
    useEffect(() => {
        const loadModel = async () => {
            try {
                console.log('Initializing TensorFlow.js backend...');
                setModelLoading(true);

                await tf.ready();
                console.log('✅ TensorFlow backend ready');

                await tf.setBackend('webgl');
                console.log('✅ Using WebGL backend');

                console.log('Loading MobileNet model...');
                const loadedModel = await mobilenet.load();
                setModel(loadedModel);
                setModelLoading(false);
                console.log('✅ MobileNet model loaded successfully!');
            } catch (err) {
                console.error('Error loading model:', err);
                setError('Failed to load AI model. Please refresh the page.');
                setModelLoading(false);
            }
        };
        loadModel();
    }, []);

    // Comprehensive food database with search
    const foodDatabase = {
        'apple': { calories: 95, serving_size: '1 medium (182g)' },
        'banana': { calories: 105, serving_size: '1 medium (118g)' },
        'orange': { calories: 62, serving_size: '1 medium (131g)' },
        'grapes': { calories: 104, serving_size: '1 cup (151g)' },
        'strawberry': { calories: 49, serving_size: '1 cup (152g)' },
        'watermelon': { calories: 46, serving_size: '1 cup (152g)' },
        'pineapple': { calories: 82, serving_size: '1 cup (165g)' },
        'mango': { calories: 99, serving_size: '1 cup (165g)' },
        'peach': { calories: 58, serving_size: '1 medium (150g)' },
        'pear': { calories: 101, serving_size: '1 medium (178g)' },
        'pizza': { calories: 266, serving_size: '1 slice (107g)' },
        'burger': { calories: 354, serving_size: '1 medium' },
        'hamburger': { calories: 354, serving_size: '1 medium' },
        'cheeseburger': { calories: 300, serving_size: '1 medium' },
        'sandwich': { calories: 250, serving_size: '1 sandwich' },
        'hot dog': { calories: 290, serving_size: '1 hot dog' },
        'salad': { calories: 150, serving_size: '1 bowl' },
        'rice': { calories: 130, serving_size: '100g cooked' },
        'fried rice': { calories: 163, serving_size: '100g' },
        'white rice': { calories: 130, serving_size: '100g cooked' },
        'brown rice': { calories: 111, serving_size: '100g cooked' },
        'bread': { calories: 79, serving_size: '1 slice (28g)' },
        'toast': { calories: 79, serving_size: '1 slice (28g)' },
        'chicken': { calories: 165, serving_size: '100g cooked' },
        'fried chicken': { calories: 246, serving_size: '100g' },
        'grilled chicken': { calories: 165, serving_size: '100g' },
        'chicken breast': { calories: 165, serving_size: '100g' },
        'broccoli': { calories: 55, serving_size: '1 cup (156g)' },
        'carrot': { calories: 41, serving_size: '1 medium (61g)' },
        'potato': { calories: 161, serving_size: '1 medium (173g)' },
        'french fries': { calories: 312, serving_size: '100g' },
        'mashed potato': { calories: 113, serving_size: '100g' },
        'baked potato': { calories: 161, serving_size: '1 medium' },
        'tomato': { calories: 22, serving_size: '1 medium (123g)' },
        'cucumber': { calories: 16, serving_size: '1 cup (104g)' },
        'egg': { calories: 78, serving_size: '1 large (50g)' },
        'boiled egg': { calories: 78, serving_size: '1 large' },
        'fried egg': { calories: 90, serving_size: '1 large' },
        'scrambled eggs': { calories: 102, serving_size: '1 large' },
        'fish': { calories: 206, serving_size: '100g cooked' },
        'salmon': { calories: 206, serving_size: '100g cooked' },
        'tuna': { calories: 132, serving_size: '100g cooked' },
        'pasta': { calories: 131, serving_size: '100g cooked' },
        'spaghetti': { calories: 131, serving_size: '100g cooked' },
        'noodles': { calories: 138, serving_size: '100g cooked' },
        'cheese': { calories: 113, serving_size: '28g' },
        'yogurt': { calories: 59, serving_size: '100g' },
        'milk': { calories: 42, serving_size: '100ml' },
        'coffee': { calories: 2, serving_size: '1 cup (240ml)' },
        'tea': { calories: 2, serving_size: '1 cup (240ml)' },
        'water': { calories: 0, serving_size: '1 cup (240ml)' },
        'steak': { calories: 271, serving_size: '100g cooked' },
        'beef': { calories: 250, serving_size: '100g cooked' },
        'pork': { calories: 242, serving_size: '100g cooked' },
        'bacon': { calories: 541, serving_size: '100g' },
        'sausage': { calories: 301, serving_size: '100g' },
        'ice cream': { calories: 207, serving_size: '100g' },
        'chocolate': { calories: 546, serving_size: '100g' },
        'cake': { calories: 257, serving_size: '1 slice (74g)' },
        'cookie': { calories: 49, serving_size: '1 cookie (10g)' },
        'donut': { calories: 195, serving_size: '1 donut (52g)' },
        'pancake': { calories: 86, serving_size: '1 medium (38g)' },
        'waffle': { calories: 103, serving_size: '1 waffle (33g)' },
        'biryani': { calories: 290, serving_size: '1 cup (200g)' },
        'curry': { calories: 180, serving_size: '1 cup (200g)' },
        'dal': { calories: 100, serving_size: '1 cup (200g)' },
        'roti': { calories: 71, serving_size: '1 roti (30g)' },
        'naan': { calories: 262, serving_size: '1 naan (90g)' },
        'dosa': { calories: 168, serving_size: '1 dosa (120g)' },
        'idli': { calories: 39, serving_size: '1 idli (30g)' },
        'samosa': { calories: 262, serving_size: '1 samosa (85g)' },
    };

    const getFoodCalories = (foodName) => {
        const normalized = foodName.toLowerCase().trim();

        if (foodDatabase[normalized]) {
            return { ...foodDatabase[normalized], found: true, name: foodName };
        }

        for (const [key, value] of Object.entries(foodDatabase)) {
            if (normalized.includes(key) || key.includes(normalized)) {
                return { ...value, found: true, name: key };
            }
        }

        return { calories: null, serving_size: 'Unknown', found: false, name: foodName };
    };

    const searchFood = (query) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }

        const q = query.toLowerCase();
        const matches = Object.keys(foodDatabase)
            .filter(food => food.includes(q))
            .slice(0, 10)
            .map(food => ({
                name: food,
                ...foodDatabase[food],
                found: true
            }));

        setSearchResults(matches);
    };

    const selectFood = (foodItem) => {
        setSearchQuery('');
        setSearchResults([]);
        setResults({
            ok: true,
            food_items: [{
                name: foodItem.name.charAt(0).toUpperCase() + foodItem.name.slice(1),
                confidence: 100,
                calories: foodItem.calories,
                serving_size: foodItem.serving_size,
                found_in_db: true,
                manual: true
            }],
            total_detected: 1,
            manual_selection: true
        });
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setCameraActive(true);
            }
        } catch (err) {
            setError('Could not access camera: ' + err.message);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);

            canvas.toBlob((blob) => {
                const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
                handleImageSelect(file, canvas.toDataURL('image/jpeg'));
            }, 'image/jpeg', 0.95);

            stopCamera();
        }
    };

    const handleImageSelect = (file, dataUrl = null) => {
        setSelectedImage(file);
        setResults(null);
        setError(null);
        setSearchQuery('');
        setSearchResults([]);

        if (dataUrl) {
            setPreviewUrl(dataUrl);
        } else {
            const reader = new FileReader();
            reader.onload = (e) => setPreviewUrl(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleFileInput = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageSelect(file);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            handleImageSelect(file);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const analyzeImage = async () => {
        if (!selectedImage || !model) {
            setError('Model not loaded or no image selected');
            return;
        }

        setAnalyzing(true);
        setError(null);

        try {
            const img = imageRef.current;

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = previewUrl;
            });

            console.log('Analyzing image with TensorFlow.js...');

            const predictions = await model.classify(img);

            console.log('Raw predictions:', predictions);

            // Get top 5 predictions and check against food database
            const foodItems = predictions.slice(0, 5).map(pred => {
                // Extract food-related keywords
                const keywords = pred.className.toLowerCase().split(/[,\s]+/);
                let bestMatch = null;
                let highestConfidence = 0;

                // Try to find best matching food in database
                for (const keyword of keywords) {
                    const result = getFoodCalories(keyword);
                    if (result.found && pred.probability > highestConfidence) {
                        bestMatch = result;
                        highestConfidence = pred.probability;
                    }
                }

                if (bestMatch) {
                    return {
                        name: bestMatch.name.charAt(0).toUpperCase() + bestMatch.name.slice(1),
                        confidence: Math.round(pred.probability * 100),
                        calories: bestMatch.calories,
                        serving_size: bestMatch.serving_size,
                        found_in_db: true,
                        ai_detected: true
                    };
                }

                return {
                    name: pred.className,
                    confidence: Math.round(pred.probability * 100),
                    calories: null,
                    serving_size: 'Unknown',
                    found_in_db: false,
                    ai_detected: true
                };
            }).filter(item => item.found_in_db); // Only show items found in database

            if (foodItems.length === 0) {
                // If no food found, suggest searching
                setError('No food detected in image. Use the search box to manually enter your food.');
                setAnalyzing(false);
                return;
            }

            setResults({
                ok: true,
                food_items: foodItems,
                total_detected: foodItems.length,
                tensorflow: true
            });

        } catch (err) {
            console.error('Error analyzing image:', err);
            setError('Failed to analyze image: ' + err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    const reset = () => {
        setSelectedImage(null);
        setPreviewUrl(null);
        setResults(null);
        setError(null);
        setSearchQuery('');
        setSearchResults([]);
        stopCamera();
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            padding: '2rem'
        }}>
            <img ref={imageRef} style={{ display: 'none' }} alt="" />

            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: 'center', marginBottom: '3rem' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <Brain style={{ color: '#fff', width: '48px', height: '48px' }} />
                        <h1 style={{
                            fontSize: '3.5rem',
                            fontWeight: '800',
                            background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            margin: 0
                        }}>
                            Smart Food Scanner
                        </h1>
                    </div>
                    <p style={{ color: '#fff', fontSize: '1.25rem', fontWeight: '500', opacity: 0.95 }}>
                        AI Suggestions + Manual Search = 100% Accuracy!
                    </p>
                    {modelLoading && (
                        <div style={{ color: '#fff', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Loader className="animate-spin" size={20} />
                            Loading AI model...
                        </div>
                    )}
                </motion.div>

                {/* Manual Search Box */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '2rem',
                        padding: '2rem',
                        marginBottom: '2rem',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
                        border: '2px solid rgba(255, 255, 255, 0.3)'
                    }}
                >
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'relative' }}>
                            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#667eea', width: '24px', height: '24px' }} />
                            <input
                                type="text"
                                placeholder="Search for food (e.g., apple, pizza, biryani)..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    searchFood(e.target.value);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '1.25rem 1.25rem 1.25rem 3.5rem',
                                    borderRadius: '1.25rem',
                                    border: '2px solid #e2e8f0',
                                    fontSize: '1.125rem',
                                    outline: 'none',
                                    transition: 'border-color 0.3s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>

                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    marginTop: '0.5rem',
                                    background: 'white',
                                    borderRadius: '1rem',
                                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                                    border: '2px solid #e2e8f0',
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                    zIndex: 1000
                                }}
                            >
                                {searchResults.map((item, index) => (
                                    <div
                                        key={index}
                                        onClick={() => selectFood(item)}
                                        style={{
                                            padding: '1rem 1.5rem',
                                            cursor: 'pointer',
                                            borderBottom: index < searchResults.length - 1 ? '1px solid #f1f5f9' : 'none',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.target.style.background = 'white'}
                                    >
                                        <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                                            {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                            {item.calories} kcal per {item.serving_size}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: previewUrl ? '1fr 1fr' : '1fr', gap: '2rem' }}>
                    {/* Upload Section - keeping original code */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '2rem',
                            padding: '2.5rem',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
                            border: '2px solid rgba(255, 255, 255, 0.3)'
                        }}
                    >
                        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1e293b' }}>
                            Select Food Image
                        </h2>

                        {!previewUrl && !cameraActive && (
                            <>
                                <div
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        border: `3px dashed ${dragActive ? '#667eea' : '#cbd5e1'}`,
                                        borderRadius: '1.5rem',
                                        padding: '3rem 2rem',
                                        textAlign: 'center',
                                        cursor: modelLoading ? 'not-allowed' : 'pointer',
                                        background: dragActive ? 'rgba(102, 126, 234, 0.05)' : 'rgba(248, 250, 252, 0.8)',
                                        transition: 'all 0.3s ease',
                                        marginBottom: '1.5rem',
                                        opacity: modelLoading ? 0.5 : 1
                                    }}
                                >
                                    <Upload style={{ width: '64px', height: '64px', margin: '0 auto 1rem', color: '#667eea' }} />
                                    <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                                        {modelLoading ? 'Loading AI model...' : 'Drop your food image here'}
                                    </p>
                                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                                        {modelLoading ? 'Please wait...' : 'or click to browse files'}
                                    </p>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileInput}
                                    disabled={modelLoading}
                                    style={{ display: 'none' }}
                                />

                                <button
                                    onClick={startCamera}
                                    disabled={modelLoading}
                                    style={{
                                        width: '100%',
                                        padding: '1.25rem',
                                        borderRadius: '1.25rem',
                                        background: modelLoading
                                            ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
                                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: '#fff',
                                        border: 'none',
                                        fontSize: '1.125rem',
                                        fontWeight: '600',
                                        cursor: modelLoading ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.75rem',
                                        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <Camera style={{ width: '24px', height: '24px' }} />
                                    Use Camera
                                </button>
                            </>
                        )}

                        {cameraActive && (
                            <div style={{ position: 'relative' }}>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    style={{
                                        width: '100%',
                                        borderRadius: '1.5rem',
                                        marginBottom: '1rem',
                                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={capturePhoto}
                                        style={{
                                            flex: 1,
                                            padding: '1rem',
                                            borderRadius: '1rem',
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            color: '#fff',
                                            border: 'none',
                                            fontSize: '1rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <Camera size={20} />
                                        Capture
                                    </button>
                                    <button
                                        onClick={stopCamera}
                                        style={{
                                            padding: '1rem 1.5rem',
                                            borderRadius: '1rem',
                                            background: '#ef4444',
                                            color: '#fff',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {previewUrl && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                                    <img
                                        src={previewUrl}
                                        alt="Selected food"
                                        style={{
                                            width: '100%',
                                            borderRadius: '1.5rem',
                                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                                            maxHeight: '400px',
                                            objectFit: 'cover'
                                        }}
                                    />
                                    <button
                                        onClick={reset}
                                        style={{
                                            position: 'absolute',
                                            top: '1rem',
                                            right: '1rem',
                                            background: 'rgba(239, 68, 68, 0.95)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '40px',
                                            height: '40px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                                        }}
                                    >
                                        <X style={{ color: '#fff', width: '20px', height: '20px' }} />
                                    </button>
                                </div>

                                <button
                                    onClick={analyzeImage}
                                    disabled={analyzing || !model}
                                    style={{
                                        width: '100%',
                                        padding: '1.25rem',
                                        borderRadius: '1.25rem',
                                        background: (analyzing || !model)
                                            ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
                                            : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                        color: '#fff',
                                        border: 'none',
                                        fontSize: '1.125rem',
                                        fontWeight: '600',
                                        cursor: (analyzing || !model) ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.75rem',
                                        boxShadow: '0 10px 30px rgba(245, 158, 11, 0.3)',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {analyzing ? (
                                        <>
                                            <Loader className="animate-spin" style={{ width: '24px', height: '24px' }} />
                                            Analyzing with AI...
                                        </>
                                    ) : (
                                        <>
                                            <Brain style={{ width: '24px', height: '24px' }} />
                                            Get AI Suggestions
                                        </>
                                    )}
                                </button>
                                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem', marginTop: '1rem' }}>
                                    💡 Not accurate? Use the search box above to manually select food!
                                </p>
                            </motion.div>
                        )}

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    marginTop: '1rem',
                                    padding: '1rem',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '2px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '1rem',
                                    color: '#dc2626',
                                    fontWeight: '500'
                                }}
                            >
                                {error}
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Results Section */}
                    <AnimatePresence>
                        {results && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.95)',
                                    backdropFilter: 'blur(20px)',
                                    borderRadius: '2rem',
                                    padding: '2.5rem',
                                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
                                    border: '2px solid rgba(255, 255, 255, 0.3)'
                                }}
                            >
                                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>
                                    🎯 {results.manual_selection ? 'Your Selection' : 'AI Suggestions'}
                                </h2>
                                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                                    {results.manual_selection ? '✅ 100% Accurate' : '🤖 TensorFlow.js Powered'}
                                </p>

                                {results.food_items && results.food_items.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {results.food_items.map((item, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                style={{
                                                    padding: '1.5rem',
                                                    background: item.manual
                                                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'
                                                        : 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(249, 115, 22, 0.05) 100%)',
                                                    borderRadius: '1.25rem',
                                                    border: `2px solid ${item.manual ? 'rgba(16, 185, 129, 0.3)' : 'rgba(102, 126, 234, 0.2)'}`,
                                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                                                        {item.name}
                                                    </h3>
                                                    <span style={{
                                                        padding: '0.5rem 1rem',
                                                        background: item.manual
                                                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                        color: '#fff',
                                                        borderRadius: '2rem',
                                                        fontSize: '0.875rem',
                                                        fontWeight: '600'
                                                    }}>
                                                        {item.manual ? '✓ Accurate' : `${item.confidence}% AI`}
                                                    </span>
                                                </div>

                                                {item.calories ? (
                                                    <div>
                                                        <div style={{
                                                            fontSize: '2.5rem',
                                                            fontWeight: '800',
                                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                            WebkitBackgroundClip: 'text',
                                                            WebkitTextFillColor: 'transparent',
                                                            marginBottom: '0.5rem'
                                                        }}>
                                                            {item.calories} kcal
                                                        </div>
                                                        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
                                                            per {item.serving_size}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p style={{ color: '#f59e0b', fontWeight: '500', fontSize: '0.875rem', margin: 0 }}>
                                                        ⚠️ Use search to find this item
                                                    </p>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                        <ImageIcon style={{ width: '64px', height: '64px', margin: '0 auto 1rem', opacity: 0.5 }} />
                                        <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>No results</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div >
    );
};

export default FoodImageScanner;
