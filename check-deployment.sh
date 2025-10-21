#!/bin/bash

echo "🚀 Fit Hub Portal - Render Deployment Checker"
echo "=============================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if git is initialized
echo "📦 Checking Git repository..."
if [ -d ".git" ]; then
    echo -e "${GREEN}✓ Git repository found${NC}"
else
    echo -e "${RED}✗ No Git repository found${NC}"
    echo "  Run: git init"
fi

# Check for requirements.txt
echo ""
echo "📋 Checking Python dependencies..."
if [ -f "requirements.txt" ]; then
    echo -e "${GREEN}✓ requirements.txt found${NC}"
else
    echo -e "${RED}✗ requirements.txt not found${NC}"
fi

# Check for package.json
echo ""
echo "📋 Checking Node.js dependencies..."
if [ -f "client/package.json" ]; then
    echo -e "${GREEN}✓ client/package.json found${NC}"
else
    echo -e "${RED}✗ client/package.json not found${NC}"
fi

# Check for .env.example
echo ""
echo "🔐 Checking environment configuration..."
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✓ .env.example found${NC}"
else
    echo -e "${YELLOW}⚠ .env.example not found${NC}"
fi

# Check .gitignore
echo ""
echo "🔒 Checking .gitignore..."
if [ -f ".gitignore" ]; then
    if grep -q ".env" ".gitignore"; then
        echo -e "${GREEN}✓ .gitignore contains .env${NC}"
    else
        echo -e "${RED}✗ .gitignore missing .env entry${NC}"
    fi
else
    echo -e "${RED}✗ .gitignore not found${NC}"
fi

# Check for render.yaml
echo ""
echo "⚙️  Checking Render configuration..."
if [ -f "render.yaml" ]; then
    echo -e "${GREEN}✓ render.yaml found${NC}"
else
    echo -e "${YELLOW}⚠ render.yaml not found (optional)${NC}"
fi

echo ""
echo "=============================================="
echo "📝 Pre-Deployment Checklist:"
echo "=============================================="
echo ""
echo "Before deploying to Render, ensure:"
echo "  1. ☐ MongoDB Atlas URI is ready"
echo "  2. ☐ MongoDB Network Access allows 0.0.0.0/0"
echo "  3. ☐ Code is pushed to GitHub"
echo "  4. ☐ No .env files in repository"
echo "  5. ☐ RapidAPI key ready (optional)"
echo ""
echo "=============================================="
echo "🎯 Next Steps:"
echo "=============================================="
echo ""
echo "1. Push to GitHub:"
echo "   git add ."
echo "   git commit -m \"Ready for Render deployment\""
echo "   git push origin main"
echo ""
echo "2. Follow the guide: RENDER_DEPLOYMENT_STEPS.md"
echo ""
echo "3. Configure environment variables on Render"
echo ""
echo "Good luck! 🚀"
