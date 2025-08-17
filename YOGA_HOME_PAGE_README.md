# Yoga User Home Page - FitFusion Yoga

## Overview
A professional, responsive Yoga User Home Page built with React, featuring a modern, minimal, and wellness-focused design. The page provides a serene and inspiring interface for yoga practitioners to explore tutorials, connect with trainers, and access wellness content.

## 🎨 Design Features

### Color Palette
- **Mint Green** (`#a7f3d0`) - Primary wellness color
- **Lavender** (`#c4b5fd`) - Secondary calming color  
- **Sage Green** (`#84cc16`) - Accent color for nature elements
- **Beige/Light Cream** (`#f5f5dc`, `#fefcf3`) - Background colors
- **Coral** (`#fda4af`) - Highlight color for advanced content

### Typography
- **Primary Font**: Poppins (Google Fonts)
- **Secondary Font**: Nunito (Google Fonts)
- Clean, readable typography with proper hierarchy

### Design Elements
- Rounded corners (0.5rem to 2rem radius)
- Soft shadows with subtle depth
- Smooth animations and hover effects
- Fully responsive design with mobile-first approach

## 🏗️ Components Structure

### 1. Header/NavBar
- **Logo**: "FitFusion Yoga" with leaf icon
- **Navigation**: Home, Tutorials, Trainers, Shop, Profile
- **Search Bar**: Integrated search functionality
- **User Menu**: Profile avatar with dropdown

### 2. Hero Section
- Full-width background image with overlay
- Inspiring headline: "Find Your Inner Balance"
- Motivational subtitle text
- Call-to-action button: "Start a Tutorial"

### 3. Upcoming Tutorials
- Grid layout of tutorial cards
- Each card includes:
  - High-quality yoga pose images
  - Tutorial title and instructor name
  - Duration, difficulty level, and ratings
  - Student count and "Watch Now" button
  - Hover effects with play button overlay

### 4. Featured Trainers
- Trainer profile cards with:
  - Professional headshot photos
  - Name and specialty (e.g., "Hatha & Meditation")
  - Short bio describing experience
  - Rating and student count
  - "Follow" button with heart icon

### 5. Wellness Articles
- Blog-style article cards featuring:
  - Featured images
  - Article titles and preview text
  - Category tags (Breathwork, Lifestyle, Sleep)
  - Read time estimates
  - "Read More" buttons

### 6. Footer
- **Company Info**: Logo and description
- **Quick Links**: Navigation menu
- **Support**: Help center and contact info
- **Newsletter**: Email subscription form
- **Social Media**: Instagram, Facebook, Twitter, YouTube icons
- **Contact**: Email and phone information

## 🚀 Features

### Responsive Design
- **Desktop**: Full grid layouts with hover effects
- **Tablet**: Responsive grid adjustments
- **Mobile**: Single-column stacking with touch-friendly buttons

### Interactive Elements
- Smooth hover animations on cards and buttons
- Play button overlays on tutorial images
- Gradient backgrounds and soft shadows
- Animated navigation toggle between Fitness and Yoga modes

### Navigation System
- **Yoga Navigation Component**: Toggle between regular fitness home and yoga home
- Fixed positioning with backdrop blur effect
- Mobile-responsive with icon-only view

## 📁 File Structure

```
client/src/
├── pages/
│   └── YogaUserHomePage.js          # Main yoga home page component
├── components/
│   └── YogaNavigation.js            # Navigation toggle component
└── styles/
    ├── YogaUserHomePage.css         # Main yoga page styles
    └── YogaNavigation.css           # Navigation toggle styles
```

## 🛠️ Technical Implementation

### Dependencies Used
- **React** (19.1.1) - Core framework
- **React Router DOM** (7.7.1) - Navigation
- **React Icons** (5.5.0) - Icon library
- **CSS3** - Custom styling with CSS variables

### Key CSS Features
- CSS Custom Properties (variables) for consistent theming
- Flexbox and CSS Grid for responsive layouts
- CSS animations and transitions
- Backdrop filters for modern glass effects
- Mobile-first responsive design

### State Management
- React hooks (useState, useEffect)
- Session management integration
- Mock data for tutorials, trainers, and articles

## 🎯 Usage

### Accessing the Yoga Home Page
1. Navigate to `/yoga-home` route (protected route requiring user authentication)
2. Use the navigation toggle to switch between fitness and yoga modes
3. Available from both `/user-home` and `/yoga-home` pages

### Navigation Toggle
- Fixed position toggle in top-right corner
- Switch between "Fitness Home" and "Yoga Home"
- Responsive design adapts to mobile screens
- Only visible on user dashboard pages

## 🔮 Future Enhancements

### Planned Features
1. **Video Integration**: Embedded yoga tutorial videos
2. **Live Classes**: Real-time streaming capabilities
3. **Progress Tracking**: Personal yoga journey analytics
4. **Community Features**: User reviews and social interactions
5. **Personalization**: AI-recommended content based on preferences
6. **Booking System**: Schedule private sessions with trainers
7. **E-commerce**: Yoga equipment and merchandise shop

### Technical Improvements
1. **Backend Integration**: Connect to real API endpoints
2. **Authentication**: Enhanced user management
3. **Performance**: Image optimization and lazy loading
4. **Accessibility**: WCAG compliance improvements
5. **PWA Features**: Offline functionality and push notifications

## 🎨 Design Philosophy

The Yoga User Home Page embodies the principles of mindfulness and wellness through its design:

- **Serenity**: Soft colors and gentle gradients create a calming atmosphere
- **Balance**: Harmonious layout with proper white space and visual hierarchy
- **Nature**: Organic shapes, leaf icons, and earth-tone colors
- **Accessibility**: High contrast ratios and readable typography
- **Mindfulness**: Clean, distraction-free interface promoting focus

## 📱 Mobile Experience

The mobile experience is carefully crafted with:
- Touch-friendly button sizes (minimum 44px)
- Simplified navigation with icon-only toggles
- Optimized image sizes for faster loading
- Vertical stacking of content sections
- Gesture-friendly interactions

This yoga home page provides users with an inspiring and functional platform to begin or continue their yoga journey, combining beautiful design with practical functionality.