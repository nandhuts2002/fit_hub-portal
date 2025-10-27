#!/usr/bin/env python3
"""
Add sample orders to test the recommendation system
This will create realistic order data so recommendations work immediately
"""

import sys
import os
sys.path.append('server')

from pymongo import MongoClient
from datetime import datetime, timedelta
import random

def add_sample_orders():
    """Add sample orders to test recommendations"""
    print("🛍️ Adding sample orders for recommendation testing...")
    
    # Connect to MongoDB
    client = MongoClient(os.getenv('MONGO_URI', 'mongodb://localhost:27017'))
    db = client['fithub']
    orders_collection = db['orders']
    products_collection = db['products']
    
    # Get existing products
    products = list(products_collection.find({}))
    if not products:
        print("❌ No products found. Please add some products first.")
        return
    
    print(f"Found {len(products)} products in database")
    
    # Sample users
    sample_users = [
        'user1@example.com',
        'user2@example.com', 
        'user3@example.com',
        'user4@example.com',
        'user5@example.com'
    ]
    
    # Create sample orders
    sample_orders = []
    
    for i in range(20):  # Create 20 sample orders
        user = random.choice(sample_users)
        order_date = datetime.utcnow() - timedelta(days=random.randint(1, 30))
        
        # Random products for this order (1-3 products)
        num_products = random.randint(1, 3)
        order_products = random.sample(products, min(num_products, len(products)))
        
        items = []
        total_amount = 0
        
        for product in order_products:
            quantity = random.randint(1, 2)
            item_total = product.get('price', 0) * quantity
            total_amount += item_total
            
            items.append({
                'product_id': str(product['_id']),
                'product_name': product.get('name', ''),
                'quantity': quantity,
                'unit_price': product.get('price', 0),
                'total_price': item_total
            })
        
        order = {
            'order_id': f'SAMPLE{i+1:03d}',
            'user_email': user,
            'paymentStatus': 'Paid',
            'orderStatus': 'Delivered',
            'total': total_amount,
            'subtotal': total_amount,
            'shipping_cost': 0,
            'discount': 0,
            'items': items,
            'created_at': order_date,
            'updated_at': order_date,
            'timestamps': {
                'created': order_date,
                'paid': order_date,
                'updated': order_date
            }
        }
        
        sample_orders.append(order)
    
    # Insert sample orders
    if sample_orders:
        orders_collection.insert_many(sample_orders)
        print(f"✅ Added {len(sample_orders)} sample orders")
        
        # Show some statistics
        user_counts = {}
        for order in sample_orders:
            user = order['user_email']
            user_counts[user] = user_counts.get(user, 0) + 1
        
        print("\n📊 Sample Order Statistics:")
        for user, count in user_counts.items():
            print(f"  {user}: {count} orders")
        
        print(f"\n🎯 Now your recommendations should work!")
        print("Refresh your shop page to see recommendations.")
        
    else:
        print("❌ No sample orders created")

if __name__ == "__main__":
    try:
        add_sample_orders()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
