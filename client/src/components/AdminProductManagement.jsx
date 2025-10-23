import React, { useState, useEffect } from "react";
import api from "../utils/api";
import SessionManager from "../utils/sessionManager";
import { motion } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  Package,
  Tag,
  DollarSign,
  Star,
  AlertTriangle
} from "lucide-react";

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://fit-hub-portal-1.onrender.com';

const AdminProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    brand: '',
    inStock: true,
    stockQuantity: '',
    images: [''],
    variants: [{ type: '', value: '', price: '', stock: '' }],
    features: [''],
    tags: ['']
  });
  const [selectedFiles, setSelectedFiles] = useState([]); // File[] for multipart
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkedAdmin, setCheckedAdmin] = useState(false);

  // Live validation state
  const [touched, setTouched] = useState({});
  const [formErrors, setFormErrors] = useState({});

  // Check if user is admin
  useEffect(() => {
    const currentUser = SessionManager.getCurrentUser();
    if (currentUser && currentUser.role === 'admin') {
      setIsAdmin(true);
    }
    setCheckedAdmin(true);
  }, []);

  // Field-level validator
  const fieldError = (name, value) => {
    switch (name) {
      case 'name':
        if (!value || value.trim().length === 0) return 'Product name is required';
        if (value.trim().length < 3) return 'Name must be at least 3 characters';
        return '';
      case 'price':
        if (value === '' || value === null || isNaN(Number(value))) return 'Price is required';
        if (Number(value) <= 0) return 'Price must be greater than 0';
        return '';
      case 'stockQuantity':
        if (value === '' || value === null || isNaN(Number(value))) return 'Stock quantity is required';
        if (!Number.isInteger(Number(value))) return 'Stock must be an integer';
        if (Number(value) < 0) return 'Stock cannot be negative';
        return '';
      case 'originalPrice':
        if (value === '' || value === null) return '';
        if (isNaN(Number(value))) return 'Original price must be a number';
        if (formData.price && !isNaN(Number(formData.price)) && Number(value) < Number(formData.price)) {
          return 'Original price should be greater than or equal to price';
        }
        return '';
      default:
        return '';
    }
  };

  // Seed a demo product with multiple image URLs (uses fallback 360 viewer)
  const createDemoProduct = async () => {
    if (!isAdmin) {
      alert('You must be an administrator to perform this action.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if user is admin before proceeding
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser || !currentUser.token) {
        alert('You must be logged in to perform this action.');
        return;
      }
      
      const demoImages = [
        // Public sample images (same image repeated for demo; replace with different shots for realism)
        'https://m.media-amazon.com/images/I/81w0A8gJwsL._SX522_.jpg',
        'https://m.media-amazon.com/images/I/81w0A8gJwsL._SX522_.jpg',
        'https://m.media-amazon.com/images/I/81w0A8gJwsL._SX522_.jpg',
        'https://m.media-amazon.com/images/I/81w0A8gJwsL._SX522_.jpg',
        'https://m.media-amazon.com/images/I/81w0A8gJwsL._SX522_.jpg',
        'https://m.media-amazon.com/images/I/81w0A8gJwsL._SX522_.jpg',
        'https://m.media-amazon.com/images/I/81w0A8gJwsL._SX522_.jpg',
        'https://m.media-amazon.com/images/I/81w0A8gJwsL._SX522_.jpg',
        'https://m.media-amazon.com/images/I/81w0A8gJwsL._SX522_.jpg',
        'https://m.media-amazon.com/images/I/81w0A8gJwsL._SX522_.jpg',
        'https://m.media-amazon.com/images/I/81w0A8gJwsL._SX522_.jpg',
        'https://m.media-amazon.com/images/I/81w0A8gJwsL._SX522_.jpg'
      ];
      const productData = {
        name: 'Demo 360 Dumbbell',
        description: 'Demo product to showcase 360° viewer. Replace images with real 24–36 shots for smooth rotation.',
        price: 1999,
        originalPrice: 2499,
        category: 'Weights',
        brand: 'FitDemo',
        inStock: true,
        stockQuantity: 50,
        images: demoImages,
        variants: [],
        features: ['Demo 360 viewer', 'Multiple images sequence'],
        tags: ['Demo', '360']
      };
      const response = await api.request({
        url: `${API_BASE}/shop/api/products`,
        method: 'POST',
        data: productData,
        headers: { 
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = response.data || {};
      if (data.success && data.product_id) {
        await loadProducts();
        // Navigate to details page to view 360
        window.location.href = `/shop/products/${data.product_id}`;
      } else {
        alert('Failed to create demo: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error('Demo seed failed:', e);
      alert('Demo product creation failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  const onFieldFocus = (name, currentValue) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const msg = fieldError(name, currentValue);
    setFormErrors(prev => ({ ...prev, [name]: msg || undefined }));
  };

  const onFieldBlur = (name, currentValue) => {
    const msg = fieldError(name, currentValue);
    setFormErrors(prev => ({ ...prev, [name]: msg || undefined }));
  };

  const validateAll = () => {
    const fields = ['name', 'price', 'stockQuantity', 'originalPrice'];
    const nextErrors = {};
    fields.forEach((f) => {
      const msg = fieldError(f, formData[f]);
      if (msg) nextErrors[f] = msg;
    });
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // Load products and categories
  useEffect(() => {
    if (!checkedAdmin) return;
    
    if (!isAdmin) {
      return;
    }
    
    loadProducts();
    loadCategories();
  }, [isAdmin, checkedAdmin]);

  const loadProducts = async () => {
    try {
      console.log('Loading products...');
      const response = await fetch(`${API_BASE}/shop/api/products`);
      const data = await response.json();
      console.log('Products response:', data);
      if (data.success) {
        setProducts(data.products);
        console.log('Products loaded:', data.products.length);
      } else {
        console.error('Failed to load products:', data.error);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/shop/api/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: nextValue
    }));

    // Live-validate on change once field was focused (touched)
    if (touched[name]) {
      const msg = fieldError(name, nextValue);
      setFormErrors(prev => ({ ...prev, [name]: msg || undefined }));
    }
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      alert('You must be an administrator to perform this action.');
      return;
    }

    // Validate all required fields before submit
    if (!validateAll()) {
      // Mark core fields as touched to reveal errors
      setTouched(prev => ({ ...prev, name: true, price: true, stockQuantity: true, originalPrice: true }));
      return alert('Please fix the highlighted errors before submitting.');
    }

    // Check if user is admin before proceeding
    const currentUser = SessionManager.getCurrentUser();
    if (!currentUser || !currentUser.token) {
      return alert('You must be logged in to perform this action.');
    }

    setLoading(true);

    try {
      const url = editingProduct 
        ? `${API_BASE}/shop/api/products/${editingProduct._id}`
        : `${API_BASE}/shop/api/products`;
      const method = editingProduct ? 'PUT' : 'POST';

      let response;
      if (selectedFiles && selectedFiles.length > 0) {
        // Build multipart form
        const fd = new FormData();
        fd.append('name', formData.name);
        fd.append('description', formData.description);
        fd.append('price', String(parseFloat(formData.price) || 0));
        if (formData.originalPrice && formData.originalPrice.trim() !== '') {
          fd.append('originalPrice', String(parseFloat(formData.originalPrice)));
        }
        fd.append('category', formData.category || '');
        fd.append('brand', formData.brand || '');
        fd.append('inStock', String(!!formData.inStock));
        fd.append('stockQuantity', String(parseInt(formData.stockQuantity) || 0));
        fd.append('variants', JSON.stringify(formData.variants.filter(v => v.type && v.value)));
        fd.append('features', JSON.stringify(formData.features.filter(f => f.trim() !== '')));
        fd.append('tags', JSON.stringify(formData.tags.filter(t => t.trim() !== '')));
        // For update, optionally replace images entirely
        if (editingProduct) fd.append('replaceImages', 'true');
        selectedFiles.forEach((f) => fd.append('images', f, f.name));

        response = await api.request({
          url,
          method,
          data: fd,
          headers: {
            'Authorization': `Bearer ${currentUser.token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // JSON fallback using URLs typed in the form
        const productData = {
          ...formData,
          price: parseFloat(formData.price) || 0,
          originalPrice: formData.originalPrice && formData.originalPrice.trim() !== '' ? parseFloat(formData.originalPrice) : null,
          stockQuantity: parseInt(formData.stockQuantity) || 0,
          images: formData.images.filter(img => img.trim() !== ''),
          variants: formData.variants.filter(v => v.type && v.value),
          features: formData.features.filter(f => f.trim() !== ''),
          tags: formData.tags.filter(t => t.trim() !== '')
        };
        response = await api.request({
          url,
          method,
          data: productData,
          headers: { 
            'Authorization': `Bearer ${currentUser.token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      const data = response.data || {};
      if (data.success) {
        setShowForm(false);
        setEditingProduct(null);
        resetForm();
        loadProducts();
        alert(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const editProduct = (product) => {
    if (!isAdmin) {
      alert('You must be an administrator to perform this action.');
      return;
    }
    
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      originalPrice: product.originalPrice?.toString() || '',
      category: product.category || '',
      brand: product.brand || '',
      inStock: product.in_stock !== false,
      stockQuantity: product.stockQuantity?.toString() || '',
      images: product.images?.length > 0 ? product.images : [''],
      variants: product.variants?.length > 0 ? product.variants : [{ type: '', value: '', price: '', stock: '' }],
      features: product.features?.length > 0 ? product.features : [''],
      tags: product.tags?.length > 0 ? product.tags : ['']
    });
    setShowForm(true);
  };

  const deleteProduct = async (productId) => {
    if (!isAdmin) {
      alert('You must be an administrator to perform this action.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    // Check if user is admin before proceeding
    const currentUser = SessionManager.getCurrentUser();
    if (!currentUser || !currentUser.token) {
      return alert('You must be logged in to perform this action.');
    }

    try {
      const response = await api.delete(`${API_BASE}/shop/api/products/${productId}`, {
        headers: { 
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = response.data || {};
      if (data.success) {
        loadProducts();
        alert('Product deleted successfully!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product: ' + (error.response?.data?.error || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      category: '',
      brand: '',
      inStock: true,
      stockQuantity: '',
      images: [''],
      variants: [{ type: '', value: '', price: '', stock: '' }],
      features: [''],
      tags: ['']
    });
    setSelectedFiles([]);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    resetForm();
  };

  // Show access denied message if user is not admin
  if (checkedAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You must be an administrator to access the product management panel.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while checking admin status
  if (!checkedAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Show access denied message if user is not admin */}
      {!isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You must be an administrator to access the product management panel.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200"
            >
              Go Back
            </button>
          </motion.div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Management</h1>
              <p className="text-gray-600">Manage your store inventory and product catalog</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={createDemoProduct}
                disabled={!isAdmin}
                className="flex items-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg border border-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Create a demo product with multiple images"
              >
                <Star className="w-4 h-4" />
                <span className="font-semibold">Add Demo 360 Product</span>
              </button>
              <button
                onClick={() => setShowForm(true)}
                disabled={!isAdmin}
                className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 border border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#2563eb', color: '#ffffff', border: '1px solid #2563eb' }}
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Add New Product</span>
              </button>
            </div>
          </div>
        </div>

        {/* Product Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <button
                    onClick={closeForm}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        onFocus={() => onFieldFocus('name', formData.name)}
                        onBlur={(e) => onFieldBlur('name', e.target.value)}
                        required
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Enter product name"
                      />
                      {touched.name && formErrors.name && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                      <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter brand name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter product description"
                    />
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        onFocus={() => onFieldFocus('price', formData.price)}
                        onBlur={(e) => onFieldBlur('price', e.target.value)}
                        required
                        min="0"
                        step="0.01"
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.price ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="0.00"
                      />
                      {touched.price && formErrors.price && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Original Price</label>
                      <input
                        type="number"
                        name="originalPrice"
                        value={formData.originalPrice}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                          <option key={cat.name} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Inventory */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity *</label>
                      <input
                        type="number"
                        name="stockQuantity"
                        value={formData.stockQuantity}
                        onChange={handleInputChange}
                        required
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="inStock"
                        checked={formData.inStock}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm font-medium text-gray-700">In Stock</label>
                    </div>
                  </div>

                  {/* Images */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
                    <div className="mb-3">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                        className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">Tip: Upload 24+ images shot around the product in order for smooth 360° view.</p>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">Or paste image URLs below (used only if no files were selected):</div>
                    {formData.images.map((image, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="url"
                          value={image}
                          onChange={(e) => handleArrayChange('images', index, e.target.value)}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Image URL"
                        />
                        {formData.images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayItem('images', index)}
                            className="px-3 py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('images')}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Add Image
                    </button>
                  </div>

                  {/* Features */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Key Features</label>
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => handleArrayChange('features', index, e.target.value)}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Feature description"
                        />
                        {formData.features.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayItem('features', index)}
                            className="px-3 py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('features')}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Add Feature
                    </button>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                    {formData.tags.map((tag, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={tag}
                          onChange={(e) => handleArrayChange('tags', index, e.target.value)}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Tag name"
                        />
                        {formData.tags.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayItem('tags', index)}
                            className="px-3 py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('tags')}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Add Tag
                    </button>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={closeForm}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                      style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>{loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* Products Table Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
            <h2 className="text-xl font-semibold text-gray-900">Products Inventory</h2>
            <p className="text-sm text-gray-600 mt-1">Total products: {products.length}</p>
          </div>
          
          {products.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
              <p className="text-gray-600 mb-4">Start building your store by adding your first product</p>
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Add Your First Product
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product._id || product.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-16 w-16">
                            <img
                              src={product.images?.[0] || product.image || '/placeholder.jpg'}
                              alt={product.name}
                              className="h-16 w-16 rounded-xl object-cover border border-gray-200"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.brand}</div>
                            <div className="text-xs text-gray-400">ID: {(product._id || product.id)?.slice(-8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">₹{product.price?.toLocaleString() || '0'}</div>
                        {product.originalPrice && (
                          <div className="text-xs text-gray-500 line-through">₹{product.originalPrice.toLocaleString()}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{product.stockQuantity || 0}</div>
                        <div className="text-xs text-gray-500">units</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.in_stock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => editProduct(product)}
                            disabled={!isAdmin}
                            className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProduct(product._id || product.id)}
                            disabled={!isAdmin}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProductManagement;