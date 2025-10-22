import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
// Try to import react-360-product-viewer; if not installed, we'll fallback automatically
let React360Viewer = null;
try {
  // eslint-disable-next-line global-require
  React360Viewer = require('react-360-product-viewer').default;
} catch (e) {
  React360Viewer = null;
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [product, setProduct] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://fit-hub-portal-1.onrender.com';
        const res = await fetch(`${API_BASE}/shop/api/products/${id}`);
        const data = await res.json();
        if (mounted) {
          if (data.success) setProduct(data.product);
          else setError(data.error || 'Failed to load product');
        }
      } catch (e) {
        if (mounted) setError('Failed to load product');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const images = product?.images || [];
  const uniqueCount = useMemo(() => {
    try { return new Set(images || []).size; } catch { return (images || []).length; }
  }, [images]);

  // Determine if we can use react-360-product-viewer path pattern
  // Expect images like /uploads/products/<id>/image_1.jpg, image_2.jpg, ... same extension
  const viewerPattern = useMemo(() => {
    if (!images || images.length < 2) return null;
    const parts = images.map((url) => {
      const m = url.match(/^(.*\/)(image_)\d+(\.[a-zA-Z0-9]+)$/);
      return m ? { path: m[1], prefix: m[2], ext: m[3] } : null;
    });
    if (parts.some((p) => !p)) return null;
    const { path, prefix, ext } = parts[0];
    if (!parts.every((p) => p.path === path && p.prefix === prefix && p.ext === ext)) return null;
    // Derive amount from count
    return { imagePath: path, fileName: `image_{index}${ext}`, amount: images.length };
  }, [images]);

  // Simple fallback viewer using images array and drag
  const Fallback360 = () => {
    const [idx, setIdx] = useState(0);
    const startX = useRef(0);
    const lastX = useRef(0);
    const dragging = useRef(false);
    const accum = useRef(0);
    const total = images.length;

    const onDown = (e) => {
      dragging.current = true;
      startX.current = (e.touches ? e.touches[0].clientX : e.clientX);
      lastX.current = startX.current;
      accum.current = 0;
    };
    const onMove = (e) => {
      if (!dragging.current) return;
      const x = (e.touches ? e.touches[0].clientX : e.clientX);
      const dx = x - lastX.current;
      lastX.current = x;
      // Slower rotation: require ~10px per frame
      const dragPerFrame = 10; // px per frame
      accum.current += dx;
      while (Math.abs(accum.current) >= dragPerFrame) {
        const step = accum.current > 0 ? -1 : 1; // drag right -> rotate right
        setIdx((prev) => (prev + step + total) % total);
        accum.current += step > 0 ? -dragPerFrame : dragPerFrame;
      }
    };
    const onUp = () => { dragging.current = false; };
    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY || e.wheelDelta || 0;
      // One frame per 80 wheel delta
      const step = Math.sign(delta) * Math.max(1, Math.floor(Math.abs(delta) / 80));
      if (step !== 0) setIdx((prev) => (prev + step + total) % total);
    };

    if (total === 0) return null;
    if (total === 1) return (
      <img src={images[0]} alt={product?.name} className="w-full h-auto object-contain" />
    );
    return (
      <div
        className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden"
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={onDown}
        onTouchMove={onMove}
        onTouchEnd={onUp}
        onWheel={onWheel}
        style={{ touchAction: 'none' }}
      >
        <div className="relative">
          <img src={images[idx]} alt={`${product?.name} ${idx+1}`} className="w-full h-auto select-none pointer-events-none" />
          <div className="absolute top-2 right-2 text-[10px] px-2 py-1 bg-black/60 text-white rounded-full">{idx + 1}/{total}</div>
        </div>
        <div className="p-2 text-center text-xs text-gray-500">Drag left/right or scroll to rotate</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <button className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-5 h-5" /> Back
        </button>

        {loading && <div className="p-8 text-center text-gray-600">Loading product...</div>}
        {error && !loading && <div className="p-8 text-center text-red-600">{error}</div>}
        {product && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              {React360Viewer && images.length > 1 ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {viewerPattern ? (
                    <React360Viewer
                      amount={viewerPattern.amount}
                      imagePath={viewerPattern.imagePath}
                      fileName={viewerPattern.fileName}
                      autoplay={false}
                      speed={120}
                      loop
                      reverse
                    />
                  ) : (
                    // Many builds of react-360-product-viewer support an images array as an alternative
                    <React360Viewer
                      amount={images.length}
                      images={images}
                      autoplay={false}
                      speed={120}
                      loop
                      reverse
                    />
                  )}
                  <div className="p-2 text-center text-xs text-gray-500">Drag left/right to rotate</div>
                </div>
              ) : (
                <Fallback360 />
              )}
              {(images?.length || 0) < 2 && (
                <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                  Add at least 2 images to enable rotation. Upload 12–24 for smoother 360°.
                </div>
              )}
              {images?.length >= 2 && uniqueCount < 2 && (
                <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                  The frames appear identical (same image URL). Upload different angles to see visible rotation.
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="text-gray-600 mb-4">{product.brand} • {product.category}</div>
              <div className="text-3xl font-bold text-gray-900 mb-4">₹{Number(product.price || 0).toLocaleString()}</div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
