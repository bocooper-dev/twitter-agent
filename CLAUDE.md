# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nuxt AI Chatbot Template application with Twitter integration capabilities. It combines an AI-powered chat interface with authentication, chat history persistence, and support for multiple AI models through Vercel AI Gateway.

## Tech Stack

- **Framework**: Nuxt 4.1.0 with Vue 3
- **UI Components**: Nuxt UI v4 (alpha)
- **AI Integration**: AI SDK v5 with Vercel AI Gateway
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: nuxt-auth-utils with GitHub OAuth
- **Styling**: Tailwind CSS (via Nuxt UI)
- **Package Manager**: pnpm@10.15.1
- **Code Highlighting**: Shiki Stream with MDC (Markdown Components)

## Key Dependencies

### Core Dependencies
- `nuxt`: v4.1.0 - Latest Nuxt framework with full Vue 3 support
- `@nuxt/ui`: v4.0.0-alpha.1 - Modern UI component library
- `@nuxtjs/mdc`: v0.17.3 - Markdown content rendering with Vue components
- `nuxt-auth-utils`: v0.5.23 - Authentication utilities for Nuxt

### AI & Chat
- `ai`: v5.0.30 - Vercel AI SDK for streaming chat responses
- `@ai-sdk/vue`: v2.0.30 - Vue integration for AI SDK
- `@ai-sdk/gateway`: v1.0.15 - AI Gateway for multiple model providers
- `shiki-stream`: v0.1.2 - Streaming code highlighting

### Database
- `drizzle-orm`: v0.44.5 - Type-safe ORM
- `pg`: v8.16.3 - PostgreSQL client
- `drizzle-kit`: v0.31.4 - Database migration toolkit (dev)

### Utilities
- `date-fns`: v4.1.0 - Date manipulation utilities
- Icon sets: `@iconify-json/logos`, `@iconify-json/lucide`, `@iconify-json/simple-icons`

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server (http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Generate static site (if needed)
pnpm generate

# Linting
pnpm lint       # Check for linting issues
pnpm lint:fix   # Auto-fix linting issues

# Type checking
pnpm typecheck  # Run TypeScript type checking

# Database migrations
pnpm db:generate  # Generate migration files from schema changes
pnpm db:migrate   # Apply migrations to database
```

## Architecture

### Directory Structure

```
twitter-agent/
├── app/                    # Vue application layer
│   ├── assets/            # Static assets
│   │   └── css/          # Global styles
│   ├── components/        # Vue components
│   │   ├── prose/        # Markdown rendering components
│   │   ├── DashboardNavbar.vue
│   │   ├── Logo.vue
│   │   ├── ModelSelect.vue
│   │   ├── ModalConfirm.vue
│   │   └── UserMenu.vue
│   ├── composables/       # Reusable Vue composables
│   │   ├── useChats.ts    # Chat list management
│   │   ├── useHighlighter.ts # Code highlighting
│   │   └── useModels.ts   # AI model selection
│   ├── layouts/           # Application layouts
│   │   └── default.vue
│   ├── middleware/        # Route middleware
│   │   └── transitions.global.ts
│   ├── pages/            # File-based routing
│   │   ├── index.vue     # Home/chat list page
│   │   └── chat/
│   │       └── [id].vue  # Individual chat page
│   ├── app.config.ts     # App runtime config
│   ├── app.vue           # Root app component
│   └── error.vue         # Error page component
├── server/                # Nitro server layer
│   ├── api/              # API endpoints
│   │   ├── chats.get.ts  # List chats
│   │   ├── chats.post.ts # Create chat
│   │   └── chats/
│   │       ├── [id].get.ts    # Get chat details
│   │       ├── [id].post.ts   # Send message (streaming)
│   │       └── [id].delete.ts # Delete chat
│   ├── database/         # Database layer
│   │   ├── migrations/   # Database migrations
│   │   └── schema.ts     # Drizzle schema definition
│   ├── routes/           # Server routes
│   │   └── auth/
│   │       └── github.get.ts # GitHub OAuth handler
│   └── utils/            # Server utilities
│       └── drizzle.ts    # Database connection
├── shared/               # Shared types
│   └── types/
│       └── auth.d.ts     # Authentication types
├── nuxt.config.ts        # Nuxt configuration
├── drizzle.config.ts     # Drizzle ORM configuration
├── eslint.config.mjs     # ESLint configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Project dependencies
```

### Key API Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `POST` | `/api/chats` | Create new chat session | Optional |
| `GET` | `/api/chats` | List all chats for user | Optional |
| `GET` | `/api/chats/[id]` | Get chat with messages | Required |
| `POST` | `/api/chats/[id]` | Send message (streaming) | Required |
| `DELETE` | `/api/chats/[id]` | Delete chat and messages | Required |
| `GET` | `/auth/github` | GitHub OAuth callback | N/A |

### Database Schema

The application uses PostgreSQL with Drizzle ORM:

#### Tables

1. **users**
   - `id`: UUID primary key
   - `email`: User email (varchar 255)
   - `name`: Display name (varchar 100)
   - `avatar`: Avatar URL (varchar 500)
   - `username`: GitHub username (varchar 50)
   - `provider`: OAuth provider enum ('github')
   - `providerId`: Provider user ID (varchar 50)
   - `createdAt`: Timestamp
   - Unique index on (provider, providerId)

2. **chats**
   - `id`: UUID primary key
   - `title`: Chat title (varchar 200, nullable)
   - `userId`: Foreign key to users (varchar 36)
   - `createdAt`: Timestamp
   - Index on userId for performance

3. **messages**
   - `id`: UUID primary key
   - `chatId`: Foreign key to chats (varchar 36, cascade delete)
   - `role`: Enum ('user', 'assistant')
   - `parts`: JSON array of message parts
   - `createdAt`: Timestamp
   - Index on chatId for performance

### AI Model Integration

Supported models through Vercel AI Gateway (`app/composables/useModels.ts`):

#### OpenAI Models
- `openai/gpt-5` - Latest GPT-5 model
- `openai/gpt-5-mini` - Smaller, faster GPT-5 variant
- `openai/gpt-4o` - GPT-4 Optimized
- `openai/gpt-4o-mini` - Smaller GPT-4 variant (default)

#### Anthropic Models
- `anthropic/claude-sonnet-4` - Claude 4 Sonnet
- `anthropic/claude-sonnet-3.7` - Claude 3.7 Sonnet

#### Google Models
- `google/gemini-2.5-pro` - Gemini 2.5 Pro
- `google/gemini-2.5-flash` - Gemini 2.5 Flash

Model selection is persisted in cookies and used for all chat interactions.

### Authentication Flow

1. **Anonymous Usage**: Users can create chats without authentication using session ID
2. **GitHub OAuth**: 
   - User clicks login → redirected to GitHub
   - GitHub callback to `/auth/github`
   - User record created/updated in database
   - Anonymous chats transferred to authenticated user
   - Session cookie set with user data

### Key Features

#### Streaming AI Responses
- Uses Vercel AI SDK's `streamText` for real-time responses
- `createUIMessageStream` handles UI updates
- Server-Sent Events (SSE) for client-server communication
- Automatic title generation using GPT-5-nano

#### Message Handling
- Messages stored with role and parts structure
- Support for text, reasoning, and other message types
- Markdown rendering with syntax highlighting
- Copy-to-clipboard functionality

#### Session Management
- Anonymous sessions tracked by session ID
- Authenticated sessions linked to user records
- Chat ownership transfers on login
- Persistent model selection via cookies

## Environment Configuration

Required environment variables (.env.example):

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"

# Session Security (min 32 characters)
NUXT_SESSION_PASSWORD="your-secure-session-password-here"

# GitHub OAuth
NUXT_OAUTH_GITHUB_CLIENT_ID="your-github-oauth-app-id"
NUXT_OAUTH_GITHUB_CLIENT_SECRET="your-github-oauth-secret"

# AI Gateway
AI_GATEWAY_API_KEY="your-vercel-ai-gateway-key"

# Twitter API
TWITTER_API_KEY=""
TWITTER_API_SECRET=""
TWITTER_ACCESS_TOKEN=""
TWITTER_ACCESS_TOKEN_SECRET=""
TWITTER_CALLBACK_URL="http://localhost:3000/api/auth/twitter/callback"
TWITTER_OAUTH2_CLIENT_ID=""
TWITTER_OAUTH2_CLIENT_SECRET=""
TWITTER_DEV_APP_ID=""
TWITTER_DEV_APP_NAME=""
```

## Code Style & Linting

ESLint configuration highlights:
- **Indentation**: Tabs (not spaces)
- **Semicolons**: Not used
- **Quotes**: Single quotes
- **Arrays**: Spacing inside brackets `[ item ]`
- **Objects**: Spacing inside braces `{ key: value }`
- **Vue**: 
  - Max 3 attributes per line
  - HTML indent with tabs
  - Specific element ordering (template → script → style)
- **Imports**: Destructured imports on multiple lines (2+ properties)

Run `pnpm lint:fix` to automatically fix style issues.

## Important Patterns & Best Practices

### Streaming AI Responses
```typescript
// Server-side streaming setup
const stream = createUIMessageStream({
  execute: ({ writer }) => {
    const result = streamText({
      model: gateway(model),
      system: 'System prompt here',
      messages: convertToModelMessages(messages)
    })
    writer.merge(result.toUIMessageStream())
  },
  onFinish: async ({ messages }) => {
    // Save messages to database
  }
})
```

### Database Queries
```typescript
// Type-safe queries with Drizzle
const db = useDrizzle()
const chat = await db.query.chats.findFirst({
  where: (chat, { eq }) => eq(chat.id, chatId),
  with: { messages: true }
})
```

### Client-Server Communication
```typescript
// Client-side chat setup
const chat = new Chat({
  id: chatId,
  messages: initialMessages,
  transport: new DefaultChatTransport({
    api: `/api/chats/${chatId}`,
    body: { model: selectedModel }
  })
})
```

### Component Composition
- Use Nuxt UI components as base
- Extend with custom logic via composables
- Leverage Vue 3 Composition API
- Implement proper TypeScript types

## Nuxt Configuration

Key configuration in `nuxt.config.ts`:
- **Modules**: ESLint, UI, MDC, Auth Utils
- **Experimental**: View transitions enabled
- **Nitro**: OpenAPI generation enabled
- **Vite**: Server build optimizations
- **MDC**: Shiki highlighting with JavaScript engine

## Development Tips

1. **Hot Module Replacement**: Works automatically in dev mode
2. **Type Safety**: Use `pnpm typecheck` regularly
3. **Database Changes**: Always generate migrations after schema changes
4. **API Testing**: Nitro provides OpenAPI docs in development
5. **Component Preview**: Use Nuxt DevTools for component inspection
6. **Performance**: Leverage view transitions for smooth navigation

## Troubleshooting

Common issues and solutions:

1. **Database Connection**: Ensure PostgreSQL is running and DATABASE_URL is correct
2. **Authentication**: Verify GitHub OAuth app settings and callback URL
3. **AI Gateway**: Check API key and rate limits
4. **Type Errors**: Run `nuxt prepare` to regenerate types
5. **Build Issues**: Clear `.nuxt` and `node_modules`, then reinstall
