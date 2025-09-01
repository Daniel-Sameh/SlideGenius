# SlideGenius

Transform your ideas into stunning presentations with AI-suggested themes and professional layouts. Just paste your markdown, and watch the magic happen.

## 🚀 Live Demo

**Try SlideGenius now:** [https://slide-genius-green.vercel.app/](https://slide-genius-green.vercel.app/)

- **Frontend**: Deployed on Vercel
- **Backend API**: Deployed on Railway at [https://slidegenius-production.up.railway.app](https://slidegenius-production.up.railway.app)
- **Database**: Supabase PostgreSQL with real-time features

## Features

- **AI-Powered Enhancement**: Automatically improves markdown content for better presentation flow
- **Smart Theme Selection**: AI suggests optimal themes based on content analysis
- **Real-time Preview**: Live preview of generated slides
- **Multiple Export Options**: Download as HTML or view in fullscreen
- **User Authentication**: Secure login with Supabase integration
- **Presentation Management**: Save, edit, and organize your presentations
- **Responsive Design**: Works seamlessly across devices

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: Database ORM
- **LangGraph**: AI workflow orchestration
- **Groq API**: LLM integration for content enhancement
- **Supabase**: Authentication and database
- **Reveal.js**: Presentation framework

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Modern UI components
- **React Query**: Data fetching and caching

## Project Structure

```
SlideGenius/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── llm/            # LangGraph pipeline
│   │   ├── services/       # Business logic
│   │   └── models.py       # Database models
│   └── requirements.txt
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   └── services/      # API clients
│   └── package.json
└── db/                    # Database migrations
    └── supabase/
```

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 18+
- Supabase account
- Groq API key

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Create `.env` file**:
   ```bash
   # Database
   DATABASE_URL=your_supabase_db_url
   
   # Supabase
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
   SUPABASE_JWT_SECRET=your_jwt_secret
   
   # AI Services
   GROQ_API_KEY=your_groq_api_key
   
   # CORS
   ALLOWED_ORIGINS=http://localhost:3000
   ```

5. **Run the backend**:
   ```bash
   python run.py
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env.local` file**:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Run the frontend**:
   ```bash
   npm run dev
   ```

### Database Setup

1. **Create Supabase project** at [supabase.com](https://supabase.com)

2. **Run migrations**:
   ```bash
   cd db
   npx supabase db push
   ```

## Usage

### Creating Presentations

1. **Sign up/Login** to your account
2. **Click "Create New Presentation"** from dashboard
3. **Enter title** and **paste markdown content**
4. **Click "Generate Presentation"** to create slides
5. **Preview** in real-time or **export** as HTML

### Markdown Format

Use standard markdown with slide separators:

```markdown
# Title Slide
Your presentation title

---

## Slide 2
- Bullet point 1
- Bullet point 2

---

## Slide 3
**Bold text** and *italic text*
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/token` - User login
- `GET /api/auth/me` - Get current user

### Presentations
- `POST /api/presentations/generate` - Start presentation generation
- `GET /api/presentations/{id}/status` - Check generation status
- `GET /api/presentations` - List user presentations
- `GET /api/presentations/{id}` - Get specific presentation
- `PUT /api/presentations/{id}` - Update presentation
- `DELETE /api/presentations/{id}` - Delete presentation

## Architecture

### AI Pipeline (LangGraph)

1. **Suggest & Improve Node**: Enhances markdown content and suggests themes
2. **Generate HTML Node**: Converts markdown to Reveal.js HTML
3. **Persist Node**: Saves presentation to database

### Authentication Flow

1. User registers/logs in via Supabase Auth
2. JWT token stored in HTTP-only cookies
3. Protected routes require valid authentication

### Data Flow

1. User submits markdown content
2. Backend creates presentation record
3. AI pipeline processes content asynchronously
4. Frontend polls for completion status
5. Generated HTML returned to user

## Environment Variables

### Backend (.env)
```bash
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=...
GROQ_API_KEY=gsk_...
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (.env.local)
```bash
# For local development
NEXT_PUBLIC_API_URL=http://localhost:8000

# For production (Vercel)
NEXT_PUBLIC_API_URL=https://slidegenius-production.up.railway.app
```

## Deployment

### Live Deployment Status
- ✅ **Backend**: Railway - [https://slidegenius-production.up.railway.app](https://slidegenius-production.up.railway.app)
- ✅ **Frontend**: Vercel - [https://slide-genius-green.vercel.app/](https://slide-genius-green.vercel.app/)
- ✅ **Database**: Supabase PostgreSQL

### Backend Deployment (Railway)
1. Connect GitHub repository to Railway
2. Set environment variables:
   ```bash
   DATABASE_URL=your_supabase_db_url
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
   SUPABASE_JWT_SECRET=your_jwt_secret
   GROQ_API_KEY=your_groq_api_key
   ALLOWED_ORIGINS=https://slide-genius-green.vercel.app
   ```
3. Ensure Procfile is configured: `web: uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Deploy automatically on push to main branch

### Frontend Deployment (Vercel)
1. Connect GitHub repository to Vercel
2. Set environment variable:
   ```bash
   NEXT_PUBLIC_API_URL=https://slidegenius-production.up.railway.app
   ```
3. Deploy automatically on push to main branch
4. Custom domain configured at slide-genius-green.vercel.app

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## License

MIT License - see LICENSE file for details
