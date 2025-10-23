import os
# Fix for order creation and product ID handling
# This ensures both string and ObjectId formats are handled correctly
try:
    from werkzeug.utils import secure_filename
except Exception:
    secure_filename = lambda x: x

# Helpers for image storage
_BASE_DIR = os.path.dirname(__file__)
_UPLOAD_PRODUCTS_DIR = os.path.join(_BASE_DIR, 'uploads', 'products')

def _is_vercel():
    """Check if we're running on Vercel"""
    return os.getenv('VERCEL') == '1'

def _ensure_upload_dir():
    """Ensure the upload directory exists, but only when actually needed"""
    # On Vercel, we can't write to the filesystem, so skip directory creation
    if _is_vercel():
        return False
    
    if not os.path.exists(_UPLOAD_PRODUCTS_DIR):
        os.makedirs(_UPLOAD_PRODUCTS_DIR, exist_ok=True)
    return True

def _save_product_images(product_object_id, files_list):
    """Save uploaded images for a product in order as image_1.jpg, image_2.jpg, ...
    Returns a list of public URLs like /uploads/products/<product_id>/image_1.jpg
    """
    # On Vercel, we can't save files to local filesystem
    if _is_vercel():
        # Return empty list or implement cloud storage solution
        # For now, we'll just return empty list and handle this in the frontend
        return []
    
    # Local development or other environments
    product_id_str = str(product_object_id)
    target_dir = os.path.join(_UPLOAD_PRODUCTS_DIR, product_id_str)
    os.makedirs(target_dir, exist_ok=True)

    saved_urls = []
    index = 1
    for f in files_list:
        if not f or not getattr(f, 'filename', None):
            continue
        # Normalize extension; default to .jpg if missing
        fname = secure_filename(f.filename)
        ext = os.path.splitext(fname)[1].lower() or '.jpg'
        out_name = f"image_{index}{ext}"
        out_path = os.path.join(target_dir, out_name)
        f.save(out_path)
        saved_urls.append(f"/uploads/products/{product_id_str}/{out_name}")
        index += 1

    return saved_urls

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime, timedelta, timezone
import random
import string
import os
import hmac
import hashlib
from models import (
    db,
    products_collection, 
    carts_collection, 
    wishlists_collection,
    categories_collection,
    orders_collection,
    order_items_collection,
    reviews_collection,
    inventory_collection,
    coupons_collection,
    addresses_collection,
    payment_methods_collection,
    shipping_collection
)

shop_bp = Blueprint('shop', __name__)

# Helper function to generate order ID
def generate_order_id():
    return 'ORD' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

# Helper function to generate a plausible tracking number
def generate_tracking_number():
    # Format example: FTB-IND-XXXXXXXX (X = upper alnum)
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"FTB-IND-{random_part}"

def _razorpay_client_keys():
    return {
        'key_id': os.getenv('RAZORPAY_KEY_ID', ''),
        'key_secret': os.getenv('RAZORPAY_KEY_SECRET', '')
    }

# Helper function to calculate shipping
def calculate_shipping(total_amount, address):
    if total_amount >= 999:
        return 0  # Free shipping
    return 99  # Standard shipping

# Auth helpers
def _require_admin():
    """Check if the current user is an admin. Returns True if admin, False otherwise."""
    from flask_jwt_extended import get_jwt
    
    identity = get_jwt_identity()
    if not identity:
        return False
    
    # Get role from JWT claims (new format)
    claims = get_jwt()
    user_role = claims.get('role', 'user')
    
    return user_role == 'admin'

def _require_same_user(target_email: str):
    identity = get_jwt_identity()
    # identity is now a string (email), not a dict
    email = identity if isinstance(identity, str) else (identity.get('email') if isinstance(identity, dict) else None)
    if not email or email.lower() != (target_email or '').lower():
        return False
    return True

def _get_email_from_identity(identity):
    """Helper to extract email from JWT identity (supports both string and dict formats)"""
    return identity if isinstance(identity, str) else (identity.get('email') if isinstance(identity, dict) else None)

# PRODUCTS API
@shop_bp.route('/api/products', methods=['GET'])
def get_products():
    try:
        # Get query parameters
        category = request.args.get('category', '')
        search = request.args.get('search', '')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        sort_by = request.args.get('sort_by', 'featured')
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 12, type=int)
        
        # Build filter query
        filter_query = {}
        
        if category and category != 'All':
            filter_query['category'] = category
            
        if search:
            filter_query['$or'] = [
                {'name': {'$regex': search, '$options': 'i'}},
                {'brand': {'$regex': search, '$options': 'i'}},
                {'description': {'$regex': search, '$options': 'i'}}
            ]
            
        if min_price is not None:
            filter_query['price'] = {'$gte': min_price}
            
        if max_price is not None:
            if 'price' in filter_query:
                filter_query['price']['$lte'] = max_price
            else:
                filter_query['price'] = {'$lte': max_price}
        
        # Build sort query
        sort_query = {}
        if sort_by == 'price-low':
            sort_query['price'] = 1
        elif sort_by == 'price-high':
            sort_query['price'] = -1
        elif sort_by == 'rating':
            sort_query['rating'] = -1
        elif sort_by == 'newest':
            sort_query['created_at'] = -1
        else:  # featured
            sort_query['featured'] = -1
            
        # Calculate skip for pagination
        skip = (page - 1) * limit
        
        # Execute query
        products = list(products_collection.find(filter_query).sort(list(sort_query.items())).skip(skip).limit(limit))
        total = products_collection.count_documents(filter_query)
        
        # Convert ObjectId to string and join inventory
        for product in products:
            product_id = product.get('_id')
            product['_id'] = str(product_id)
            try:
                inv = inventory_collection.find_one({'product_id': product_id})
                stock_val = int(inv.get('stock', 0)) if inv else int(product.get('stock_quantity', 0) or 0)
            except Exception:
                stock_val = int(product.get('stock_quantity', 0) or 0)
            product['stock_quantity'] = stock_val
            product['in_stock'] = bool(stock_val > 0)
            
            # Fix image URLs for Vercel deployment
            if product.get('images'):
                fixed_images = []
                for img in product['images']:
                    if img.startswith('http'):
                        # Already a full URL, keep as is
                        fixed_images.append(img)
                    elif img.startswith('/'):
                        # Relative path, prepend the correct base URL
                        base_url = os.getenv('FRONTEND_URL') or 'https://fit-hub-portal-1.onrender.com'
                        fixed_images.append(f"{base_url}{img}")
                    else:
                        # Just a filename, prepend the correct base URL
                        base_url = os.getenv('FRONTEND_URL') or 'https://fit-hub-portal-1.onrender.com'
                        fixed_images.append(f"{base_url}/uploads/products/{str(product_id)}/{img}")
                product['images'] = fixed_images
            
        return jsonify({
            'success': True,
            'products': products,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ADDRESSES API (per-user)
@shop_bp.route('/api/addresses', methods=['GET'])
@jwt_required()
def list_addresses():
    try:
        identity = get_jwt_identity()
        user_email = _get_email_from_identity(identity)
        if not user_email:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        # Ensure index for faster lookups
        try:
            addresses_collection.create_index('user_email')
        except Exception:
            pass

        docs = list(addresses_collection.find({'user_email': user_email}).sort('created_at', -1))
        for d in docs:
            d['_id'] = str(d['_id'])
        return jsonify({'success': True, 'addresses': docs})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@shop_bp.route('/api/addresses', methods=['POST'])
@jwt_required()
def create_address():
    try:
        identity = get_jwt_identity()
        user_email = _get_email_from_identity(identity)
        if not user_email:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        data = request.get_json() or {}
        label = (data.get('label') or 'Address').strip()
        addr = data.get('data') or {}
        is_default = bool(data.get('default', False))

        doc = {
            'user_email': user_email,
            'label': label,
            'data': {
                'name': addr.get('name', ''),
                'email': addr.get('email', ''),
                'phone': addr.get('phone', ''),
                'address': addr.get('address', ''),
                'city': addr.get('city', ''),
                'state': addr.get('state', ''),
                'pincode': addr.get('pincode', ''),
            },
            'default': is_default,
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc),
        }

        # If making default, unset others
        if is_default:
            addresses_collection.update_many({'user_email': user_email, 'default': True}, {'$set': {'default': False}})

        res = addresses_collection.insert_one(doc)
        return jsonify({'success': True, 'id': str(res.inserted_id)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@shop_bp.route('/api/addresses/<addr_id>', methods=['PUT'])
@jwt_required()
def update_address(addr_id):
    try:
        identity = get_jwt_identity()
        user_email = _get_email_from_identity(identity)
        if not user_email:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        data = request.get_json() or {}
        label = data.get('label')
        addr = data.get('data')
        is_default = data.get('default')

        # Build update fields carefully to avoid type errors
        set_fields = {}
        set_fields['updated_at'] = datetime.now(timezone.utc)
        if label is not None:
            set_fields['label'] = label
        if addr is not None:
            set_fields['data'] = {
                'name': addr.get('name', ''),
                'email': addr.get('email', ''),
                'phone': addr.get('phone', ''),
                'address': addr.get('address', ''),
                'city': addr.get('city', ''),
                'state': addr.get('state', ''),
                'pincode': addr.get('pincode', ''),
            }
        if is_default is not None:
            set_fields['default'] = bool(is_default)

        # If setting default true, unset others first
        if is_default is True:
            addresses_collection.update_many({'user_email': user_email, 'default': True}, {'$set': {'default': False}})

        res = addresses_collection.update_one({'_id': ObjectId(addr_id), 'user_email': user_email}, {'$set': set_fields})
        if res.matched_count == 0:
            return jsonify({'success': False, 'error': 'Address not found'}), 404
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@shop_bp.route('/api/addresses/<addr_id>', methods=['DELETE'])
@jwt_required()
def delete_address(addr_id):
    try:
        identity = get_jwt_identity()
        user_email = _get_email_from_identity(identity)
        if not user_email:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        res = addresses_collection.delete_one({'_id': ObjectId(addr_id), 'user_email': user_email})
        if res.deleted_count == 0:
            return jsonify({'success': False, 'error': 'Address not found'}), 404
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@shop_bp.route('/api/addresses/<addr_id>/default', methods=['POST'])
@jwt_required()
def set_default_address(addr_id):
    try:
        identity = get_jwt_identity()
        user_email = _get_email_from_identity(identity)
        if not user_email:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        # Unset others
        addresses_collection.update_many({'user_email': user_email, 'default': True}, {'$set': {'default': False}})
        # Set this one
        update_fields = {'default': True, 'updated_at': datetime.now(timezone.utc)}
        res = addresses_collection.update_one({'_id': ObjectId(addr_id), 'user_email': user_email}, {'$set': update_fields})
        if res.matched_count == 0:
            return jsonify({'success': False, 'error': 'Address not found'}), 404
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@shop_bp.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    try:
        product = products_collection.find_one({'_id': ObjectId(product_id)})
        if not product:
            return jsonify({'success': False, 'error': 'Product not found'}), 404
            
        # Attach inventory info
        try:
            inv = inventory_collection.find_one({'product_id': ObjectId(product_id)})
            stock_val = int(inv.get('stock', 0)) if inv else int(product.get('stock_quantity', 0) or 0)
        except Exception:
            stock_val = int(product.get('stock_quantity', 0) or 0)
        product['stock_quantity'] = stock_val
        product['in_stock'] = bool(stock_val > 0)
        
        product['_id'] = str(product['_id'])
        
        # Fix image URLs for Vercel deployment
        if product.get('images'):
            fixed_images = []
            for img in product['images']:
                if img.startswith('http'):
                    # Already a full URL, keep as is
                    fixed_images.append(img)
                elif img.startswith('/'):
                    # Relative path, prepend the correct base URL
                    base_url = os.getenv('FRONTEND_URL') or 'https://fit-hub-portal-1.onrender.com'
                    fixed_images.append(f"{base_url}{img}")
                else:
                    # Just a filename, prepend the correct base URL
                    base_url = os.getenv('FRONTEND_URL') or 'https://fit-hub-portal-1.onrender.com'
                    fixed_images.append(f"{base_url}/uploads/products/{str(product['_id'])}/{img}")
            product['images'] = fixed_images
        
        return jsonify({'success': True, 'product': product})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@shop_bp.route('/api/products', methods=['POST'])
@jwt_required()
def create_product():
    # Admin only
    if not _require_admin():
        return jsonify({'success': False, 'error': 'Admin access required'}), 403
    try:
        if request.content_type and 'multipart/form-data' in request.content_type:
            form = request.form or {}
            import json
            def _parse(val, default):
                try:
                    return json.loads(val) if isinstance(val, str) else (val or default)
                except Exception:
                    return default
            data = {
                'name': form.get('name'),
                'description': form.get('description'),
                'price': form.get('price'),
                'originalPrice': form.get('originalPrice'),
                'category': form.get('category'),
                'brand': form.get('brand'),
                'inStock': form.get('inStock', 'true').lower() in ('1','true','yes'),
                'stockQuantity': form.get('stockQuantity', '0'),
                'variants': _parse(form.get('variants'), []),
                'features': _parse(form.get('features'), []),
                'tags': _parse(form.get('tags'), []),
            }
            incoming_files = request.files.getlist('images')
        else:
            data = request.get_json() or {}
            incoming_files = []
        
        # Validate required fields
        required_fields = ['name', 'description', 'price', 'category', 'brand']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'{field} is required'}), 400
        
        # Create product document
        product = {
            'name': data['name'],
            'description': data['description'],
            'price': float(data['price']) if data['price'] is not None else 0.0,
            'original_price': float(data.get('originalPrice', data['price'])) if data.get('originalPrice') is not None else None,
            'category': data['category'],
            'brand': data['brand'],
            'rating': 0,
            'reviews': 0,
            'in_stock': data.get('inStock', True),
            'stock_quantity': int(data.get('stockQuantity', 0)),
            'images': [],
            'variants': data.get('variants', []),
            'features': data.get('features', []),
            'tags': data.get('tags', []),
            'featured': data.get('featured', False),
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc)
        }
        
        # Insert product
        result = products_collection.insert_one(product)
        product_id = str(result.inserted_id)
        
        # If files were uploaded, save them and update images
        if incoming_files:
            saved_urls = _save_product_images(result.inserted_id, incoming_files)
            products_collection.update_one({'_id': result.inserted_id}, {'$set': {'images': saved_urls}})
        else:
            # Backward compatibility: accept images array from JSON
            json_images = data.get('images', [])
            if isinstance(json_images, list) and json_images:
                products_collection.update_one({'_id': result.inserted_id}, {'$set': {'images': json_images}})

        # Create inventory record
        inventory_collection.insert_one({
            'product_id': result.inserted_id,
            'stock': product['stock_quantity'],
            'reserved': 0,
            'updated_at': datetime.now(timezone.utc)
        })
        
        return jsonify({
            'success': True,
            'product_id': product_id,
            'message': 'Product created successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@shop_bp.route('/api/products/<product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    # Admin only
    if not _require_admin():
        return jsonify({'success': False, 'error': 'Admin access required'}), 403
    try:
        if request.content_type and 'multipart/form-data' in request.content_type:
            form = request.form or {}
            import json
            def _parse(val, default):
                try:
                    return json.loads(val) if isinstance(val, str) else (val or default)
                except Exception:
                    return default
            data = {
                'name': form.get('name'),
                'description': form.get('description'),
                'price': form.get('price'),
                'originalPrice': form.get('originalPrice'),
                'category': form.get('category'),
                'brand': form.get('brand'),
                'inStock': form.get('inStock'),
                'stockQuantity': form.get('stockQuantity'),
                'variants': _parse(form.get('variants'), None),
                'features': _parse(form.get('features'), None),
                'tags': _parse(form.get('tags'), None),
            }
            incoming_files = request.files.getlist('images')
            replace_images = (form.get('replaceImages', 'false').lower() in ('1','true','yes'))
        else:
            data = request.get_json() or {}
            incoming_files = []
            replace_images = False
        
        # Update product
        update_data = {
            'name': data.get('name'),
            'description': data.get('description'),
            'price': float(data.get('price', 0)) if data.get('price') is not None else 0.0,
            'original_price': float(data.get('originalPrice', data.get('price', 0))) if data.get('originalPrice') is not None else None,
            'category': data.get('category'),
            'brand': data.get('brand'),
            'in_stock': data.get('inStock', True),
            'stock_quantity': int(data.get('stockQuantity', 0)),
            'images': data.get('images', None),
            'variants': data.get('variants', None),
            'features': data.get('features', None),
            'tags': data.get('tags', None),
            'featured': data.get('featured', False),
            'updated_at': datetime.now(timezone.utc)
        }
        
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        result = products_collection.update_one(
            {'_id': ObjectId(product_id)},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({'success': False, 'error': 'Product not found'}), 404
        
        # Handle image uploads if provided
        if incoming_files:
            if replace_images:
                # Optionally clear existing files from disk
                prod_dir = os.path.join(_UPLOAD_PRODUCTS_DIR, str(product_id))
                try:
                    for fn in os.listdir(prod_dir):
                        try:
                            os.remove(os.path.join(prod_dir, fn))
                        except Exception:
                            pass
                except Exception:
                    pass
                saved_urls = _save_product_images(ObjectId(product_id), incoming_files)
                products_collection.update_one({'_id': ObjectId(product_id)}, {'$set': {'images': saved_urls}})
            else:
                saved_urls = _save_product_images(ObjectId(product_id), incoming_files)
                # Append to existing images
                products_collection.update_one({'_id': ObjectId(product_id)}, {'$push': {'images': {'$each': saved_urls}}})

        # Update inventory
        if 'stock_quantity' in update_data:
            inventory_collection.update_one(
                {'product_id': ObjectId(product_id)},
                {'$set': {'stock': update_data['stock_quantity'], 'updated_at': datetime.now(timezone.utc)}}
            )
        
        return jsonify({'success': True, 'message': 'Product updated successfully'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@shop_bp.route('/api/products/<product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    # Admin only
    if not _require_admin():
        return jsonify({'success': False, 'error': 'Admin access required'}), 403
    try:
        # Delete product
        result = products_collection.delete_one({'_id': ObjectId(product_id)})
        
        if result.deleted_count == 0:
            return jsonify({'success': False, 'error': 'Product not found'}), 404
        
        # Delete inventory record
        inventory_collection.delete_one({'product_id': ObjectId(product_id)})
        
        # Delete reviews
        reviews_collection.delete_many({'product_id': ObjectId(product_id)})
        
        return jsonify({'success': True, 'message': 'Product deleted successfully'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# CATEGORIES API
@shop_bp.route('/api/categories', methods=['GET'])
def get_categories():
    try:
        categories = list(categories_collection.find({}, {'_id': 0}))
        return jsonify({'success': True, 'categories': categories})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# CART API
@shop_bp.route('/api/cart/init', methods=['POST'])
@jwt_required()
def init_cart():
    try:
        # Ensure collection exists at the DB level (even before inserting docs)
        try:
            carts_collection.create_index('user_email', unique=True)
        except Exception:
            pass

        identity = get_jwt_identity()
        user_email = _get_email_from_identity(identity)
        if not user_email:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        # Ensure collection exists by touching it; Mongo creates on first write
        existing = carts_collection.find_one({'user_email': user_email})
        if not existing:
            carts_collection.insert_one({
                'user_email': user_email,
                'items': [],
                'created_at': datetime.utcnow(),
                'updated_at': datetime.now(timezone.utc)
            })
            created = True
        else:
            created = False

        return jsonify({'success': True, 'created': created})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@shop_bp.route('/api/cart/<user_email>', methods=['GET'])
@jwt_required()
def get_cart(user_email):
    if not _require_same_user(user_email):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403
    try:
        cart = carts_collection.find_one({'user_email': user_email})
        if not cart:
            return jsonify({'success': True, 'cart': {'items': []}})
            
        # Populate product details
        for item in cart['items']:
            product = products_collection.find_one({'_id': ObjectId(item['product_id'])})
            if product:
                item['product'] = {
                    'name': product['name'],
                    'price': product['price'],
                    'image': product['images'][0] if product.get('images') else '',
                    'brand': product['brand']
                }
                item['product_id'] = str(item['product_id'])
                
        return jsonify({'success': True, 'cart': cart})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@shop_bp.route('/api/cart/<user_email>/add', methods=['POST'])
@jwt_required()
def add_to_cart(user_email):
    if not _require_same_user(user_email):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        variant = data.get('variant', {})
        
        # Check if product exists
        product = products_collection.find_one({'_id': ObjectId(product_id)})
        if not product:
            return jsonify({'success': False, 'error': 'Product not found'}), 404
            
        # Check inventory
        inventory = inventory_collection.find_one({'product_id': ObjectId(product_id)})
        if inventory and inventory['stock'] < quantity:
            return jsonify({'success': False, 'error': 'Insufficient stock'}), 400
            
        # Get or create cart
        cart = carts_collection.find_one({'user_email': user_email})
        if not cart:
            cart = {
                'user_email': user_email,
                'items': [],
                'created_at': datetime.utcnow(),
                'updated_at': datetime.now(timezone.utc)
            }
            carts_collection.insert_one(cart)
            
        # Check if item already exists with same variant
        existing_item = None
        for item in cart['items']:
            if (str(item['product_id']) == product_id and 
                item.get('variant', {}) == variant):
                existing_item = item
                break
                
        if existing_item:
            # Update quantity
            existing_item['quantity'] += quantity
        else:
            # Add new item
            cart['items'].append({
                '_id': ObjectId(),
                'product_id': ObjectId(product_id),
                'quantity': quantity,
                'variant': variant,
                'added_at': datetime.now(timezone.utc)
            })
            
        # Update cart
        cart['updated_at'] = datetime.now(timezone.utc)
        carts_collection.update_one(
            {'user_email': user_email},
            {'$set': {'items': cart['items'], 'updated_at': cart['updated_at']}}
        )
        
        return jsonify({'success': True, 'message': 'Item added to cart'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@shop_bp.route('/api/cart/<user_email>/update', methods=['PUT'])
@jwt_required()
def update_cart_item(user_email):
    if not _require_same_user(user_email):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403
    try:
        data = request.get_json()
        item_id = data.get('item_id')
        quantity = data.get('quantity')
        
        if quantity <= 0:
            # Remove item
            carts_collection.update_one(
                {'user_email': user_email},
                {'$pull': {'items': {'_id': ObjectId(item_id)}}}
            )
        else:
            # Update quantity
            carts_collection.update_one(
                {'user_email': user_email, 'items._id': ObjectId(item_id)},
                {'$set': {'items.$.quantity': quantity, 'updated_at': datetime.utcnow()}}
            )
            
        return jsonify({'success': True, 'message': 'Cart updated'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@shop_bp.route('/api/cart/<user_email>/remove', methods=['DELETE'])
@jwt_required()
def remove_from_cart(user_email):
    if not _require_same_user(user_email):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403
    try:
        data = request.get_json()
        item_id = data.get('item_id')
        
        carts_collection.update_one(
            {'user_email': user_email},
            {'$pull': {'items': {'_id': ObjectId(item_id)}}}
        )
        
        return jsonify({'success': True, 'message': 'Item removed from cart'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@shop_bp.route('/api/cart/<user_email>/clear', methods=['DELETE'])
@jwt_required()
def clear_cart(user_email):
    if not _require_same_user(user_email):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403
    try:
        carts_collection.update_one(
            {'user_email': user_email},
            {'$set': {'items': [], 'updated_at': datetime.utcnow()}}
        )
        
        return jsonify({'success': True, 'message': 'Cart cleared'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# RAZORPAY: Create order
@shop_bp.route('/api/razorpay/create-order', methods=['POST'])
@jwt_required()
def create_razorpay_order():
    try:
        keys = _razorpay_client_keys()
        if not keys['key_id'] or not keys['key_secret']:
            return jsonify({'success': False, 'error': 'Razorpay not configured'}), 500

        data = request.get_json() or {}
        amount = int(float(data.get('amount', 0)) * 100)  # in paise
        currency = data.get('currency', 'INR')
        # Prefer client-provided identifiers to map payment back to our order later
        receipt = (
            data.get('receipt')
            or data.get('internal_order_id')
            or data.get('order_number')
            or generate_order_id()
        )

        import requests
        response = requests.post(
            'https://api.razorpay.com/v1/orders',
            auth=(keys['key_id'], keys['key_secret']),
            json={
                'amount': amount,
                'currency': currency,
                'receipt': receipt,
                'payment_capture': 1
            },
            timeout=10
        )
        if response.status_code != 200:
            return jsonify({'success': False, 'error': 'Failed to create Razorpay order'}), 500
        order = response.json()
        return jsonify({'success': True, 'key_id': keys['key_id'], 'order': order})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# RAZORPAY: Verify payment (webhook or client confirm)
@shop_bp.route('/api/razorpay/verify', methods=['POST'])
def verify_razorpay_signature():
    try:
        keys = _razorpay_client_keys()
        payload = request.get_json() or {}
        order_id = payload.get('razorpay_order_id')
        payment_id = payload.get('razorpay_payment_id')
        signature = payload.get('razorpay_signature')
        internal_order_id = payload.get('internal_order_id')  # Mongo _id string

        # Only require the Razorpay fields; internal_order_id is optional now
        if not (order_id and payment_id and signature):
            return jsonify({'success': False, 'error': 'Missing fields'}), 400

        # Verify signature
        body = f"{order_id}|{payment_id}".encode('utf-8')
        expected = hmac.new(keys['key_secret'].encode('utf-8'), body, hashlib.sha256).hexdigest()
        if expected != signature:
            return jsonify({'success': False, 'error': 'Signature mismatch'}), 400

        # Build update document for payment success
        update_doc = {
            'paymentStatus': 'Paid',
            'orderStatus': 'Processing',
            'razorpayOrderId': order_id,
            'razorpayPaymentId': payment_id,
            'payment_method.type': 'razorpay',
            'payment_method.status': 'paid',
            'timestamps.paid': datetime.utcnow(),
            'updated_at': datetime.now(timezone.utc)
        }

        matched = 0

        # 1) Preferred: update by internal Mongo _id if provided
        target_filter = None
        if internal_order_id:
            try:
                target_filter = {'_id': ObjectId(internal_order_id)}
            except Exception:
                target_filter = None
        if target_filter:
            res = orders_collection.update_one(target_filter, {'$set': update_doc})
            matched = res.matched_count

        # 2) Fallback: update by razorpayOrderId if already stored earlier
        if matched == 0:
            res = orders_collection.update_one({'razorpayOrderId': order_id}, {'$set': update_doc})
            matched = res.matched_count

        # 3) Final fallback: fetch Razorpay order to get the receipt and map to our order
        if matched == 0:
            try:
                import requests
                r = requests.get(
                    f'https://api.razorpay.com/v1/orders/{order_id}',
                    auth=(keys['key_id'], keys['key_secret']),
                    timeout=10
                )
                if r.status_code == 200:
                    rz_order = r.json()
                    receipt = rz_order.get('receipt')
                    if receipt:
                        # Try matching by human-readable order number fields
                        res = orders_collection.update_one({'order_id': receipt}, {'$set': update_doc})
                        matched = res.matched_count
                        if matched == 0:
                            res = orders_collection.update_one({'orderNumber': receipt}, {'$set': update_doc})
                            matched = res.matched_count
            except Exception:
                # Ignore network or parsing errors and rely on previous attempts
                pass

        if matched == 0:
            return jsonify({'success': False, 'error': 'Order not found to update'}), 404

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# SHIPPING MANAGEMENT (admin)
@shop_bp.route('/api/orders/<order_id>/ship', methods=['POST'])
@jwt_required()
def admin_ship_order(order_id):
    if not _require_admin():
        return jsonify({'success': False, 'error': 'Admin access required'}), 403
    try:
        data = request.get_json() or {}
        carrier = data.get('carrier') or 'Manual'
        service = data.get('service') or 'Standard'
        tracking_number = data.get('tracking_number') or generate_tracking_number()
        tracking_url = data.get('tracking_url')
        expected_delivery = data.get('expected_delivery')  # ISO string optional

        update = {
            'orderStatus': 'Shipped',
            'shipping.status': 'shipped',
            'shipping.carrier': carrier,
            'shipping.service': service,
            'shipping.tracking_number': tracking_number,
            'shipping.tracking_url': tracking_url,
            'shipping.dispatched_at': datetime.utcnow(),
            'updated_at': datetime.now(timezone.utc)
        }
        if expected_delivery:
            update['shipping.expected_delivery'] = expected_delivery

        res = orders_collection.update_one({'_id': ObjectId(order_id)}, {'$set': update})
        if res.matched_count == 0:
            return jsonify({'success': False, 'error': 'Order not found'}), 404

        return jsonify({'success': True, 'tracking_number': tracking_number})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@shop_bp.route('/api/orders/<order_id>/update-shipping', methods=['POST'])
@jwt_required()
def admin_update_shipping(order_id):
    if not _require_admin():
        return jsonify({'success': False, 'error': 'Admin access required'}), 403
    try:
        data = request.get_json() or {}
        set_fields = {}
        for k in ['carrier','service','tracking_number','tracking_url','charges','status','expected_delivery']:
            if k in data:
                set_fields[f'shipping.{k}'] = data[k]
        # allow address corrections before dispatch
        if 'shipping_address' in data:
            set_fields['shipping_address'] = data['shipping_address']
        if not set_fields:
            return jsonify({'success': False, 'error': 'No fields to update'}), 400
        set_fields['updated_at'] = datetime.now(timezone.utc)
        res = orders_collection.update_one({'_id': ObjectId(order_id)}, {'$set': set_fields})
        if res.matched_count == 0:
            return jsonify({'success': False, 'error': 'Order not found'}), 404
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@shop_bp.route('/api/orders/<order_id>/deliver', methods=['POST'])
@jwt_required()
def admin_mark_delivered(order_id):
    if not _require_admin():
        return jsonify({'success': False, 'error': 'Admin access required'}), 403
    try:
        update = {
            'orderStatus': 'Delivered',
            'shipping.status': 'delivered',
            'shipping.delivered_at': datetime.utcnow(),
            'updated_at': datetime.now(timezone.utc)
        }
        res = orders_collection.update_one({'_id': ObjectId(order_id)}, {'$set': update})
        if res.matched_count == 0:
            return jsonify({'success': False, 'error': 'Order not found'}), 404
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ADMIN: update order status and tracking
@shop_bp.route('/api/orders/<order_id>/status', methods=['PUT'])
@jwt_required()
def update_order_status(order_id):
    if not _require_admin():
        return jsonify({'success': False, 'error': 'Admin access required'}), 403
    try:
        data = request.get_json() or {}
        status = data.get('orderStatus')
        tracking = data.get('trackingNumber')
        auto_generate_tracking = data.get('autoGenerateTracking', True)
        update = {}
        if status:
            update['orderStatus'] = status
        # Auto-generate tracking number when moving to Shipped without one provided
        if status == 'Shipped' and (not tracking) and auto_generate_tracking:
            tracking = generate_tracking_number()
        if tracking is not None:
            update['trackingNumber'] = tracking
        if not update:
            return jsonify({'success': False, 'error': 'No fields to update'}), 400
        update['updated_at'] = datetime.now(timezone.utc)
        orders_collection.update_one({'_id': ObjectId(order_id)}, {'$set': update})
        return jsonify({'success': True, 'trackingNumber': update.get('trackingNumber')})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ADMIN: update payment status/method (for COD or manual adjustments)
@shop_bp.route('/api/orders/<order_id>/payment', methods=['PUT'])
@jwt_required()
def update_order_payment(order_id):
    if not _require_admin():
        return jsonify({'success': False, 'error': 'Admin access required'}), 403
    try:
        data = request.get_json() or {}
        payment_status = data.get('paymentStatus')  # e.g., Pending | Paid | Failed
        method = data.get('method')                 # e.g., razorpay | cod | upi | card
        transaction_id = data.get('transactionId')  # optional
        update = {}
        if payment_status:
            update['paymentStatus'] = payment_status
            # set paid timestamp if moving to Paid
            if payment_status == 'Paid':
                update['timestamps.paid'] = datetime.now(timezone.utc)
        if method:
            update['payment_method.type'] = method
        if transaction_id:
            update['payment_method.transactionId'] = transaction_id
        if not update:
            return jsonify({'success': False, 'error': 'No fields to update'}), 400
        update['updated_at'] = datetime.now(timezone.utc)
        orders_collection.update_one({'_id': ObjectId(order_id)}, {'$set': update})
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# WISHLIST API
@shop_bp.route('/api/wishlist/<user_email>', methods=['GET'])
@jwt_required()
def get_wishlist(user_email):
    if not _require_same_user(user_email):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403
    try:
        wishlist = wishlists_collection.find_one({'user_email': user_email})
        if not wishlist:
            return jsonify({'success': True, 'wishlist': {'items': []}})
            
        # Populate product details
        for item in wishlist['items']:
            product = products_collection.find_one({'_id': ObjectId(item['product_id'])})
            if product:
                item['product'] = {
                    'name': product['name'],
                    'price': product['price'],
                    'image': product['images'][0] if product.get('images') else '',
                    'brand': product['brand']
                }
                item['product_id'] = str(item['product_id'])
                
        return jsonify({'success': True, 'wishlist': wishlist})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@shop_bp.route('/api/wishlist/<user_email>/toggle', methods=['POST'])
@jwt_required()
def toggle_wishlist(user_email):
    if not _require_same_user(user_email):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        
        # Check if product exists
        product = products_collection.find_one({'_id': ObjectId(product_id)})
        if not product:
            return jsonify({'success': False, 'error': 'Product not found'}), 404
            
        # Get or create wishlist
        wishlist = wishlists_collection.find_one({'user_email': user_email})
        if not wishlist:
            wishlist = {
                'user_email': user_email,
                'items': [],
                'created_at': datetime.utcnow(),
                'updated_at': datetime.now(timezone.utc)
            }
            wishlists_collection.insert_one(wishlist)
            
        # Check if item exists
        existing_item = None
        for item in wishlist['items']:
            if str(item['product_id']) == product_id:
                existing_item = item
                break
                
        if existing_item:
            # Remove from wishlist
            wishlist['items'] = [item for item in wishlist['items'] if str(item['product_id']) != product_id]
            action = 'removed'
        else:
            # Add to wishlist
            wishlist['items'].append({
                'product_id': ObjectId(product_id),
                'added_at': datetime.now(timezone.utc)
            })
            action = 'added'
            
        # Update wishlist
        wishlist['updated_at'] = datetime.now(timezone.utc)
        wishlists_collection.update_one(
            {'user_email': user_email},
            {'$set': wishlist},
            upsert=True
        )
        
        return jsonify({'success': True, 'action': action, 'message': f'Item {action} from wishlist'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ORDERS API
@shop_bp.route('/api/orders', methods=['GET'])
@jwt_required()
def admin_list_orders():
    # Admin only
    if not _require_admin():
        return jsonify({'success': False, 'error': 'Admin access required'}), 403
    try:
        orders = list(orders_collection.find({}).sort('created_at', -1))
        for o in orders:
            raw_id = o.get('_id')
            o['_id'] = str(raw_id) if raw_id is not None else ''
            # Normalize datetime fields to ISO strings
            try:
                from datetime import datetime as _dt
                for f in ['created_at', 'updated_at']:
                    val = o.get(f)
                    if isinstance(val, _dt):
                        o[f] = val.isoformat() + 'Z'
                ts = o.get('timestamps') or {}
                if isinstance(ts, dict):
                    for tf in ['created', 'paid', 'updated']:
                        tval = ts.get(tf)
                        if isinstance(tval, _dt):
                            ts[tf] = tval.isoformat() + 'Z'
                    o['timestamps'] = ts
            except Exception:
                pass
        return jsonify({'success': True, 'orders': orders})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
@shop_bp.route('/api/orders/<user_email>', methods=['GET'])
@jwt_required()
def get_orders(user_email):
    if not _require_same_user(user_email):
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403
    try:
        print(f"Fetching orders for user: {user_email}")
        orders = list(orders_collection.find({'user_email': user_email}).sort('created_at', -1))
        print(f"Found {len(orders)} orders in database")
        
        for order in orders:
            # Preserve original _id for lookups before converting to string for response
            raw_id = order.get('_id')
            order['_id'] = str(raw_id) if raw_id is not None else ''
            # Get order items using the raw ObjectId when possible
            order_items = []
            try:
                # Try with ObjectId first
                lookup_id = raw_id if isinstance(raw_id, ObjectId) else ObjectId(order['_id'])
                order_items = list(order_items_collection.find({'order_id': lookup_id}))
            except Exception:
                # If lookup_id creation fails, try with string version
                try:
                    order_items = list(order_items_collection.find({'order_id': order['_id']}))
                except Exception:
                    # If both fail, leave items as empty and continue
                    order_items = []
            safe_order_number = order.get('order_id') or order.get('orderNumber') or order['_id']
            print(f"Found {len(order_items)} items for order {safe_order_number}")
            for item in order_items:
                # Convert all ObjectId fields to strings for JSON serialization
                item['_id'] = str(item.get('_id', ''))
                if isinstance(item.get('product_id'), ObjectId):
                    item['product_id'] = str(item['product_id'])
                if isinstance(item.get('order_id'), ObjectId):
                    item['order_id'] = str(item['order_id'])
            order['items'] = order_items
            
            # Normalize datetime fields to ISO strings
            try:
                from datetime import datetime as _dt
                for f in ['created_at', 'updated_at']:
                    val = order.get(f)
                    if isinstance(val, _dt):
                        order[f] = val.isoformat() + 'Z'
                ts = order.get('timestamps') or {}
                if isinstance(ts, dict):
                    for tf in ['created', 'paid', 'updated']:
                        tval = ts.get(tf)
                        if isinstance(tval, _dt):
                            ts[tf] = tval.isoformat() + 'Z'
                    order['timestamps'] = ts
            except Exception:
                pass
        
        print(f"Returning {len(orders)} orders to client")
        return jsonify({'success': True, 'orders': orders})
        
    except Exception as e:
        print(f"Error fetching orders: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@shop_bp.route('/api/order/<order_id>', methods=['GET'])
@jwt_required()
def get_order_detail(order_id):
    try:
        identity = get_jwt_identity()
        user_email = _get_email_from_identity(identity)
        if not user_email:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        # Try by Mongo _id first
        order = None
        try:
            order = orders_collection.find_one({'_id': ObjectId(order_id)})
        except Exception:
            order = None
        
        # Fallback: if not found, try by human-readable order number
        if not order:
            order = orders_collection.find_one({'order_id': order_id})
        
        if not order:
            return jsonify({'success': False, 'error': 'Order not found'}), 404
        if order.get('user_email') != user_email:
            return jsonify({'success': False, 'error': 'Forbidden'}), 403

        oid = order['_id']
        order['_id'] = str(order['_id'])
        # Fix the order item lookup - handle both ObjectId and string versions
        try:
            # Try with ObjectId first
            items = list(order_items_collection.find({'order_id': ObjectId(oid)}))
        except Exception:
            # Fallback to string
            items = list(order_items_collection.find({'order_id': oid}))
        
        for item in items:
            item['_id'] = str(item['_id'])
            # Also ensure product_id is converted to string
            if isinstance(item.get('product_id'), ObjectId):
                item['product_id'] = str(item['product_id'])
            if isinstance(item.get('order_id'), ObjectId):
                item['order_id'] = str(item['order_id'])
        order['items'] = items

        # Normalize datetime fields in this single order
        try:
            from datetime import datetime as _dt
            for f in ['created_at', 'updated_at']:
                val = order.get(f)
                if isinstance(val, _dt):
                    order[f] = val.isoformat() + 'Z'
            ts = order.get('timestamps') or {}
            if isinstance(ts, dict):
                for tf in ['created', 'paid', 'updated']:
                    tval = ts.get(tf)
                    if isinstance(tval, _dt):
                        ts[tf] = tval.isoformat() + 'Z'
                order['timestamps'] = ts
        except Exception:
            pass

        return jsonify({'success': True, 'order': order})
    except Exception as e:
        print(f"Error in get_order_detail: {str(e)}")  # Add logging
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@shop_bp.route('/api/orders', methods=['POST'])
@jwt_required()
def create_order():
    try:
        data = request.get_json()
        identity = get_jwt_identity()
        user_email = _get_email_from_identity(identity)
        if not user_email:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        items = data.get('items', [])
        shipping_address = data.get('shipping_address', {})
        payment_method = data.get('payment_method', {})
        coupon_code = data.get('coupon_code', '')
        
        if not items:
            return jsonify({'success': False, 'error': 'No items in cart'}), 400
            
        # Calculate totals
        subtotal = 0
        order_items = []
        
        for item in items:
            # Handle both string and ObjectId product_id
            product_id = item['product_id']
            try:
                if isinstance(product_id, str):
                    product_obj_id = ObjectId(product_id)
                else:
                    product_obj_id = product_id
                product = products_collection.find_one({'_id': product_obj_id})
            except Exception:
                # If ObjectId conversion fails, try to find by string ID
                product = products_collection.find_one({'_id': product_id})
            
            if not product:
                continue
                
            item_total = product['price'] * item['quantity']
            subtotal += item_total
            
            order_items.append({
                'product_id': product['_id'],  # Keep as ObjectId for DB storage
                'product_name': product['name'],
                'product_image': product['images'][0] if product.get('images') else '',
                'quantity': item['quantity'],
                'unit_price': product['price'],
                'total_price': item_total,
                'variant': item.get('variant', {})
            })
            
        # Calculate shipping
        shipping_cost = calculate_shipping(subtotal, shipping_address)
        
        # Apply coupon if valid
        discount = 0
        if coupon_code:
            coupon = coupons_collection.find_one({
                'code': coupon_code,
                'is_active': True,
                'expires_at': {'$gt': datetime.utcnow()}
            })
            if coupon:
                if coupon['type'] == 'percentage':
                    discount = subtotal * (coupon['value'] / 100)
                else:
                    discount = coupon['value']
                discount = min(discount, subtotal)  # Can't discount more than subtotal
                
        total = subtotal + shipping_cost - discount
        
        # Create order
        order = {
            'order_id': generate_order_id(),
            'user_email': user_email,
            # Flipkart-like fields
            'paymentStatus': 'Pending',  # Pending | Paid
            'orderStatus': 'Pending',    # Pending | Processing | Packed | Shipped | Delivered
            'razorpayOrderId': None,
            'razorpayPaymentId': None,
            'trackingNumber': None,
            'timestamps': {
                'created': datetime.utcnow(),
                'paid': None,
                'updated': None
            },
            'status': 'pending',  # legacy
            'subtotal': subtotal,
            'shipping_cost': shipping_cost,
            'discount': discount,
            'total': total,
            # Shipment snapshot fields (safe defaults at creation)
            'shipping': {
                'carrier': None,
                'service': None,
                'tracking_number': None,
                'tracking_url': None,
                'charges': shipping_cost,
                'status': 'pending',  # pending | packed | shipped | out_for_delivery | delivered | returned
                'dispatched_at': None,
                'delivered_at': None,
                'expected_delivery': None
            },
            'shipping_address': {
                'fullName': shipping_address.get('name') or shipping_address.get('fullName', ''),
                'phone': shipping_address.get('phone', ''),
                'street': shipping_address.get('address', ''),
                'city': shipping_address.get('city', ''),
                'state': shipping_address.get('state', ''),
                'pincode': shipping_address.get('pincode', ''),
                'geo': shipping_address.get('geo', {})
            },
            'payment_method': {
                'type': payment_method.get('type') or 'razorpay',
                'status': payment_method.get('status') or ('pending' if (payment_method.get('type') or 'razorpay') == 'razorpay' else 'cod_pending'),
            },
            'created_at': datetime.utcnow(),
            'updated_at': datetime.now(timezone.utc)
        }
        
        result = orders_collection.insert_one(order)
        order_id = str(result.inserted_id)
        
        # Create order items
        for item in order_items:
            item['order_id'] = ObjectId(order_id)
            order_items_collection.insert_one(item)
            
        # Update inventory
        for item in items:
            try:
                product_id = item['product_id']
                if isinstance(product_id, str):
                    product_obj_id = ObjectId(product_id)
                else:
                    product_obj_id = product_id
                    
                inventory_collection.update_one(
                    {'product_id': product_obj_id},
                    {'$inc': {'stock': -item['quantity']}}
                )
            except Exception as e:
                print(f"Error updating inventory for product {item['product_id']}: {e}")
            
        # Clear cart
        carts_collection.update_one(
            {'user_email': user_email},
            {'$set': {'items': [], 'updated_at': datetime.utcnow()}}
        )
        
        return jsonify({
            'success': True, 
            'order_id': order_id,
            'order_number': order['order_id'],
            'total': total,
            'message': 'Order created successfully'
        })
    except Exception as e:
        print(f"Error creating order: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

# REVIEWS API
@shop_bp.route('/api/products/<product_id>/reviews', methods=['GET'])
def get_product_reviews(product_id):
    try:
        # Ensure indexes for efficient lookups
        try:
            reviews_collection.create_index([('product_id', 1), ('created_at', -1)])
        except Exception:
            pass
        reviews = list(reviews_collection.find({'product_id': ObjectId(product_id)}).sort('created_at', -1))

        # Normalize fields for JSON
        for review in reviews:
            review['_id'] = str(review.get('_id'))
            created = review.get('created_at')
            try:
                # Convert datetime to ISO string for JSON serialization
                if created is not None:
                    review['created_at'] = created.isoformat() + 'Z'
            except Exception:
                # If conversion fails, fallback to string
                review['created_at'] = str(created) if created is not None else None
            # Ensure product_id is string for client-side safety if needed elsewhere
            if isinstance(review.get('product_id'), ObjectId):
                review['product_id'] = str(review['product_id'])

        return jsonify({'success': True, 'reviews': reviews})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@shop_bp.route('/api/products/<product_id>/reviews', methods=['POST'])
@jwt_required()
def create_review(product_id):
    try:
        # Enforce one review per user per product at DB level (best-effort)
        try:
            reviews_collection.create_index([('product_id', 1), ('user_email', 1)], unique=True)
        except Exception:
            pass
        data = request.get_json()
        identity = get_jwt_identity()
        user_email = _get_email_from_identity(identity)
        if not user_email:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        rating = data.get('rating')
        comment = data.get('comment', '')
        
        # Check if user already reviewed this product
        existing_review = reviews_collection.find_one({
            'product_id': ObjectId(product_id),
            'user_email': user_email
        })
        
        if existing_review:
            return jsonify({'success': False, 'error': 'You have already reviewed this product'}), 400
            
        # Create review
        review = {
            'product_id': ObjectId(product_id),
            'user_email': user_email,
            'rating': rating,
            'comment': comment,
            'created_at': datetime.now(timezone.utc)
        }
        
        result = reviews_collection.insert_one(review)
        
        # Update product rating
        product_reviews = list(reviews_collection.find({'product_id': ObjectId(product_id)}))
        if product_reviews:
            avg_rating = sum(r['rating'] for r in product_reviews) / len(product_reviews)
            products_collection.update_one(
                {'_id': ObjectId(product_id)},
                {'$set': {'rating': round(avg_rating, 1), 'reviews': len(product_reviews)}}
            )
        
        return jsonify({'success': True, 'message': 'Review created successfully'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# COUPONS API
@shop_bp.route('/api/coupons/validate', methods=['POST'])
def validate_coupon():
    try:
        data = request.get_json()
        code = data.get('code')
        
        coupon = coupons_collection.find_one({
            'code': code,
            'is_active': True,
            'expires_at': {'$gt': datetime.utcnow()}
        })
        
        if not coupon:
            return jsonify({'success': False, 'error': 'Invalid or expired coupon'}), 400
            
        return jsonify({
            'success': True,
            'coupon': {
                'code': coupon['code'],
                'type': coupon['type'],
                'value': coupon['value'],
                'description': coupon.get('description', '')
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Initialize sample data
@shop_bp.route('/api/init-shop-data', methods=['POST'])
@jwt_required()
def init_shop_data():
    # Admin only
    if not _require_admin():
        return jsonify({'success': False, 'error': 'Admin access required'}), 403
    try:
        # Sample categories
        categories = [
            {
                'name': 'Weights',
                'slug': 'weights',
                'description': 'Dumbbells, barbells, and weight plates',
                'image': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
                'is_active': True
            },
            {
                'name': 'Yoga',
                'slug': 'yoga',
                'description': 'Yoga mats, blocks, and accessories',
                'image': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
                'is_active': True
            },
            {
                'name': 'Supplements',
                'slug': 'supplements',
                'description': 'Protein powders, vitamins, and nutrition',
                'image': 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400',
                'is_active': True
            },
            {
                'name': 'Accessories',
                'slug': 'accessories',
                'description': 'Resistance bands, gloves, and workout accessories',
                'image': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
                'is_active': True
            },
            {
                'name': 'Electronics',
                'slug': 'electronics',
                'description': 'Fitness trackers, smartwatches, and tech',
                'image': 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
                'is_active': True
            },
            {
                'name': 'Recovery',
                'slug': 'recovery',
                'description': 'Foam rollers, massage tools, and recovery equipment',
                'image': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
                'is_active': True
            }
        ]
        
        # Clear existing categories
        categories_collection.delete_many({})
        
        # Insert categories
        categories_collection.insert_many(categories)
        
        # Sample products
        products = [
            {
                'name': 'Premium Adjustable Dumbbells Set',
                'description': 'Professional adjustable dumbbells with quick-change weight system',
                'price': 12999,
                'original_price': 15999,
                'category': 'Weights',
                'brand': 'FitPro',
                'rating': 4.8,
                'reviews': 1247,
                'in_stock': True,
                'stock_quantity': 50,
                'images': [
                    'https://m.media-amazon.com/images/I/81w0A8gJwsL._SX522_.jpg'
                ],
                'variants': [
                    {'size': '5-25kg', 'price': 12999, 'stock': 25},
                    {'size': '10-50kg', 'price': 18999, 'stock': 15}
                ],
                'features': ['Quick-change system', 'Non-slip grip', 'Compact storage', '2-year warranty'],
                'tags': ['Best Seller', 'Premium'],
                'featured': True,
                'created_at': datetime.now(timezone.utc)
            },
            {
                'name': 'Yoga Mat Pro - Extra Thick',
                'description': '6mm thick premium yoga mat with superior grip and cushioning',
                'price': 1299,
                'original_price': 1799,
                'category': 'Yoga',
                'brand': 'ZenFit',
                'rating': 4.6,
                'reviews': 892,
                'in_stock': True,
                'stock_quantity': 100,
                'images': [
                    'https://m.media-amazon.com/images/I/71bYv8XlR4L._SX522_.jpg'
                ],
                'variants': [
                    {'color': 'Purple', 'price': 1299, 'stock': 30},
                    {'color': 'Blue', 'price': 1299, 'stock': 40},
                    {'color': 'Pink', 'price': 1299, 'stock': 30}
                ],
                'features': ['6mm thickness', 'Non-slip surface', 'Eco-friendly', 'Easy to clean'],
                'tags': ['Eco-Friendly'],
                'featured': True,
                'created_at': datetime.now(timezone.utc)
            },
            {
                'name': 'Whey Protein Isolate - Vanilla',
                'description': '100% whey protein isolate with 25g protein per serving',
                'price': 2499,
                'original_price': 2999,
                'category': 'Supplements',
                'brand': 'MuscleMax',
                'rating': 4.7,
                'reviews': 2156,
                'in_stock': True,
                'stock_quantity': 200,
                'images': [
                    'https://m.media-amazon.com/images/I/71iO2R+cwUL._SX679_.jpg'
                ],
                'variants': [
                    {'flavor': 'Vanilla', 'price': 2499, 'stock': 70},
                    {'flavor': 'Chocolate', 'price': 2499, 'stock': 80},
                    {'flavor': 'Strawberry', 'price': 2499, 'stock': 50}
                ],
                'features': ['25g protein', 'Low carb', 'No artificial flavors', 'Lab tested'],
                'tags': ['High Protein', 'Lab Tested'],
                'featured': True,
                'created_at': datetime.now(timezone.utc)
            }
        ]
        
        # Clear existing products
        products_collection.delete_many({})
        
        # Insert products
        for product in products:
            result = products_collection.insert_one(product)
            product_id = result.inserted_id
            
            # Create inventory record
            inventory_collection.insert_one({
                'product_id': product_id,
                'stock': product['stock_quantity'],
                'reserved': 0,
                'updated_at': datetime.now(timezone.utc)
            })
        
        # Sample coupons
        coupons = [
            {
                'code': 'WELCOME10',
                'type': 'percentage',
                'value': 10,
                'description': '10% off for new customers',
                'min_amount': 1000,
                'max_discount': 500,
                'is_active': True,
                'expires_at': datetime.utcnow() + timedelta(days=30)
            },
            {
                'code': 'FITNESS20',
                'type': 'fixed',
                'value': 200,
                'description': '₹200 off on orders above ₹2000',
                'min_amount': 2000,
                'max_discount': 200,
                'is_active': True,
                'expires_at': datetime.utcnow() + timedelta(days=60)
            }
        ]
        
        # Clear existing coupons
        coupons_collection.delete_many({})
        
        # Insert coupons
        coupons_collection.insert_many(coupons)
        
        return jsonify({'success': True, 'message': 'Shop data initialized successfully'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# NOTIFICATIONS API
@shop_bp.route('/api/notifications/<user_email>', methods=['GET'])
@jwt_required()
def get_notifications(user_email):
    try:
        identity = get_jwt_identity()
        current_user_email = _get_email_from_identity(identity)
        if not current_user_email or current_user_email != user_email:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        print(f"Fetching notifications for user: {user_email}")

        # Synthesize notifications from recent order updates as a simple, zero-DB model demo
        orders = list(orders_collection.find({'user_email': user_email}).sort('updated_at', -1))

        notifications = []
        for order in orders[:10]:
            status = order.get('orderStatus') or 'Pending'
            updated_at = order.get('updated_at') or order.get('created_at') or datetime.now(timezone.utc)
            order_number = order.get('order_id') or order.get('orderNumber') or str(order.get('_id'))

            # Map order statuses to notification categories
            notif_type = 'general'
            message = f"Order {order_number} status updated to {status}."
            if status == 'Processing':
                notif_type = 'general'
            elif status == 'Packed':
                notif_type = 'general'
            elif status == 'Shipped':
                notif_type = 'order_shipped'
                message = f"Order {order_number} has been shipped."
            elif status == 'Delivered':
                notif_type = 'order_delivered'
                message = f"Order {order_number} was delivered successfully."
            elif status == 'Cancelled':
                notif_type = 'order_cancelled'
                message = f"Order {order_number} was cancelled."

            notifications.append({
                'id': str(order.get('_id')) + '_' + status.lower(),
                'type': notif_type,
                'title': f"Order {order_number}",
                'message': message,
                'read': False,
                'createdAt': updated_at.isoformat() + 'Z'
            })

        print(f"Returning {len(notifications)} notifications to client")
        return jsonify({'success': True, 'notifications': notifications})
        
    except Exception as e:
        print(f"Error fetching notifications: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@shop_bp.route('/api/notifications/<user_email>/mark-read', methods=['POST'])
@jwt_required()
def mark_notification_read(user_email):
    try:
        identity = get_jwt_identity()
        current_user_email = _get_email_from_identity(identity)
        if not current_user_email or current_user_email != user_email:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403

        data = request.get_json()
        notification_id = data.get('notification_id')
        
        if not notification_id:
            return jsonify({'success': False, 'error': 'Notification ID required'}), 400

        # In a real app, this would update the notification in the database
        # For now, just return success
        return jsonify({'success': True, 'message': 'Notification marked as read'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500