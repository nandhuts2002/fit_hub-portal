from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

client = MongoClient(os.getenv('MONGO_URI'))
db = client['fithub']

# Core collections
users_collection = db['users']  # ✅ This is what gets imported in auth.py

# Learning/Tutorials
tutorials_collection = db['tutorials']  # For trainer tutorials

# Support/Queries
queries_collection = db['queries']  # For user queries to trainers

# Applications
trainer_applications_collection = db['trainer_applications']  # For pending trainer approvals

# Shop/E-commerce
products_collection = db['products']
carts_collection = db['carts']          # 1 doc per user: { user_email, items: [{ product_id, quantity, added_at }] }
wishlists_collection = db['wishlists']  # 1 doc per user: { user_email, items: [{ product_id, added_at }] }

# Enhanced E-commerce Collections
categories_collection = db['categories']  # Product categories with metadata
orders_collection = db['orders']          # Order history and tracking
order_items_collection = db['order_items'] # Individual items in orders
reviews_collection = db['reviews']        # Product reviews and ratings
inventory_collection = db['inventory']    # Stock management
coupons_collection = db['coupons']        # Discount codes and promotions
addresses_collection = db['addresses']    # User shipping addresses
payment_methods_collection = db['payment_methods'] # Saved payment methods
shipping_collection = db['shipping']      # Shipping rates and zones

# Music/Relaxation
music_tracks_collection = db['music_tracks']  # Admin-managed relaxation tracks