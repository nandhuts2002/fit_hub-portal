#!/usr/bin/env python3
import os
import requests
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

def test_razorpay_order():
    """Test Razorpay order creation"""
    
    # Get Razorpay credentials
    razorpay_key_id = os.getenv('RAZORPAY_KEY_ID')
    razorpay_key_secret = os.getenv('RAZORPAY_KEY_SECRET')
    
    print(f"Razorpay Key ID: {razorpay_key_id}")
    print(f"Razorpay Key Secret: {'SET' if razorpay_key_secret else 'NOT SET'}")
    
    if not razorpay_key_id or not razorpay_key_secret:
        print("❌ Razorpay credentials not found!")
        return
    
    # Test order data
    order_data = {
        'amount': 10000,  # ₹100 in paise
        'currency': 'INR',
        'receipt': f'test_event_{int(datetime.now().timestamp())}',
        'notes': {
            'event_id': 'test_event_123',
            'event_title': 'Test Event',
            'user_email': 'test@example.com'
        }
    }
    
    print(f"Order data: {order_data}")
    
    try:
        response = requests.post(
            'https://api.razorpay.com/v1/orders',
            auth=(razorpay_key_id, razorpay_key_secret),
            json=order_data,
            timeout=10
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        print(f"Response text: {response.text}")
        
        if response.status_code == 200:
            order = response.json()
            print(f"✅ Order created successfully: {order}")
        else:
            print(f"❌ Order creation failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_razorpay_order()

