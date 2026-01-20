# SignalStack 📊

**Team Collaboration Intelligence Platform** - A full-stack application for team communication, collaboration analytics, and decision tracking.

## 🎯 Project Overview

SignalStack is a complete team collaboration platform that helps teams communicate effectively and gain insights into their collaboration patterns. The system provides:

- **Team Management** - Create teams, invite members via code or direct invitation
- **Channel-based Communication** - Organized discussions within team channels
- **Real-time Analytics** - Participation metrics, activity patterns, and engagement insights
- **Decision Tracking** - Track and manage team decisions with status updates
- **Role-based Access** - Admins and Members with different capabilities

### Key Features

✅ **Authentication** - Secure login/register with password reset functionality
✅ **Team Management** - Create, join, and manage teams with invite codes
✅ **Channel Messaging** - Real-time messaging within team channels
✅ **Dashboard Analytics** - Metrics and visualizations for team leads
✅ **Decision Tracking** - Extract and track decisions from conversations
✅ **Notifications** - Team invitations, promotions, and updates
✅ **User Profiles** - Personalized settings and profile management

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern UI with hooks
- **React Router v6** - Client-side routing
- **Tailwind CSS v4** - Utility-first styling
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **date-fns** - Date formatting
- **Vite** - Fast build tool

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Prisma 5** - ORM for PostgreSQL
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 📁 Project Structure

```
SignalStack/
├── frontend/
│   ├── public/
│   │   └── logo.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── Analytics/
│   │   │   │   ├── ActivityChart.jsx
│   │   │   │   ├── InsightCard.jsx
│   │   │   │   └── index.js
│   │   │   ├── Layout/
│   │   │   │   ├── Layout.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Header.jsx
│   │   │   │   └── NotificationDropdown.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── Toast.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Teams.jsx
│   │   │   ├── MyChannels.jsx
│   │   │   ├── TeamAnalytics.jsx
│   │   │   ├── ChannelInsights.jsx
│   │   │   ├── UserActivity.jsx
│   │   │   ├── Decisions.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── Help.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   ├── JoinByCode.jsx
│   │   │   └── Home.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── styles/
│   │   │   └── index.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── teamController.js
│   │   │   ├── channelController.js
│   │   │   ├── messageController.js
│   │   │   ├── analyticsController.js
│   │   │   ├── decisionController.js
│   │   │   ├── notificationController.js
│   │   │   └── userController.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── teamService.js
│   │   │   ├── channelService.js
│   │   │   ├── messageService.js
│   │   │   ├── analyticsService.js
│   │   │   ├── decisionService.js
│   │   │   ├── notificationService.js
│   │   │   └── userService.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── teams.js
│   │   │   ├── channels.js
│   │   │   ├── messages.js
│   │   │   ├── analytics.js
│   │   │   ├── decisions.js
│   │   │   ├── notifications.js
│   │   │   └── users.js
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js
│   │   │   ├── errorHandler.js
│   │   │   └── roleAuth.js
│   │   ├── utils/
│   │   │   └── nlp.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file with your database URL
# DATABASE_URL="postgresql://user:password@localhost:5432/signalstack"
# JWT_SECRET="your-secret-key"
# FRONTEND_URL="http://localhost:5173"

# Run Prisma migrations
npx prisma migrate dev

# Seed the database (optional)
npx prisma db seed

# Start the server
npm start
```

The backend will be available at `http://localhost:3000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/register           # Register new user
POST /api/auth/login              # Login user
GET  /api/auth/verify             # Verify token
POST /api/auth/forgot-password    # Request password reset
POST /api/auth/reset-password     # Reset password with token
PUT  /api/auth/change-password    # Change password (authenticated)
PUT  /api/auth/profile            # Update profile (authenticated)
```

### Teams
```
GET  /api/teams                   # Get user's teams
POST /api/teams                   # Create team
GET  /api/teams/:id               # Get team details
GET  /api/teams/:id/members       # Get team members
POST /api/teams/:id/invite        # Send invitation
GET  /api/teams/:id/invite-code   # Get team invite code
POST /api/teams/:id/regenerate-code # Regenerate invite code
GET  /api/teams/preview/:code     # Preview team by invite code
POST /api/teams/join/:code        # Join team via invite code
DELETE /api/teams/:id             # Delete team (soft delete)
```

### Channels
```
GET  /api/channels/team/:teamId   # Get team channels
POST /api/channels/team/:teamId   # Create channel
GET  /api/channels/:id            # Get channel details
GET  /api/channels/:id/messages   # Get channel messages
POST /api/channels/:id/messages   # Send message
```

### Analytics (Admin only)
```
GET  /api/analytics/dashboard     # Dashboard metrics
GET  /api/analytics/team          # Team analytics
GET  /api/analytics/channels      # Channel statistics
GET  /api/analytics/users         # User activity metrics
```

### Decisions
```
GET  /api/decisions               # Get team decisions
POST /api/decisions               # Create decision
PUT  /api/decisions/:id           # Update decision status
```

### Notifications
```
GET  /api/notifications           # Get user notifications
PUT  /api/notifications/:id/read  # Mark as read
PUT  /api/notifications/read-all  # Mark all as read
```

## 📊 Analytics Features

### For Team Admins
- **Dashboard** - Overview of team metrics and activity
- **Team Insights** - Participation patterns and member engagement
- **Channel Stats** - Per-channel activity and trending topics
- **User Activity** - Individual member contributions
- **Decisions** - Track and manage team decisions

### Metrics Tracked
- Message counts and activity trends
- Response latency between messages
- Participation balance across members
- Decision tracking with ownership
- Activity patterns by time

## 👥 User Roles

| Role | Capabilities |
|------|-------------|
| **Admin** | Full access to analytics, team management, channel creation, member management |
| **Member** | View channels, send messages, view personal activity |

*Note: Roles are team-scoped - a user can be an Admin in one team and a Member in another.*

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Protected API routes
- Role-based access control
- Secure password reset flow

## 📄 License

MIT License

---

Built with ❤️ using React, Node.js, and PostgreSQL
