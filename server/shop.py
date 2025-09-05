from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime, timedelta
import random
import string
from models import (
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

# Helper function to calculate shipping
def calculate_shipping(total_amount, address):
    if total_amount >= 999:
        return 0  # Free shipping
    return 99  # Standard shipping

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
        
        # Convert ObjectId to string
        for product in products:
            product['_id'] = str(product['_id'])
            
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

@shop_bp.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    try:
        product = products_collection.find_one({'_id': ObjectId(product_id)})
        if not product:
            return jsonify({'success': False, 'error': 'Product not found'}), 404
            
        product['_id'] = str(product['_id'])
        return jsonify({'success': True, 'product': product})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@shop_bp.route('/api/products', methods=['POST'])
def create_product():
    try:
        data = request.get_json()
        
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
            'images': data.get('images', []),
            'variants': data.get('variants', []),
            'features': data.get('features', []),
            'tags': data.get('tags', []),
            'featured': data.get('featured', False),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Insert product
        result = products_collection.insert_one(product)
        product_id = str(result.inserted_id)
        
        # Create inventory record
        inventory_collection.insert_one({
            'product_id': result.inserted_id,
            'stock': product['stock_quantity'],
            'reserved': 0,
            'updated_at': datetime.utcnow()
        })
        
        return jsonify({
            'success': True,
            'product_id': product_id,
            'message': 'Product created successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@shop_bp.route('/api/products/<product_id>', methods=['PUT'])
def update_product(product_id):
    try:
        data = request.get_json()
        
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
            'images': data.get('images', []),
            'variants': data.get('variants', []),
            'features': data.get('features', []),
            'tags': data.get('tags', []),
            'featured': data.get('featured', False),
            'updated_at': datetime.utcnow()
        }
        
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        result = products_collection.update_one(
            {'_id': ObjectId(product_id)},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({'success': False, 'error': 'Product not found'}), 404
        
        # Update inventory
        if 'stock_quantity' in update_data:
            inventory_collection.update_one(
                {'product_id': ObjectId(product_id)},
                {'$set': {'stock': update_data['stock_quantity'], 'updated_at': datetime.utcnow()}}
            )
        
        return jsonify({'success': True, 'message': 'Product updated successfully'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@shop_bp.route('/api/products/<product_id>', methods=['DELETE'])
def delete_product(product_id):
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
@shop_bp.route('/api/cart/<user_email>', methods=['GET'])
def get_cart(user_email):
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
def add_to_cart(user_email):
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
                'updated_at': datetime.utcnow()
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
                'product_id': ObjectId(product_id),
                'quantity': quantity,
                'variant': variant,
                'added_at': datetime.utcnow()
            })
            
        # Update cart
        cart['updated_at'] = datetime.utcnow()
        carts_collection.update_one(
            {'user_email': user_email},
            {'$set': cart}
        )
        
        return jsonify({'success': True, 'message': 'Item added to cart'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@shop_bp.route('/api/cart/<user_email>/update', methods=['PUT'])
def update_cart_item(user_email):
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
def remove_from_cart(user_email):
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
def clear_cart(user_email):
    try:
        carts_collection.update_one(
            {'user_email': user_email},
            {'$set': {'items': [], 'updated_at': datetime.utcnow()}}
        )
        
        return jsonify({'success': True, 'message': 'Cart cleared'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# WISHLIST API
@shop_bp.route('/api/wishlist/<user_email>', methods=['GET'])
def get_wishlist(user_email):
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
def toggle_wishlist(user_email):
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
                'updated_at': datetime.utcnow()
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
                'added_at': datetime.utcnow()
            })
            action = 'added'
            
        # Update wishlist
        wishlist['updated_at'] = datetime.utcnow()
        wishlists_collection.update_one(
            {'user_email': user_email},
            {'$set': wishlist},
            upsert=True
        )
        
        return jsonify({'success': True, 'action': action, 'message': f'Item {action} from wishlist'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ORDERS API
@shop_bp.route('/api/orders/<user_email>', methods=['GET'])
def get_orders(user_email):
    try:
        orders = list(orders_collection.find({'user_email': user_email}).sort('created_at', -1))
        
        for order in orders:
            order['_id'] = str(order['_id'])
            # Get order items
            order_items = list(order_items_collection.find({'order_id': ObjectId(order['_id'])}))
            for item in order_items:
                item['_id'] = str(item['_id'])
            order['items'] = order_items
            
        return jsonify({'success': True, 'orders': orders})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@shop_bp.route('/api/orders', methods=['POST'])
def create_order():
    try:
        data = request.get_json()
        user_email = data.get('user_email')
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
            product = products_collection.find_one({'_id': ObjectId(item['product_id'])})
            if not product:
                continue
                
            item_total = product['price'] * item['quantity']
            subtotal += item_total
            
            order_items.append({
                'product_id': ObjectId(item['product_id']),
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
            'status': 'pending',
            'subtotal': subtotal,
            'shipping_cost': shipping_cost,
            'discount': discount,
            'total': total,
            'shipping_address': shipping_address,
            'payment_method': payment_method,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = orders_collection.insert_one(order)
        order_id = str(result.inserted_id)
        
        # Create order items
        for item in order_items:
            item['order_id'] = ObjectId(order_id)
            order_items_collection.insert_one(item)
            
        # Update inventory
        for item in items:
            inventory_collection.update_one(
                {'product_id': ObjectId(item['product_id'])},
                {'$inc': {'stock': -item['quantity']}}
            )
            
        # Clear cart
        carts_collection.update_one(
            {'user_email': user_email},
            {'$set': {'items': [], 'updated_at': datetime.utcnow()}}
        )
        
        return jsonify({
            'success': True, 
            'order_id': order_id,
            'order_number': order['order_id'],
            'message': 'Order created successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# REVIEWS API
@shop_bp.route('/api/products/<product_id>/reviews', methods=['GET'])
def get_product_reviews(product_id):
    try:
        reviews = list(reviews_collection.find({'product_id': ObjectId(product_id)}).sort('created_at', -1))
        
        for review in reviews:
            review['_id'] = str(review['_id'])
            
        return jsonify({'success': True, 'reviews': reviews})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@shop_bp.route('/api/products/<product_id>/reviews', methods=['POST'])
def create_review(product_id):
    try:
        data = request.get_json()
        user_email = data.get('user_email')
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
            'created_at': datetime.utcnow()
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
def init_shop_data():
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
                'created_at': datetime.utcnow()
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
                'created_at': datetime.utcnow()
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
                'created_at': datetime.utcnow()
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
                'updated_at': datetime.utcnow()
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