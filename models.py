from pymongo import MongoClient
from dotenv import load_dotenv
import os
import sys

load_dotenv()

MONGO_URI = os.getenv('MONGO_URI')

if not MONGO_URI:
    print("ERROR: MONGO_URI environment variable is not set.", file=sys.stderr)
    raise RuntimeError("MONGO_URI environment variable is not set. Please configure it in your Vercel project settings.")

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client['fithub']
except Exception as e:
    print(f"ERROR: Failed to connect to MongoDB: {e}", file=sys.stderr)
    raise

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

# Location-based features
gyms_collection = db['gyms']          # Gym locations and details
trainers_collection = db['trainers']  # Trainer profiles with location data
events_collection = db['events']      # Local fitness events

# Booking and membership collections
event_bookings_collection = db['event_bookings']    # Event bookings with payment details
gym_memberships_collection = db['gym_memberships']  # Gym memberships with payment details
trainer_bookings_collection = db['trainer_bookings']  # Trainer session bookings

# Community/Profile features
# Stores community posts for profile grids (mirrors REST community posts)
community_posts_collection = db['community_posts']
# Stores user profile metadata for profile page (display name, handle, bio, avatar)
user_profiles_collection = db['user_profiles']
# Follows relation: who follows whom
follows_collection = db['follows']  # { follower_email, following_email, created_at }

# Exercise GIFs collection
exercise_gifs_collection = db['exercise_gifs']  # { name, gif_url, category, tags, created_by, created_at }

# Extended Community Features Collections
challenges_collection = db['challenges']  # Fitness challenges and competitions
user_progress_collection = db['user_progress']  # Activity logs and progress tracking
badges_collection = db['badges']  # Achievement badges system
qa_sessions_collection = db['qa_sessions']  # Expert Q&A sessions
spotlights_collection = db['spotlights']  # Transformation spotlights

# Yoga Progress Tracking
yoga_progress_collection = db['yoga_progress']  # Yoga workout sessions and progress tracking

# Exercise Progress Tracking
exercise_progress_collection = db['exercise_progress']  # Strength workout sessions and progress tracking

# Blog System Collections
blog_posts_collection = db['blog_posts']  # Blog posts with rich content
blog_categories_collection = db['blog_categories']  # Blog categories and tags
blog_comments_collection = db['blog_comments']  # Blog post comments
blog_likes_collection = db['blog_likes']  # Blog post likes and reactions