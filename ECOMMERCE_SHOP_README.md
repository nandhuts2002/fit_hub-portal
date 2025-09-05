# FitHub E-commerce Shop System

## Overview
A comprehensive, professional e-commerce system for fitness items built with React, Tailwind CSS, and MongoDB. Features a modern, responsive UI with advanced shopping functionality.

## Features

### 🛍️ Shopping Experience
- **Product Catalog**: Browse fitness products with detailed information
- **Advanced Filtering**: Filter by category, price range, brand, and ratings
- **Search Functionality**: Real-time search across product names and brands
- **Product Variants**: Support for different sizes, colors, and options
- **Product Reviews**: Customer rating and review system
- **Wishlist**: Save favorite products for later
- **Shopping Cart**: Add, remove, and manage cart items with quantity controls

### 🎨 UI/UX Features
- **Modern Design**: Clean, professional interface with Tailwind CSS
- **Responsive Layout**: Mobile-first design that works on all devices
- **Interactive Components**: Smooth animations with Framer Motion
- **Product Modal**: Detailed product view with variants and features
- **Grid/List Views**: Toggle between different product display modes
- **Loading States**: Professional loading indicators
- **Empty States**: Helpful messages when no products are found

### 🛒 E-commerce Functionality
- **Inventory Management**: Real-time stock tracking
- **Order Management**: Complete order processing system
- **Coupon System**: Discount codes and promotional offers
- **Shipping Calculator**: Dynamic shipping cost calculation
- **Payment Integration**: Ready for payment gateway integration
- **Order History**: Track past purchases

## Technical Stack

### Frontend
- **React 18**: Modern React with hooks
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **Lucide React**: Beautiful icon library
- **Responsive Design**: Mobile-first approach

### Backend
- **Flask**: Python web framework
- **MongoDB**: NoSQL database for scalability
- **JWT Authentication**: Secure user authentication
- **RESTful API**: Clean API design

## File Structure

```
client/src/
├── components/
│   ├── ProductCard.jsx          # Reusable product card component
│   ├── FilterSidebar.jsx        # Product filtering sidebar
│   ├── ProductModal.jsx         # Detailed product view modal
│   └── CartSidebar.jsx          # Shopping cart sidebar
├── pages/
│   └── ShopPage.jsx             # Main shop page with all functionality
└── utils/
    └── api.js                   # API utility functions

server/
├── shop.py                      # E-commerce API endpoints
├── models.py                    # MongoDB collections and models
└── app.py                       # Flask application setup
```

## API Endpoints

### Products
- `GET /api/products` - Get all products with filtering and pagination
- `GET /api/products/<id>` - Get single product details
- `GET /api/categories` - Get product categories

### Cart Management
- `GET /api/cart/<user_email>` - Get user's cart
- `POST /api/cart/<user_email>/add` - Add item to cart
- `PUT /api/cart/<user_email>/update` - Update cart item quantity
- `DELETE /api/cart/<user_email>/remove` - Remove item from cart
- `DELETE /api/cart/<user_email>/clear` - Clear entire cart

### Wishlist
- `GET /api/wishlist/<user_email>` - Get user's wishlist
- `POST /api/wishlist/<user_email>/toggle` - Toggle wishlist item

### Orders
- `GET /api/orders/<user_email>` - Get user's order history
- `POST /api/orders` - Create new order

### Reviews
- `GET /api/products/<id>/reviews` - Get product reviews
- `POST /api/products/<id>/reviews` - Add product review

### Coupons
- `POST /api/coupons/validate` - Validate coupon code

## MongoDB Collections

### Core Collections
- **products**: Product information, variants, and metadata
- **categories**: Product categories and descriptions
- **carts**: User shopping carts
- **wishlists**: User wishlists
- **orders**: Order history and tracking
- **order_items**: Individual items in orders
- **reviews**: Product reviews and ratings
- **inventory**: Stock management
- **coupons**: Discount codes and promotions
- **addresses**: User shipping addresses
- **payment_methods**: Saved payment methods
- **shipping**: Shipping rates and zones

## Getting Started

### Prerequisites
- Node.js 16+
- Python 3.8+
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Fit-hub-portal
   ```

2. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../server
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   # Create .env file in server directory
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   SECRET_KEY=your_secret_key
   ```

5. **Start the backend server**
   ```bash
   cd server
   python app.py
   ```

6. **Start the frontend development server**
   ```bash
   cd client
   npm start
   ```

7. **Initialize shop data**
   ```bash
   # Make a POST request to initialize sample data
   curl -X POST http://localhost:5000/shop/api/init-shop-data
   ```

## Usage

### For Users
1. **Browse Products**: Use the search bar and filters to find products
2. **View Details**: Click "View" to see detailed product information
3. **Add to Cart**: Add products to your shopping cart
4. **Manage Cart**: Update quantities or remove items from cart
5. **Add to Wishlist**: Save products for later purchase
6. **Checkout**: Proceed to checkout when ready to purchase

### For Developers
1. **Add Products**: Use the API to add new products to the database
2. **Customize UI**: Modify components in the `client/src/components/` directory
3. **Extend API**: Add new endpoints in `server/shop.py`
4. **Database Management**: Use MongoDB tools to manage collections

## Key Features Explained

### Product Filtering
- **Category Filter**: Filter products by category (Weights, Yoga, Supplements, etc.)
- **Price Range**: Set minimum and maximum price filters
- **Search**: Real-time search across product names and brands
- **Sorting**: Sort by price, rating, or newest first

### Shopping Cart
- **Persistent Cart**: Cart persists across browser sessions
- **Quantity Management**: Increase/decrease item quantities
- **Variant Support**: Handle different product variants (size, color, etc.)
- **Real-time Updates**: Cart updates immediately when items are added/removed

### Product Variants
- **Multiple Options**: Support for size, color, flavor, etc.
- **Price Variations**: Different prices for different variants
- **Stock Management**: Track inventory for each variant
- **Visual Selection**: Easy-to-use variant selection interface

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Flexible Layout**: Adapts to different screen sizes
- **Touch-Friendly**: Large buttons and touch targets
- **Fast Loading**: Optimized for performance

## Customization

### Styling
- Modify Tailwind classes in components
- Update color scheme in `tailwind.config.js`
- Add custom animations with Framer Motion

### Functionality
- Add new product filters
- Implement additional payment methods
- Add product comparison feature
- Integrate with external APIs

### Database
- Add new product fields
- Create additional collections
- Implement data validation
- Add database indexes for performance

## Performance Optimizations

- **Lazy Loading**: Components load only when needed
- **Image Optimization**: Optimized product images
- **API Caching**: Efficient API response caching
- **Bundle Splitting**: Code splitting for faster loading
- **Database Indexing**: Optimized database queries

## Security Features

- **JWT Authentication**: Secure user authentication
- **Input Validation**: Server-side input validation
- **CORS Protection**: Cross-origin request protection
- **SQL Injection Prevention**: MongoDB query protection
- **XSS Protection**: Client-side XSS prevention

## Future Enhancements

- **Payment Gateway Integration**: Stripe, PayPal, Razorpay
- **Advanced Analytics**: User behavior tracking
- **Recommendation Engine**: AI-powered product recommendations
- **Multi-language Support**: Internationalization
- **Admin Dashboard**: Complete admin management system
- **Mobile App**: React Native mobile application
- **Real-time Notifications**: WebSocket integration
- **Advanced Search**: Elasticsearch integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ for the fitness community**

