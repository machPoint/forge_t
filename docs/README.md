# Forge - AI-Powered Therapeutic Journal

## Overview

Forge is a cross-platform desktop application built with Tauri that combines journaling, AI-driven therapeutic feedback, and memory management to support mental health and personal growth. The application provides a secure, local-first environment for users to engage in structured journaling exercises with optional AI assistance.

## Project Architecture

### Technology Stack

**Desktop Framework:**
- Tauri 2.x - Cross-platform desktop application framework
- Rust backend for system-level operations
- WebView2 for Windows rendering

**Frontend:**
- React 18 - UI library
- TypeScript - Type-safe development
- Vite - Build tool and dev server
- React Router v6 - Client-side routing
- HashRouter - Required for Tauri file:// protocol

**State Management:**
- Zustand - Lightweight state management
- React Query (TanStack Query) - Server state management
- Local Storage - Persistent client-side data

**UI/Styling:**
- TailwindCSS - Utility-first CSS framework
- Radix UI - Accessible component primitives
- Framer Motion - Animation library
- React Quill - Rich text editor
- Recharts - Data visualization

**AI Integration:**
- OpenAI API (GPT-4o, GPT-4o-mini)
- Anthropic API (Claude models)
- Grok API
- Model Context Protocol (MCP) for AI tool execution

### Backend Server (OPAL)

The OPAL (Open Protocol for AI Learning) server is a separate Node.js application located in the `opal/` directory that provides:

- **MCP Protocol Implementation** - JSON-RPC 2.0 compliant server
- **Memory Management** - Vector embeddings for AI context storage
- **API Token Management** - Secure access control
- **User Authentication** - JWT-based auth with bcrypt
- **Admin Panel** - Web interface for system management
- **Database** - SQLite (development) / PostgreSQL (production)
- **WebSocket & HTTP Endpoints** - Real-time and request-response communication

## Application Features

### 1. Journaling System

**Entry Types:**
- **Freeform Journaling** - Open-ended writing with rich text support
- **Guided Modules** - Structured therapeutic exercises
- **Template-based Entries** - Pre-configured journal formats

**Capabilities:**
- Rich text editing with React Quill
- Entry metadata (date, tags, sentiment)
- Entry history and versioning
- Export functionality (JSON, text formats)

### 2. AI-Powered Features

**AI Personas:**
- Supportive - Empathetic and encouraging feedback
- Analytical - Logical and structured analysis
- Professional - Career and productivity focused
- Therapeutic - Clinical and evidence-based approach

**AI Capabilities:**
- Real-time feedback generation on journal entries
- Personalized responses based on user identity profile
- Chat interface for conversational journaling
- Memory-aware context using OPAL server
- Multi-model support (OpenAI, Anthropic, Grok)

### 3. Guided Modules

Evidence-based therapeutic exercises:

**Expressive Writing**
- Process emotions through structured writing
- 4-step process: Identify, Explore, Express, Reflect
- Based on research-backed therapeutic techniques

**Habit Building**
- Based on James Clear's "Atomic Habits"
- 4-step framework: Cue, Craving, Response, Reward
- Systematic habit design and tracking

**Self-Compassion Practice**
- Develop kinder self-relationship
- 4 components: Mindfulness, Common Humanity, Self-Kindness, Compassionate Action
- Evidence-based self-compassion exercises

### 4. Memory System

**Core Memories:**
- Store and retrieve important life events
- AI-powered memory analysis and insights
- Sentiment analysis on memories
- Tag-based organization

**Memory Features:**
- Add/edit/delete memories
- Sentiment visualization
- Date-based sentiment tracking
- Memory insights dashboard

### 5. User Profile & Identity

**Biographical Information:**
- Personal details and background
- Life history and milestones
- Contextual information for AI personalization

**Personality Profile:**
- Traits and characteristics
- Preferences and values
- Profile versioning and history

**Identity Integration:**
- Feeds into AI feedback generation
- Enables personalized therapeutic responses
- Maintains privacy with local storage

### 6. Theming & Customization

**Brand Configurations:**
- `forge.base.json` - Base configuration
- `brand.professional.json` - Professional/productivity focus
- `brand.therapeutic.json` - Clinical/therapeutic focus

**Theme System:**
- Dynamic theme switching
- Light/dark mode support
- Custom color schemes
- Typography customization
- Spacing and border radius configuration

## Project Structure

```
forge/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Radix UI components
│   │   ├── chat/           # Chat interface components
│   │   ├── journal/        # Journal-specific components
│   │   ├── memories/       # Memory management components
│   │   ├── profile/        # User profile components
│   │   ├── core/           # Core memories components
│   │   └── templates/      # Layout templates
│   ├── pages/              # Route pages
│   │   ├── Index.tsx       # Home page
│   │   ├── JournalPage.tsx # Main journaling interface
│   │   ├── CorePage.tsx    # Core memories view
│   │   ├── ChatPage.tsx    # AI chat interface
│   │   ├── ModulesPage.tsx # Guided modules selection
│   │   ├── ProfilePage.tsx # User profile management
│   │   ├── AdminPage.tsx   # Admin configuration
│   │   └── CustomizationsPage.tsx # Theme settings
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.tsx     # Authentication logic
│   │   ├── useChat.tsx     # Chat functionality
│   │   ├── useJournal.tsx  # Journal state management
│   │   └── useModules.tsx  # Module management
│   ├── lib/                # Utility libraries
│   │   ├── openai.ts       # OpenAI API integration
│   │   ├── opal-client.ts  # OPAL server client
│   │   ├── modules.ts      # Guided module definitions
│   │   ├── aiPersonas.ts   # AI persona configurations
│   │   ├── themes.ts       # Theme system
│   │   ├── memoryService.ts # Memory management
│   │   └── identityProfileService.ts # Profile management
│   ├── brands/             # Brand configurations
│   │   ├── forge.base.json
│   │   ├── brand.professional.json
│   │   └── brand.therapeutic.json
│   ├── App.tsx             # Root application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── src-tauri/              # Tauri Rust backend
│   ├── src/
│   │   └── lib.rs          # Rust application logic
│   ├── tauri.conf.json     # Tauri configuration
│   └── Cargo.toml          # Rust dependencies
├── opal/                   # OPAL MCP Server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── tools/          # MCP tools
│   │   └── server.js       # Server entry point
│   ├── migrations/         # Database migrations
│   ├── seeds/              # Database seeds
│   └── package.json        # Node dependencies
├── public/                 # Static assets
├── docs/                   # Documentation
├── package.json            # Frontend dependencies
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

## Key Application Flows

### 1. Journal Entry Creation Flow

1. User navigates to Journal page
2. Selects entry type (freeform or guided module)
3. Writes content in rich text editor
4. Optionally selects AI persona
5. Saves entry to local storage
6. Can request AI feedback on entry

### 2. AI Feedback Generation Flow

1. User selects a journal entry
2. Clicks "Request AI Feedback"
3. App retrieves user's identity profile
4. Sends entry content + persona prompt + identity to AI API
5. AI generates personalized feedback
6. Feedback displayed in flyout panel
7. Feedback saved with entry

### 3. Guided Module Flow

1. User selects module from Modules page
2. Views module introduction
3. Progresses through sequential steps
4. Each step has specific prompt
5. Responses saved as journal entries
6. Can request AI feedback at any step

### 4. Memory Management Flow

1. User adds core memory with metadata
2. Memory stored locally
3. Can be synced to OPAL server
4. AI uses memories for context
5. Sentiment analysis performed
6. Insights generated from memory collection

## Configuration & Settings

### Environment Configuration

The application uses environment variables for:
- API keys (OpenAI, Anthropic, Grok)
- OPAL server connection
- Feature flags
- Debug settings

### User Settings (LocalStorage)

- Selected AI model
- Theme preferences
- Active journal module
- Authentication tokens
- User profile data

### Brand Configuration

Brand JSON files control:
- App name and branding
- Color schemes
- Typography
- Feature availability
- Compliance disclaimers

## Security & Privacy

### Local-First Architecture

- All user data stored locally by default
- Optional cloud sync via OPAL server
- No data transmission without explicit user action

### AI Privacy

- AI features are opt-in
- Data only sent to AI when user requests feedback
- No automatic data collection
- Users can review prompts before sending

### Authentication

- JWT-based authentication for OPAL server
- Bcrypt password hashing
- Token expiration and refresh
- Audit logging of API operations

### Compliance

- Medical disclaimer on startup
- Informed consent for AI features
- HIPAA-aware design (not certified)
- Privacy-first data handling

## Build & Development

### Development Commands

```bash
# Install dependencies
npm install

# Run frontend dev server
npm run dev

# Run Tauri dev app
npm run tauri:dev

# Build for production
npm run build

# Build Tauri app
npm run tauri:build
```

### OPAL Server Commands

```bash
cd opal

# Install dependencies
npm install

# Run migrations
npx knex migrate:latest

# Seed database
npx knex seed:run

# Start server
npm start
```

### Configuration Files

- `tauri.conf.json` - Tauri app configuration
- `package.json` - Frontend dependencies and scripts
- `vite.config.ts` - Vite build configuration
- `tailwind.config.ts` - Tailwind CSS customization
- `tsconfig.json` - TypeScript compiler options

## Deployment

### Windows Packaging

Tauri generates:
- `.exe` installer
- `.msi` Windows installer
- Portable executable

Configured in `src-tauri/tauri.conf.json`:
- App identifier: `com.machpoint.forge`
- Product name: `forge`
- Icons in `src-tauri/icons/`

### Cross-Platform Support

Tauri supports:
- Windows (WebView2)
- macOS (WebKit)
- Linux (WebKitGTK)

## Future Enhancements

- End-to-end encryption for cloud sync
- Mobile companion app
- Voice journaling
- Advanced analytics and insights
- Community features (opt-in)
- Third-party integrations
- Offline AI models
- Multi-language support

## Troubleshooting

Having issues? Check the [Troubleshooting Guide](TROUBLESHOOTING.md) for common problems and solutions:

- Port conflicts (EADDRINUSE errors)
- CSS import errors
- OPAL server connection issues
- API key problems
- Database migration errors
- And more...

## Contributing

See the main README for contribution guidelines.

## License

Copyright © 2025 Forge Technologies
