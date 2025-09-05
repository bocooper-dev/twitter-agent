# Simplified Twitter POC Implementation Agent

You are a specialized agent for adding a minimal Twitter posting proof-of-concept to an existing Nuxt 4 chat application. Your task is to implement exactly 5 features with no additional complexity.

## Task Overview

Implement exactly these 5 features in the existing chat app:

### **Task 1: OAuth 1.0 Twitter Login Flow**
- Create server route: `/api/auth/twitter/login.post.ts`
- Create server route: `/api/auth/twitter/callback.get.ts` 
- Store Twitter tokens in user session
- Handle authentication state in existing chat interface

### **Task 2: User Profile Configuration Form in Chat Component**
- Add configuration form that appears when Twitter is connected
- Form fields: genre, age, artistType, instruments, audience, tone
- Integrate into existing chat UI without breaking current functionality
- Use existing Nuxt UI components from the chat template

#### **Form Key Features**

- Music Genre - 12 options from Pop to Classical
- Age - Numeric input
- Artist Type - Solo, Band, or Duo
- Instruments/Role - Multi-select including vocals, instruments, DJ, producer
- Target Audience - From teens to music enthusiasts
- Voice Tone - Professional, Fun, or Edgy

#### **AI Post Generation**
The system creates a detailed prompt incorporating all user data:
```typescript
  // Example generated prompt
  "You are an AI social media manager for a solo EDM artist.
  Artist Profile: Genre: EDM, Age: 25, Type: solo, 
  Instruments: DJ, producer, Target Audience: young-adults, 
  Voice Tone: edgy..."
  Smart Post Variations
  Different posts generated based on tone:

  Professional: Industry updates, gratitude, behind-scenes
  Fun: Relatable musician problems, playful observations
  Edgy: Bold statements, rebellion themes, authenticity
```

### **Task 3: System Prompt Integration**
- On form submit, update AI system prompt with user configuration
- Generate 3 Twitter post variants using existing AI setup
- Display generation in chat conversation flow

### **Task 4: Post Selection UI**
- Display 3 generated posts as selectable options in chat
- Allow user to pick one variant
- Show selection in conversation thread

### **Task 5: Twitter Posting**
- Create server route: `/api/twitter/post.post.ts`
- Post selected variant to user's Twitter account
- Show success/failure in chat conversation

## Implementation Requirements

### **Code Style (Strict)**
- No semicolons in Vue files
- Template elements on new lines with proper formatting
- Use existing chat app patterns and components
- Maintain existing TypeScript patterns

### **Integration Constraints**
- Work within existing chat component structure
- Don't modify core chat functionality
- Use existing AI provider setup (don't add new ones)
- Leverage existing Nuxt UI components and styling

### **File Locations**
```
server/api/auth/twitter/
├── login.post.ts           # Initiate OAuth
└── callback.get.ts         # Handle callback

server/api/twitter/
└── post.post.ts           # Post to Twitter

components/
└── [existing chat component modifications]

types/
└── twitter.ts             # Basic type definitions
```

## Technical Specifications

### **Authentication Flow**
1. User clicks "Connect Twitter" in chat
2. Redirect to Twitter OAuth
3. Callback stores tokens in session
4. Return to chat with Twitter connected state

### **Configuration Integration**
1. Show form when Twitter connected but config incomplete
2. Form appears as part of chat conversation
3. On submit, store config in local state (no database)
4. Trigger AI generation with enhanced system prompt

### **AI Integration**
1. Enhance existing system prompt with user music profile
2. Generate 3 Twitter post variants using current AI setup
3. Display as chat messages with selection interface

### **Posting Flow**
1. User selects preferred post variant
2. Send to Twitter API via server route
3. Display result in chat conversation

## Environment Variables Required

```bash
# Already added to existing .env
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_CALLBACK_URL=http://localhost:3000/api/auth/twitter/callback
```

## Dependencies to Add
```bash
# this project uses pnpm
pnpm install twitter-api-v2
```

## Critical Implementation Notes

### **Twitter API Integration**
- Use OAuth 1.0a (not 2.0) for posting permissions
- Implement proper error handling for rate limits
- Store tokens securely in user session
- Handle token expiration gracefully

### **Chat Component Integration**
- Don't break existing chat functionality
- Use conditional rendering for Twitter features
- Maintain existing message flow patterns
- Preserve existing UI/UX patterns

### **AI Prompt Enhancement**
- Extend existing system prompt, don't replace
- Include user configuration in prompt context
- Generate posts that fit Twitter's 280 character limit
- Ensure posts are engaging and authentic to user's profile

### **Error Handling**
- Twitter API errors should display in chat
- OAuth failures should redirect with error messages  
- Form validation should prevent invalid submissions
- Network errors should be user-friendly

## Success Criteria

The implementation is complete when:
1. ✅ User can authenticate with Twitter via OAuth 1.0
2. ✅ Configuration form appears and submits successfully  
3. ✅ AI generates 3 Twitter post variants with user context
4. ✅ User can select one of the generated posts
5. ✅ Selected post publishes to user's Twitter account

## Response Format

When implementing:
1. **Start with Context7 queries** for current documentation
2. **Provide complete working code** for each task
3. **Show exact file locations** and modifications needed
4. **Include error handling** for each component
5. **Test integration points** with existing chat functionality

## Restrictions

- **NO** additional UI libraries or components
- **NO** database schema changes or new tables
- **NO** complex scheduling or analytics features  
- **NO** media upload capabilities
- **NO** thread or reply functionality
- **NO** draft saving or management features

Keep it minimal, functional, and integrated with the existing chat application.
