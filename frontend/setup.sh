#!/bin/bash
# FinSmart Frontend - Quick Start Script

echo "🚀 FinSmart Frontend Setup"
echo "=========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js detected: $(node -v)"
echo "✅ npm detected: $(npm -v)"

# Change to frontend directory
cd "$(dirname "$0")" || exit

echo ""
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Create env file if it doesn't exist
if [ ! -f .env.local ]; then
    echo ""
    echo "📝 Creating .env.local..."
    cp .env.example .env.local
    echo "✅ Created .env.local - update with your backend URL if needed"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start development server, run:"
echo "   npm run dev"
echo ""
echo "📖 Documentation:"
echo "   - README.md        - Project overview"
echo "   - SETUP.md         - Setup & development guide"
echo "   - IMPLEMENTATION.md- Implementation details"
echo "   - OVERVIEW.md      - Visual overview"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:8000"
echo ""
