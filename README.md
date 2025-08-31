# 🎬 MyLife Cinema

Transform your daily diary into personalized movies with AI.

## 🌟 Overview

MyLife Cinema is a revolutionary platform that uses advanced AI technology to convert your daily diary entries into personalized, cinematic experiences. Write about your day, choose a genre, and watch as AI transforms your story into a custom movie complete with visuals, narration, and soundtrack.

### ✨ Key Features

- **AI-Powered Storytelling**: Advanced GPT-4 analysis of your diary entries
- **Multi-Genre Support**: Action, Romance, Comedy, Horror, Sci-Fi, Drama, and more
- **Professional Video Generation**: Integration with Runway ML, Pika Labs, and Stable Video
- **High-Quality Audio**: AI voice synthesis with ElevenLabs and custom soundtracks
- **Real-time Processing**: WebSocket-based progress updates
- **Social Sharing**: Share your movies with friends and family
- **Subscription Tiers**: Flexible pricing from free to professional
- **Mobile & Web**: Cross-platform React application

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Environment Setup

1. **Clone the repository**
```bash
git clone https://github.com/mylife-cinema/mylife-cinema.git
cd mylife-cinema
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

3. **Required API Keys**
```bash
# AI Services
OPENAI_API_KEY=your_openai_key
RUNWAY_API_KEY=your_runway_key
ELEVENLABS_API_KEY=your_elevenlabs_key

# Database & Cache
DATABASE_URL=postgresql://user:pass@localhost:5432/mylife_cinema
REDIS_URL=redis://localhost:6379

# Payment Processing
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Cloud Storage
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
S3_BUCKET=your_s3_bucket_name
```

### Development Setup

1. **Using Docker Compose (Recommended)**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

2. **Manual Setup**
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install

# Run database migrations
npm run db:migrate

# Start backend server
npm run dev

# Start frontend (in another terminal)
cd client && npm start
```

### Production Deployment

```bash
# Build and deploy with Docker
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Or using individual commands
npm run build
npm run start:prod
```

## 🏗️ Architecture

### System Overview
```
Frontend (React) → API Gateway → Backend Services → AI Services
                                      ↓
                              Database (PostgreSQL)
                                      ↓
                              Cache (Redis)
                                      ↓
                              File Storage (S3)
```

### Core Services

- **API Server**: Express.js REST API with WebSocket support
- **Video Service**: AI video generation and processing
- **Audio Service**: Voice synthesis and music generation
- **Database**: PostgreSQL with Supabase
- **Cache**: Redis for performance optimization
- **Storage**: AWS S3 for video and asset storage
- **Queue**: Background job processing

### AI Integration

1. **GPT-4**: Story analysis and script generation
2. **Runway ML**: Primary video generation
3. **Pika Labs**: Alternative video generation
4. **Stable Video**: Backup video generation
5. **ElevenLabs**: Voice synthesis and narration
6. **Mubert**: Background music generation

## 📱 Frontend Architecture

### Technology Stack

- **React 18**: Modern React with hooks
- **Chakra UI**: Component library with dark theme
- **React Query**: Data fetching and state management
- **React Router**: Client-side routing
- **Socket.io Client**: Real-time updates
- **Vite**: Fast development build tool

### Key Components

```
src/
├── components/
│   ├── Layout/           # App layout and navigation
│   ├── Dashboard/        # Dashboard widgets
│   ├── Movie/           # Movie player and controls
│   ├── Diary/           # Diary editor and viewer
│   └── UI/              # Reusable UI components
├── pages/               # Page components
├── contexts/            # React contexts (Auth, Socket)
├── hooks/               # Custom React hooks
├── utils/               # Utilities and API calls
└── styles/              # CSS and theme files
```

## 🔧 Backend Architecture

### API Structure

```
src/
├── routes/              # Express route handlers
│   ├── auth.js         # Authentication endpoints
│   ├── diary.js        # Diary CRUD operations
│   ├── movie.js        # Movie generation and management
│   ├── user.js         # User profile management
│   └── payment.js      # Stripe integration
├── services/           # Business logic services
│   ├── aiService.js    # AI integration layer
│   ├── videoService.js # Video generation pipeline
│   └── paymentService.js # Payment processing
├── middleware/         # Express middleware
├── config/            # Configuration files
└── utils/             # Utility functions
```

### Database Schema

Key tables:
- `users`: User accounts and subscription info
- `diary_entries`: User diary entries with metadata
- `movies`: Generated movies with processing status
- `subscriptions`: Stripe subscription management
- `usage_tracking`: API usage and analytics

## 🎬 Movie Generation Pipeline

### Step-by-Step Process

1. **Diary Analysis**
   - Extract emotions, themes, and characters
   - Identify key events and settings
   - Determine optimal genre suggestions

2. **Script Generation**
   - Create compelling narrative arc
   - Generate dialogue and scene descriptions
   - Add camera directions and visual cues

3. **Video Production**
   - Generate scene-by-scene video clips
   - Create transitions and effects
   - Composite final movie timeline

4. **Audio Production**
   - Synthesize narration and dialogue
   - Generate custom soundtrack
   - Mix and master final audio

5. **Post-Processing**
   - Combine video and audio tracks
   - Add titles and credits
   - Optimize for web delivery

### Quality Assurance

- Multi-service fallbacks for reliability
- Real-time progress tracking
- Automated quality checks
- Human review for premium tiers

## 💳 Subscription & Pricing

### Tiers

| Feature | Free | Basic ($9.99/mo) | Premium ($19.99/mo) | Professional ($39.99/mo) |
|---------|------|------------------|---------------------|--------------------------|
| Movies/day | 1 | 5 | Unlimited | Unlimited |
| Video Quality | 720p | 1080p | 4K | 4K + HDR |
| Duration | 5 min | 15 min | 30 min | 60 min |
| Genres | 3 | All | All + Custom | All + Custom |
| Sharing | Private | Public | Public + Analytics | Public + API |

### Payment Integration

- Stripe for payment processing
- Automatic subscription management
- Usage-based billing for enterprise
- International payment support

## 📊 Monitoring & Analytics

### Performance Monitoring

- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **ELK Stack**: Log aggregation and analysis
- **Sentry**: Error tracking and alerts

### Business Analytics

- User engagement tracking
- Movie generation metrics
- Subscription analytics
- Revenue reporting

## 🔒 Security & Privacy

### Security Measures

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting and DDOS protection
- Input validation and sanitization
- HTTPS enforcement

### Privacy Protection

- GDPR compliant data handling
- User data encryption
- Secure file storage
- Privacy-first analytics

## 🚀 Deployment

### Development
```bash
docker-compose up -d
```

### Staging
```bash
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
```

### Production
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### CI/CD Pipeline

- GitHub Actions for automated testing
- Docker image building and pushing
- Automated deployment to staging
- Manual promotion to production

## 🧪 Testing

### Backend Testing
```bash
npm test                 # Run all tests
npm run test:unit       # Unit tests
npm run test:integration # Integration tests
npm run test:e2e        # End-to-end tests
```

### Frontend Testing
```bash
cd client
npm test                # Run React tests
npm run test:e2e       # Cypress tests
```

## 📈 Performance

### Optimization Strategies

- Redis caching for frequent queries
- CDN for static asset delivery
- Database query optimization
- Background job processing
- Image and video compression

### Scaling Considerations

- Horizontal API server scaling
- Database read replicas
- Microservices architecture ready
- Auto-scaling with Kubernetes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow ESLint and Prettier configurations
- Write comprehensive tests
- Update documentation
- Follow conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♀️ Support

- **Documentation**: [docs.mylifecinema.com](https://docs.mylifecinema.com)
- **Community**: [Discord](https://discord.gg/mylifecinema)
- **Issues**: [GitHub Issues](https://github.com/mylife-cinema/mylife-cinema/issues)
- **Email**: support@mylifecinema.com

## 🗺️ Roadmap

### Q1 2024
- [ ] Core platform launch
- [ ] Mobile app development
- [ ] Advanced AI features

### Q2 2024
- [ ] Social features and sharing
- [ ] Template marketplace
- [ ] Advanced analytics

### Q3 2024
- [ ] Enterprise features
- [ ] API for developers
- [ ] International expansion

### Q4 2024
- [ ] AR/VR integration
- [ ] Real-time collaboration
- [ ] AI voice cloning

---

**Made with ❤️ by the MyLife Cinema team**

*Transforming everyday stories into cinematic masterpieces*