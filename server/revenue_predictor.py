"""
Revenue Predictor using Decision Tree Algorithm
Analyzes historical order data to predict future revenue trends
"""

import numpy as np
from datetime import datetime, timedelta
from collections import defaultdict
import math

class RevenuePredictor:
    def __init__(self):
        self.features = [
            'total_amount',
            'order_count',
            'avg_order_value',
            'payment_status_rate',
            'delivery_status_rate',
            'monthly_trend',
            'seasonal_factor',
            'customer_retention_rate'
        ]
    
    def extract_features(self, orders):
        """Extract features from orders data for decision tree"""
        if not orders:
            return self._get_default_features()
        
        # Calculate basic metrics
        total_revenue = sum(order.get('total', 0) for order in orders)
        order_count = len(orders)
        avg_order_value = total_revenue / order_count if order_count > 0 else 0
        
        # Payment status analysis
        paid_orders = [o for o in orders if o.get('paymentStatus') == 'Paid']
        payment_success_rate = len(paid_orders) / order_count if order_count > 0 else 0
        
        # Delivery status analysis
        delivered_orders = [o for o in orders if o.get('orderStatus') == 'Delivered']
        delivery_success_rate = len(delivered_orders) / order_count if order_count > 0 else 0
        
        # Monthly trend analysis
        monthly_revenue = self._calculate_monthly_trend(orders)
        
        # Seasonal factor (simplified)
        seasonal_factor = self._calculate_seasonal_factor(orders)
        
        # Customer retention (simplified - based on repeat orders)
        customer_retention_rate = self._calculate_retention_rate(orders)
        
        return {
            'total_amount': total_revenue,
            'order_count': order_count,
            'avg_order_value': avg_order_value,
            'payment_status_rate': payment_success_rate,
            'delivery_status_rate': delivery_success_rate,
            'monthly_trend': monthly_revenue,
            'seasonal_factor': seasonal_factor,
            'customer_retention_rate': customer_retention_rate
        }
    
    def _calculate_monthly_trend(self, orders):
        """Calculate monthly revenue trend"""
        monthly_data = defaultdict(float)
        
        for order in orders:
            created_at = order.get('created_at')
            if isinstance(created_at, str):
                try:
                    created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                except:
                    continue
            
            if isinstance(created_at, datetime):
                month_key = created_at.strftime('%Y-%m')
                monthly_data[month_key] += order.get('total', 0)
        
        if len(monthly_data) < 2:
            return 0
        
        # Calculate trend (positive = growing, negative = declining)
        months = sorted(monthly_data.keys())
        revenues = [monthly_data[month] for month in months]
        
        # Simple linear trend calculation
        n = len(revenues)
        if n < 2:
            return 0
        
        x = np.arange(n)
        y = np.array(revenues)
        
        # Calculate slope
        slope = np.polyfit(x, y, 1)[0]
        return slope
    
    def _calculate_seasonal_factor(self, orders):
        """Calculate seasonal factor based on order patterns"""
        monthly_counts = defaultdict(int)
        
        for order in orders:
            created_at = order.get('created_at')
            if isinstance(created_at, str):
                try:
                    created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                except:
                    continue
            
            if isinstance(created_at, datetime):
                month = created_at.month
                monthly_counts[month] += 1
        
        if not monthly_counts:
            return 1.0
        
        # Calculate average and seasonal variation
        avg_count = sum(monthly_counts.values()) / len(monthly_counts)
        current_month = datetime.now().month
        
        # Simple seasonal factor (higher in certain months)
        seasonal_multipliers = {
            1: 1.2,   # January - New Year fitness resolutions
            2: 1.1,   # February - Valentine's Day
            3: 1.0,   # March - Normal
            4: 0.9,   # April - Normal
            5: 1.0,   # May - Normal
            6: 1.1,   # June - Summer prep
            7: 1.0,   # July - Normal
            8: 0.9,   # August - Normal
            9: 1.2,   # September - Back to school
            10: 1.1,  # October - Pre-holiday
            11: 1.3,  # November - Holiday prep
            12: 1.4   # December - Holiday shopping
        }
        
        return seasonal_multipliers.get(current_month, 1.0)
    
    def _calculate_retention_rate(self, orders):
        """Calculate customer retention rate"""
        customer_orders = defaultdict(list)
        
        for order in orders:
            user_email = order.get('user_email')
            if user_email:
                customer_orders[user_email].append(order)
        
        if not customer_orders:
            return 0
        
        repeat_customers = sum(1 for orders_list in customer_orders.values() if len(orders_list) > 1)
        total_customers = len(customer_orders)
        
        return repeat_customers / total_customers if total_customers > 0 else 0
    
    def _get_default_features(self):
        """Return default features when no orders exist"""
        return {
            'total_amount': 0,
            'order_count': 0,
            'avg_order_value': 0,
            'payment_status_rate': 0,
            'delivery_status_rate': 0,
            'monthly_trend': 0,
            'seasonal_factor': 1.0,
            'customer_retention_rate': 0
        }
    
    def build_decision_tree(self, features):
        """Build a simple decision tree for revenue prediction"""
        # Decision tree rules based on features
        predictions = []
        
        # Rule 1: High order count + good payment rate = positive prediction
        if features['order_count'] > 50 and features['payment_status_rate'] > 0.8:
            predictions.append(('high_volume_success', 0.8))
        
        # Rule 2: Growing trend + seasonal factor = positive prediction
        if features['monthly_trend'] > 0 and features['seasonal_factor'] > 1.1:
            predictions.append(('growth_seasonal', 0.7))
        
        # Rule 3: High retention rate = positive prediction
        if features['customer_retention_rate'] > 0.3:
            predictions.append(('high_retention', 0.6))
        
        # Rule 4: Low order count = negative prediction
        if features['order_count'] < 10:
            predictions.append(('low_volume', -0.5))
        
        # Rule 5: Poor payment rate = negative prediction
        if features['payment_status_rate'] < 0.5:
            predictions.append(('poor_payment', -0.6))
        
        # Rule 6: Declining trend = negative prediction
        if features['monthly_trend'] < -1000:
            predictions.append(('declining_trend', -0.4))
        
        return predictions
    
    def predict_revenue(self, orders, prediction_period_days=30):
        """Predict revenue for the next period"""
        features = self.extract_features(orders)
        predictions = self.build_decision_tree(features)
        
        # Calculate base prediction
        if features['order_count'] == 0:
            base_revenue = 0
        else:
            # Use average order value and expected order count
            avg_daily_orders = features['order_count'] / max(1, self._get_data_period_days(orders))
            expected_daily_orders = avg_daily_orders * features['seasonal_factor']
            base_revenue = expected_daily_orders * features['avg_order_value'] * prediction_period_days
        
        # Apply decision tree adjustments
        adjustment_factor = 1.0
        confidence = 0.5
        
        for prediction_type, weight in predictions:
            adjustment_factor += weight * 0.1
            confidence += abs(weight) * 0.1
        
        # Ensure adjustment factor is reasonable
        adjustment_factor = max(0.1, min(2.0, adjustment_factor))
        confidence = min(1.0, confidence)
        
        predicted_revenue = base_revenue * adjustment_factor
        
        # Generate insights
        insights = self._generate_insights(features, predictions)
        
        return {
            'predicted_revenue': round(predicted_revenue, 2),
            'confidence': round(confidence, 2),
            'base_revenue': round(base_revenue, 2),
            'adjustment_factor': round(adjustment_factor, 2),
            'features': features,
            'predictions': predictions,
            'insights': insights,
            'prediction_period_days': prediction_period_days
        }
    
    def _get_data_period_days(self, orders):
        """Calculate the period covered by the orders data"""
        if not orders:
            return 30
        
        dates = []
        for order in orders:
            created_at = order.get('created_at')
            if isinstance(created_at, str):
                try:
                    created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    dates.append(created_at)
                except:
                    continue
            elif isinstance(created_at, datetime):
                dates.append(created_at)
        
        if not dates:
            return 30
        
        min_date = min(dates)
        max_date = max(dates)
        return (max_date - min_date).days + 1
    
    def _generate_insights(self, features, predictions):
        """Generate business insights based on analysis"""
        insights = []
        
        # Volume insights
        if features['order_count'] > 100:
            insights.append("High order volume indicates strong business performance")
        elif features['order_count'] < 20:
            insights.append("Low order volume - consider marketing initiatives")
        
        # Payment insights
        if features['payment_status_rate'] > 0.9:
            insights.append("Excellent payment success rate")
        elif features['payment_status_rate'] < 0.7:
            insights.append("Payment issues detected - review payment methods")
        
        # Trend insights
        if features['monthly_trend'] > 1000:
            insights.append("Strong upward revenue trend")
        elif features['monthly_trend'] < -1000:
            insights.append("Declining revenue trend - immediate attention needed")
        
        # Retention insights
        if features['customer_retention_rate'] > 0.4:
            insights.append("Good customer retention rate")
        elif features['customer_retention_rate'] < 0.2:
            insights.append("Low customer retention - focus on customer satisfaction")
        
        # Seasonal insights
        if features['seasonal_factor'] > 1.2:
            insights.append("Peak season detected - maximize marketing efforts")
        elif features['seasonal_factor'] < 0.9:
            insights.append("Off-season period - consider promotional strategies")
        
        return insights
