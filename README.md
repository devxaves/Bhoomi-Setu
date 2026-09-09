# FRA Atlas & DSS v2.0 🌲

Enhanced AI-powered Forest Rights Act Atlas & Decision Support System with advanced OCR + NER, Bhuvan WebGIS integration, satellite asset mapping, and intelligent policy simulation.

## 🚀 New in Version 2.0

- **Enhanced OCR + NER Pipeline**: AI-powered entity extraction from FRA documents
- **Bhuvan WebGIS Integration**: Indian satellite imagery and topographic layers
- **AI Asset Mapping**: Computer vision for satellite image classification
- **Advanced DSS Engine**: Rule-based system with policy simulation
- **Digital Archive**: Searchable claims database with advanced filtering
- **Real-time Analytics**: Comprehensive KPIs and progress tracking

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router, TypeScript), TailwindCSS v4
- **Authentication**: Clerk (complete user management)
- **Database**: PostgreSQL with Prisma ORM
- **Maps**: MapLibre GL JS with Bhuvan WMTS layers
- **AI/ML**: Tesseract.js (OCR), HuggingFace Transformers (NER), Computer Vision APIs
- **Charts**: Custom Tailwind-based visualizations
- **Data Fetching**: SWR for client-side state management

## 📋 Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZGlyZWN0LW1vbGUtNC5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_qbbRDrPVVtB3kq4ye7shRLhChJLMlBIwAi6pN4E1m7

# Database
DATABASE_URL=postgresql://neondb_owner:npg_sVya1twpTW0j@ep-summer-mud-a14088y5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Environment
NODE_ENV=development

# AI Services (Optional - for enhanced features)
HUGGINGFACE_API_KEY=your_huggingface_key_here
\`\`\`

## 🚀 Quick Start

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Database Setup
\`\`\`bash
# Run Prisma migrations
npx prisma migrate dev --name init

# Optional: Open Prisma Studio
npx prisma studio
\`\`\`

### 3. Start Development Server
\`\`\`bash
npm run dev
\`\`\`

### 4. Access the Application
- Visit `http://localhost:3000`
- Sign up/Sign in via Clerk authentication
- Explore the enhanced features from the landing page

## 🏗️ Application Architecture

### Core Modules

#### 🏠 **Landing Page**
Enhanced hub with feature cards and capability highlights

#### 📊 **Dashboard** 
- Real-time KPIs and analytics
- Claims processing statistics
- Asset distribution charts
- Monthly trend analysis
- Progress tracking widgets

#### 📄 **Upload & OCR**
- Multi-format document upload (PDF, JPEG, PNG)
- Enhanced OCR with Tesseract.js
- NER entity extraction (persons, locations, organizations)
- Automatic field parsing and validation
- Direct claim creation from extracted data

#### 🗺️ **FRA Atlas**
- Interactive MapLibre GL maps
- Bhuvan WebGIS layer integration:
  - Satellite imagery
  - Topographic maps  
  - Forest cover data
- Advanced filtering by village, type, status
- Interactive popups with claim/asset details
- Real-time data visualization

#### 🤖 **DSS Engine**
- Rule-based decision support system
- Policy threshold configuration
- Simulation mode for policy testing
- Priority-based recommendations
- CSV export functionality
- Statistical analysis and reporting

#### 📚 **Digital Archive**
- Advanced search and filtering
- Full-text search across claims
- Date range filtering
- Status and type categorization
- Bulk operations support

#### ⚙️ **Admin Panel**
- Claims and assets management
- AI-detected asset summaries
- System configuration
- Data import/export tools

### 🔐 Security & Authentication

- **Route Protection**: Middleware-based authentication for all routes
- **API Security**: Server-side authentication checks for all mutations
- **Data Validation**: Comprehensive input validation and sanitization
- **Role-based Access**: Admin-level controls for sensitive operations

### 🗄️ Database Schema

\`\`\`prisma
model Claim {
  id        Int      @id @default(autoincrement())
  claimant  String
  village   String
  type      String   // IFR, CR, CFR
  area      Float
  status    String   // Pending, Granted, Rejected
  coords    Json     // GeoJSON Point
  nerData   Json?    // NER extracted entities
  createdAt DateTime @default(now())
  userId    String
}

model Asset {
  id        Int      @id @default(autoincrement())
  name      String
  owner     String?
  type      String   // water, forest, agriculture, settlement
  coords    Json     // GeoJSON Point
  village   String?
  source    String?  // Manual, Satellite
  createdAt DateTime @default(now())
}

model DSSRecommendation {
  id        Int      @id @default(autoincrement())
  claimId   Int
  scheme    String
  reason    String
  priority  Int      // 1=High, 2=Medium, 3=Low
  createdAt DateTime @default(now())
}
\`\`\`

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Database Options
- **Neon** (Recommended): Serverless PostgreSQL
- **Supabase**: Full-stack platform with PostgreSQL
- **Railway**: Simple PostgreSQL hosting
- **Local**: PostgreSQL with Docker

### Required Environment Variables in Production
- Set all environment variables in your deployment platform
- Ensure `DATABASE_URL` points to your production database
- Configure Clerk keys for your production domain

## 🔧 Development Scripts

\`\`\`bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npx prisma studio    # Open database browser
npx prisma migrate dev # Run migrations
npx prisma generate  # Generate Prisma client

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript checking
\`\`\`

## 🌟 Key Features

### AI-Powered Document Processing
- Advanced OCR with confidence scoring
- Named Entity Recognition for automatic field extraction
- Support for multiple document formats
- Intelligent data validation and correction

### Geospatial Intelligence
- Integration with Indian Space Research Organisation (ISRO) Bhuvan services
- Real-time satellite imagery and topographic data
- AI-powered asset classification from satellite images
- Advanced spatial filtering and analysis

### Decision Support System
- Rule-based recommendation engine
- Policy simulation and threshold testing
- Priority-based claim processing
- Statistical analysis and reporting

### Performance Optimizations
- Server-side rendering for SEO and performance
- Client-side caching with SWR
- Optimized database queries with Prisma
- Lazy loading for maps and heavy components

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the GitHub Issues page
2. Review the documentation
3. Contact the development team

---

**Built with ❤️ for Forest Rights Act digitization and governance**
