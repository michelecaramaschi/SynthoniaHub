# Synthonia Dashboard - Setup Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL 14+
- Docker & Docker Compose (optional, for containerized PostgreSQL)

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start PostgreSQL (using Docker Compose)

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and update with your values:

```bash
cp .env.example .env.local
```

For local development with Docker PostgreSQL:

```
DATABASE_URL="postgresql://synthonia:synthonia_dev@localhost:5432/synthonia"
NEXTAUTH_SECRET="u+9RE7K2OTR5y6TJBpwvgDU1xCSpY1hARopHmL2VReQ="
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Initialize Database

Generate Prisma client:

```bash
npx prisma generate
```

Run migrations:

```bash
npx prisma migrate dev --name init
```

Seed sample data:

```bash
npm run db:seed
```

Test users created:
- **Admin**: admin@synthonia.com / password123
- **Manager**: manager@synthonia.com / password123
- **Staff**: staff@synthonia.com / password123

### 5. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 and login with test credentials.

## WhatsApp Integration

### Prerequisites

1. WhatsApp Business Account
2. Meta Business App
3. Access to WhatsApp Business API

### Configuration Steps

1. Generate Access Token from Meta Business
2. Get your Business Account ID and Phone Number ID
3. Set in `.env.local`:

```
WHATSAPP_BUSINESS_ACCOUNT_ID=your_id
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token
```

4. Configure webhook:
   - Webhook URL: `https://yourdomain.com/api/whatsapp/webhook`
   - Verify Token: Same as `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   - Subscribe to: `messages` and `message_status_updates`

## Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### Linting

```bash
npm run lint
```

## Building for Production

### Build

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Database Management

### Create Migration

```bash
npx prisma migrate dev --name migration_name
```

### View Data with Prisma Studio

```bash
npx prisma studio
```

## Project Structure

```
src/
├── pages/           # Next.js pages and API routes
├── components/      # React components
├── lib/            # Utilities and business logic
│   ├── auth/       # Authentication
│   ├── whatsapp/   # WhatsApp integration
│   ├── hooks/      # Custom React hooks
│   └── utils/      # Utility functions
├── types/          # TypeScript types
├── styles/         # Global styles
└── prisma/         # Database schema and migrations
```

## Key Features

- ✅ Authentication with NextAuth.js
- ✅ WhatsApp message receiving and parsing
- ✅ Real-time dashboard with widgets
- ✅ Request management and tracking
- ✅ Daily checklists and formula checks
- ✅ Financial data tracking
- ✅ Role-based access control (ADMIN, MANAGER, STAFF)

## API Endpoints

### Authentication

- `POST /api/auth/[...nextauth]` - NextAuth.js handler

### Requests

- `GET /api/requests` - List all requests
- `POST /api/requests` - Create request
- `GET /api/requests/[id]` - Get request details
- `PUT /api/requests/[id]` - Update request

### Financial

- `GET /api/financial/cash` - Get cash metrics
- `GET /api/financial/budget` - Get budget metrics

### Checklists

- `GET /api/checklists/today` - Get today's checklist
- `GET /api/checklists/formula` - Get formula checks
- `POST /api/checklists/[id]` - Complete checklist

### WhatsApp

- `GET /api/whatsapp/webhook` - Verify webhook
- `POST /api/whatsapp/webhook` - Receive messages
- `POST /api/whatsapp/send` - Send message
- `POST /api/whatsapp/sync` - Sync messages

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

Make sure PostgreSQL is running:

```bash
docker-compose ps
docker-compose up -d
```

### NextAuth Issues

Generate a new NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

### Prisma Client Error

Regenerate Prisma client:

```bash
npx prisma generate
```

## Performance Tips

- Enable Redis for session caching (production)
- Use database indexes for frequently queried fields
- Implement request debouncing in frontend
- Cache API responses with SWR or React Query

## Security Checklist

- [ ] Set strong NEXTAUTH_SECRET
- [ ] Use HTTPS in production
- [ ] Configure CSP headers
- [ ] Enable rate limiting on API routes
- [ ] Validate all user input with Zod
- [ ] Keep dependencies updated
- [ ] Review and test RBAC permissions
- [ ] Secure WhatsApp API credentials

## Deployment

### Vercel (Recommended for Next.js)

```bash
npm install -g vercel
vercel login
vercel
```

### Docker

```bash
docker build -t synthonia-dashboard .
docker run -p 3000:3000 synthonia-dashboard
```

### Environment Variables for Production

```
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_SECRET=<strong-random-secret>
NEXTAUTH_URL=https://yourdomain.com
WHATSAPP_BUSINESS_ACCOUNT_ID=xxx
WHATSAPP_PHONE_NUMBER_ID=xxx
WHATSAPP_ACCESS_TOKEN=xxx
WHATSAPP_WEBHOOK_VERIFY_TOKEN=xxx
```

## Support

For issues or questions, please create an issue in the repository.
