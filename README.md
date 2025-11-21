# Twitter Auto-Poster AI Agent for Musicians

[![Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)

An AI-powered Twitter content generator designed specifically for musicians. Configure your artist profile once, and the AI generates authentic, on-brand tweets that match your voice, genre, and target audience. Select your favorite from 3 variants and post directly to Twitter.

## Features

- **Artist Profile System** - Configure your genre, age, instruments, target audience, and voice tone
- **16 Voice Tones** - Professional, fun, edgy, dramatic, romantic, whimsical, quirky, absurd, sarcastic, poetic, mysterious, inspirational, nostalgic, humorous, casual, or apathetic
- **3 Tweet Variants** - Each generation produces 3 unique approaches based on your tone
- **Twitter Integration** - OAuth authentication and one-click posting
- **Chat Interface** - Conversational flow for generating and refining content
- **Multiple AI Models** - Powered by [AI SDK v5](https://sdk.vercel.ai) with Vercel AI Gateway support

## How It Works

1. **Start a Chat** - Create a new conversation
2. **Configure Profile** - Fill out your artist profile (genre, instruments, audience, tone)
3. **Generate Tweets** - AI creates 3 tweet variants tailored to your voice
4. **Select & Post** - Pick your favorite and post directly to Twitter

## Tech Stack

- **Framework**: [Nuxt 4](https://nuxt.com) with Vue 3
- **UI**: [Nuxt UI v4](https://ui.nuxt.com)
- **AI**: [AI SDK v5](https://sdk.vercel.ai) with Vercel AI Gateway
- **Twitter**: [twitter-api-v2](https://github.com/PLhery/node-twitter-api-v2)
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team)
- **Auth**: [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils)

## Setup

Install dependencies:

```bash
pnpm install
```

Create a `.env` file with your configuration:

```env
# Session Password (min 32 characters)
NUXT_SESSION_PASSWORD=a_strong_random_password_with_min_32_characters

# Database
DATABASE_URL=your_postgresql_database_url

# GitHub OAuth (optional, for user authentication)
NUXT_OAUTH_GITHUB_CLIENT_ID=your_github_oauth_app_client_id
NUXT_OAUTH_GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret

# AI Configuration via Vercel AI Gateway
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_api_key

# Twitter API Credentials
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret
TWITTER_CALLBACK_URL=http://localhost:3000/api/auth/twitter/callback

# Twitter API - used in Twitter Developer Portal/Vercel config, kept here for reference
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
TWITTER_OAUTH2_CLIENT_ID=your_twitter_oauth2_client_id
TWITTER_OAUTH2_CLIENT_SECRET=your_twitter_oauth2_client_secret
TWITTER_DEV_APP_ID=your_twitter_dev_app_id
TWITTER_DEV_APP_NAME=your_twitter_dev_app_name
```

Run database migrations:

```bash
pnpm db:migrate
```

## Development

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

## Production

Build the application:

```bash
pnpm build
```

Preview production build:

```bash
pnpm preview
```

Repository is connected to Vercel for automatic deployments:

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Configure your environment variables in the Vercel dashboard
4. Deploy automatically on every push

> [!NOTE]
> Make sure to configure your PostgreSQL database connection and run migrations in your production environment.

The application is configured to use [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) which provides:

- **Unified API**: Access hundreds of AI models through a single endpoint
- **High Reliability**: Automatic retries and fallbacks between providers
- **Spend Monitoring**: Track usage and set budgets across all providers
- **Load Balancing**: Distribute requests for optimal performance

Simply configure your `AI_GATEWAY_API_KEY` in your Vercel environment variables for production use.

## AI Gateway Setup

The app uses [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) for unified access to multiple AI providers:

1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Navigate to your [AI Gateway settings](https://vercel.com/dashboard/ai-gateway)
3. Generate an API key
4. Add the key to your environment as `AI_GATEWAY_API_KEY`

## Twitter API Setup

1. Create a Twitter Developer account at [developer.twitter.com](https://developer.twitter.com)
2. Create a new app in the Developer Portal
3. Enable OAuth 1.0a with read and write permissions
4. Set the callback URL to `http://localhost:3000/api/auth/twitter/callback`
5. Copy your API keys and tokens to the `.env` file
