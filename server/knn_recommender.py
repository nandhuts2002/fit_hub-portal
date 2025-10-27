"""
Simple k-Nearest Neighbors (kNN) Product Recommendation System
Similar to Flipkart's "Based on your recent orders" feature
"""

# Try to import numpy, fallback to built-in functions if not available
try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False
    # Create a simple numpy-like interface for basic operations
    class SimpleNumpy:
        @staticmethod
        def mean(data):
            return sum(data) / len(data) if data else 0
        
        @staticmethod
        def std(data):
            if len(data) <= 1:
                return 0
            mean_val = sum(data) / len(data)
            variance = sum((x - mean_val) ** 2 for x in data) / (len(data) - 1)
            return math.sqrt(variance)
        
        @staticmethod
        def array(data):
            return data
        
        @staticmethod
        def zeros(shape):
            if isinstance(shape, int):
                return [0] * shape
            elif len(shape) == 2:
                return [[0] * shape[1] for _ in range(shape[0])]
            return [0] * shape[0]
        
        @staticmethod
        def argmax(data):
            return max(range(len(data)), key=lambda i: data[i]) if data else 0
        
        @staticmethod
        def argsort(data, reverse=False):
            return sorted(range(len(data)), key=lambda i: data[i], reverse=reverse)
    
    np = SimpleNumpy()

from collections import defaultdict, Counter
from datetime import datetime, timedelta
import math

class ProductRecommender:
    def __init__(self):
        self.k = 5  # Number of nearest neighbors to consider
        self.min_similarity = 0.1  # Minimum similarity threshold
    
    def calculate_user_similarity(self, user1_orders, user2_orders):
        """Calculate similarity between two users based on their order history"""
        if not user1_orders or not user2_orders:
            return 0
        
        # Get product IDs from orders
        user1_products = set()
        user2_products = set()
        
        for order in user1_orders:
            for item in order.get('items', []):
                product_id = str(item.get('product_id', ''))
                if product_id:
                    user1_products.add(product_id)
        
        for order in user2_orders:
            for item in order.get('items', []):
                product_id = str(item.get('product_id', ''))
                if product_id:
                    user2_products.add(product_id)
        
        if not user1_products or not user2_products:
            return 0
        
        # Calculate Jaccard similarity
        intersection = len(user1_products.intersection(user2_products))
        union = len(user1_products.union(user2_products))
        
        return intersection / union if union > 0 else 0
    
    def calculate_product_similarity(self, product1_id, product2_id, orders_data):
        """Calculate similarity between two products based on co-purchase patterns"""
        product1_buyers = set()
        product2_buyers = set()
        
        for order in orders_data:
            user_email = order.get('user_email', '')
            if not user_email:
                continue
                
            order_products = set()
            for item in order.get('items', []):
                product_id = str(item.get('product_id', ''))
                if product_id:
                    order_products.add(product_id)
            
            if product1_id in order_products:
                product1_buyers.add(user_email)
            if product2_id in order_products:
                product2_buyers.add(user_email)
        
        if not product1_buyers or not product2_buyers:
            return 0
        
        # Calculate co-purchase similarity
        co_purchases = len(product1_buyers.intersection(product2_buyers))
        total_purchases = len(product1_buyers.union(product2_buyers))
        
        return co_purchases / total_purchases if total_purchases > 0 else 0
    
    def get_user_recent_products(self, user_email, orders_data, days_back=30):
        """Get products from user's recent orders"""
        cutoff_date = datetime.utcnow() - timedelta(days=days_back)
        recent_products = []
        
        for order in orders_data:
            if order.get('user_email') != user_email:
                continue
                
            created_at = order.get('created_at')
            if isinstance(created_at, str):
                try:
                    created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                except:
                    continue
            
            if isinstance(created_at, datetime) and created_at >= cutoff_date:
                for item in order.get('items', []):
                    product_id = str(item.get('product_id', ''))
                    if product_id:
                        recent_products.append({
                            'product_id': product_id,
                            'quantity': item.get('quantity', 1),
                            'total_price': item.get('total_price', 0),
                            'order_date': created_at
                        })
        
        return recent_products
    
    def find_similar_users(self, target_user_email, orders_data, k=5):
        """Find k most similar users to the target user"""
        target_user_orders = [order for order in orders_data if order.get('user_email') == target_user_email]
        
        if not target_user_orders:
            return []
        
        user_similarities = []
        all_users = set(order.get('user_email') for order in orders_data if order.get('user_email'))
        
        for user_email in all_users:
            if user_email == target_user_email:
                continue
                
            user_orders = [order for order in orders_data if order.get('user_email') == user_email]
            similarity = self.calculate_user_similarity(target_user_orders, user_orders)
            
            if similarity > self.min_similarity:
                user_similarities.append((user_email, similarity))
        
        # Sort by similarity and return top k
        user_similarities.sort(key=lambda x: x[1], reverse=True)
        return user_similarities[:k]
    
    def get_recommendations_from_similar_users(self, target_user_email, orders_data, products_data, k=5):
        """Get product recommendations based on similar users' purchases"""
        similar_users = self.find_similar_users(target_user_email, orders_data, k)
        
        if not similar_users:
            return []
        
        # Get products bought by similar users
        recommended_products = defaultdict(float)
        target_user_products = set()
        
        # Get target user's products to avoid recommending what they already have
        target_orders = [order for order in orders_data if order.get('user_email') == target_user_email]
        for order in target_orders:
            for item in order.get('items', []):
                product_id = str(item.get('product_id', ''))
                if product_id:
                    target_user_products.add(product_id)
        
        # Collect recommendations from similar users
        for user_email, similarity in similar_users:
            user_orders = [order for order in orders_data if order.get('user_email') == user_email]
            
            for order in user_orders:
                for item in order.get('items', []):
                    product_id = str(item.get('product_id', ''))
                    if product_id and product_id not in target_user_products:
                        # Weight by similarity and recency
                        weight = similarity
                        recommended_products[product_id] += weight
        
        # Convert to list and sort by score
        recommendations = []
        for product_id, score in recommended_products.items():
            # Get product details
            product_info = next((p for p in products_data if str(p.get('_id')) == product_id), None)
            if product_info:
                recommendations.append({
                    'product_id': product_id,
                    'product': product_info,
                    'score': score,
                    'reason': 'Users with similar preferences also bought this'
                })
        
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        return recommendations[:10]  # Return top 10 recommendations
    
    def get_recommendations_from_recent_orders(self, user_email, orders_data, products_data, k=5):
        """Get recommendations based on user's recent orders (like Flipkart's approach)"""
        recent_products = self.get_user_recent_products(user_email, orders_data)
        
        if not recent_products:
            return []
        
        # Get unique recent product IDs
        recent_product_ids = list(set(item['product_id'] for item in recent_products))
        
        # Find similar products to recent purchases
        recommendations = []
        all_products = [str(p.get('_id')) for p in products_data]
        
        for recent_product_id in recent_product_ids:
            for product_id in all_products:
                if product_id == recent_product_id:
                    continue
                
                similarity = self.calculate_product_similarity(recent_product_id, product_id, orders_data)
                
                if similarity > self.min_similarity:
                    product_info = next((p for p in products_data if str(p.get('_id')) == product_id), None)
                    if product_info:
                        recommendations.append({
                            'product_id': product_id,
                            'product': product_info,
                            'score': similarity,
                            'reason': f'Similar to your recent purchase'
                        })
        
        # Remove duplicates and sort
        seen_products = set()
        unique_recommendations = []
        for rec in recommendations:
            if rec['product_id'] not in seen_products:
                seen_products.add(rec['product_id'])
                unique_recommendations.append(rec)
        
        unique_recommendations.sort(key=lambda x: x['score'], reverse=True)
        return unique_recommendations[:10]
    
    def get_hybrid_recommendations(self, user_email, orders_data, products_data, k=5):
        """Combine both approaches for better recommendations"""
        # Get recommendations from similar users
        similar_user_recs = self.get_recommendations_from_similar_users(user_email, orders_data, products_data, k)
        
        # Get recommendations from recent orders
        recent_order_recs = self.get_recommendations_from_recent_orders(user_email, orders_data, products_data, k)
        
        # Combine and deduplicate
        all_recommendations = {}
        
        # Add similar user recommendations with weight 0.6
        for rec in similar_user_recs:
            product_id = rec['product_id']
            all_recommendations[product_id] = {
                'product_id': product_id,
                'product': rec['product'],
                'score': rec['score'] * 0.6,
                'reason': rec['reason']
            }
        
        # Add recent order recommendations with weight 0.4
        for rec in recent_order_recs:
            product_id = rec['product_id']
            if product_id in all_recommendations:
                # Combine scores
                all_recommendations[product_id]['score'] += rec['score'] * 0.4
                all_recommendations[product_id]['reason'] = 'Based on your preferences and recent orders'
            else:
                all_recommendations[product_id] = {
                    'product_id': product_id,
                    'product': rec['product'],
                    'score': rec['score'] * 0.4,
                    'reason': rec['reason']
                }
        
        # Convert to list and sort
        final_recommendations = list(all_recommendations.values())
        final_recommendations.sort(key=lambda x: x['score'], reverse=True)
        
        return final_recommendations[:10]
    
    def get_trending_products(self, orders_data, products_data, days_back=30):
        """Get trending products based on recent orders"""
        cutoff_date = datetime.utcnow() - timedelta(days=days_back)
        product_counts = Counter()
        
        for order in orders_data:
            created_at = order.get('created_at')
            if isinstance(created_at, str):
                try:
                    created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                except:
                    continue
            
            if isinstance(created_at, datetime) and created_at >= cutoff_date:
                for item in order.get('items', []):
                    product_id = str(item.get('product_id', ''))
                    if product_id:
                        product_counts[product_id] += item.get('quantity', 1)
        
        # Get top trending products
        trending = []
        for product_id, count in product_counts.most_common(10):
            product_info = next((p for p in products_data if str(p.get('_id')) == product_id), None)
            if product_info:
                trending.append({
                    'product_id': product_id,
                    'product': product_info,
                    'orders_count': count,
                    'reason': 'Trending now'
                })
        
        return trending
