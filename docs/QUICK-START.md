# Quick Start Guide

## Prerequisites

Before running Forge, ensure you have:

- **Node.js** (v18 or later) - [Download](https://nodejs.org/)
- **Rust** (latest stable) - [Download](https://rustup.rs/)
- **npm** or **yarn** package manager
- **WebView2** (Windows only) - Usually pre-installed on Windows 10/11

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd forge
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install OPAL server dependencies
cd opal
npm install
cd ..
```

### 3. Setup OPAL Database

```bash
cd opal

# Run database migrations
npx knex migrate:latest

# Seed initial data (optional)
npx knex seed:run

cd ..
```

### 4. Configure Environment Variables (Optional)

Create `opal/.env` file:

```env
# Server Configuration
NODE_ENV=development
MCP_PORT=3000

# Database (SQLite for development)
DB_FILE=./dev.sqlite3

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=24h

# Optional: AI API Keys (can also be configured in app)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

## Running the Application

### Option 1: Using the Start Script (Recommended)

```bash
# From the forge root directory
start.bat
```

This will:
1. Start the OPAL server on port 3000
2. Start the Vite dev server on port 1420
3. Launch the Tauri desktop application

### Option 2: Manual Start

**Terminal 1 - OPAL Server:**
```bash
cd opal
npm start
```

**Terminal 2 - Tauri App:**
```bash
npm run tauri:dev
```

### Option 3: Frontend Only (No Desktop)

```bash
npm run dev
# Open browser to http://localhost:1420
```

## First-Time Setup in App

### 1. Login or Skip Authentication

On first launch, you can:
- Skip authentication (local-only mode)
- Login to OPAL server (if configured)

### 2. Configure AI Provider (Optional)

1. Click the **menu icon** (≡) in the top-left
2. Navigate to **Admin** page
3. Go to **API Configuration** tab
4. Enter your API key for:
   - OpenAI (GPT-4o, GPT-4o-mini)
   - Anthropic (Claude)
   - Grok (if available)

### 3. Complete User Profile (Optional)

1. Navigate to **Profile** page
2. Fill in biographical information
3. Complete personality profile
4. This enables personalized AI feedback

## Basic Usage

### Creating a Journal Entry

1. Navigate to **Journal** page
2. Click **+ New Entry**
3. Choose entry type:
   - **Freeform** - Open writing
   - **Guided Module** - Structured exercises
4. Write your entry
5. Click **Save**

### Getting AI Feedback

1. Select a saved journal entry
2. Click **Request AI Feedback** button
3. Choose AI persona (Supportive, Analytical, Professional, Therapeutic)
4. View feedback in the flyout panel

### Using Guided Modules

1. Navigate to **Modules** page
2. Select a module:
   - Expressive Writing
   - Habit Building
   - Self-Compassion Practice
3. Follow the step-by-step prompts
4. Each step is saved as a journal entry

### Managing Memories

1. Navigate to **Core** or **Memories** page
2. Click **+ Add Memory**
3. Enter memory details and tags
4. View sentiment analysis and insights

## Common Tasks

### Changing Themes

1. Click **menu icon** (≡)
2. Navigate to **Customizations**
3. Select theme preset or customize colors
4. Toggle dark/light mode

### Exporting Journal Entries

1. Navigate to **Journal** page
2. Click **Export** button
3. Choose format (JSON, Text)
4. Save to file

### Switching AI Models

1. Go to **Admin** page
2. **AI Configuration** tab
3. Select from available models
4. Model applies to all future AI requests

## Troubleshooting Quick Fixes

### Port 3000 Already in Use

```bash
# Run the helper script
kill-port-3000.bat

# Or manually kill the process
netstat -ano | findstr :3000
taskkill /F /PID <PID>
```

### OPAL Server Won't Start

```bash
cd opal

# Reset database (WARNING: Deletes all data)
rm dev.sqlite3
npx knex migrate:latest
npx knex seed:run

npm start
```

### Tauri Build Fails

```bash
# Update Rust
rustup update

# Clean and rebuild
cd src-tauri
cargo clean
cargo build
```

### AI Feedback Not Working

1. **Check API key** - Admin page → API Configuration
2. **Check console** - Press F12, look for errors
3. **Verify internet connection**
4. **Try different model** - Some may have rate limits

## Development Workflow

### Making Changes to Frontend

1. Edit files in `src/`
2. Vite will hot-reload automatically
3. Changes appear immediately in the app

### Making Changes to OPAL Server

1. Edit files in `opal/src/`
2. Restart the server: `Ctrl+C` then `npm start`
3. Frontend will reconnect automatically

### Building for Production

```bash
# Build frontend
npm run build

# Build Tauri app (includes frontend)
npm run tauri:build

# Output in src-tauri/target/release/bundle/
```

## Keyboard Shortcuts

- `Ctrl + S` - Save current entry
- `Ctrl + N` - New entry
- `Ctrl + ,` - Open settings
- `F12` - Open DevTools (debug mode)
- `Ctrl + R` - Refresh application

## Next Steps

- Read the full [Documentation](README.md)
- Check [Troubleshooting Guide](TROUBLESHOOTING.md) for issues
- Explore guided modules for therapeutic exercises
- Customize themes and AI personas
- Set up cloud sync with OPAL server (optional)

## Getting Help

- **Documentation**: `docs/` folder
- **Issues**: Check console (F12) for error messages
- **Support**: support@forge.app
- **GitHub**: Open an issue with logs and steps to reproduce

---

**Welcome to Forge!** Start journaling, explore AI-powered insights, and build a deeper understanding of yourself.
