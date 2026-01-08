# Forge Documentation Index

Welcome to the Forge documentation! This index will help you find the information you need.

## Getting Started

- **[Quick Start Guide](QUICK-START.md)** - Get up and running in minutes
  - Installation steps
  - First-time setup
  - Basic usage examples
  - Common tasks

## Reference Documentation

- **[Main Documentation](README.md)** - Comprehensive project overview
  - Architecture and technology stack
  - Feature descriptions
  - Project structure
  - Configuration options
  - Security and privacy
  - Build and deployment

- **[Troubleshooting Guide](TROUBLESHOOTING.md)** - Solutions to common problems
  - Port conflicts
  - CSS errors
  - Database issues
  - API problems
  - Performance optimization

## Documentation by Topic

### For New Users

1. Start with [Quick Start Guide](QUICK-START.md)
2. Learn about features in [Main Documentation](README.md#application-features)
3. Configure AI in [Quick Start - First-Time Setup](QUICK-START.md#first-time-setup-in-app)

### For Developers

1. Review [Architecture](README.md#project-architecture)
2. Understand [Project Structure](README.md#project-structure)
3. Read [Build & Development](README.md#build--development)
4. Check [Configuration Files](README.md#configuration-files)

### For Troubleshooting

1. Check [Common Issues](TROUBLESHOOTING.md#common-issues-and-solutions)
2. Review [Debug Mode](TROUBLESHOOTING.md#enable-debug-mode)
3. See [Reset to Defaults](TROUBLESHOOTING.md#reset-application-to-defaults)

## Quick Links by Feature

### Journaling
- [Creating Entries](QUICK-START.md#creating-a-journal-entry)
- [Entry Types](README.md#1-journaling-system)
- [Exporting](QUICK-START.md#exporting-journal-entries)

### AI Features
- [Setup API Keys](QUICK-START.md#2-configure-ai-provider-optional)
- [AI Personas](README.md#2-ai-powered-features)
- [Getting Feedback](QUICK-START.md#getting-ai-feedback)
- [Troubleshooting AI](TROUBLESHOOTING.md#8-ai-feedback-not-generating)

### Guided Modules
- [Using Modules](QUICK-START.md#using-guided-modules)
- [Available Modules](README.md#3-guided-modules)
- [Module Troubleshooting](TROUBLESHOOTING.md#12-module-not-loading)

### Memory System
- [Managing Memories](QUICK-START.md#managing-memories)
- [Memory Features](README.md#4-memory-system)

### Customization
- [Themes](QUICK-START.md#changing-themes)
- [Brand Configuration](README.md#brand-configuration)
- [User Profile](QUICK-START.md#3-complete-user-profile-optional)

## Technical Reference

### Backend (OPAL Server)
- [OPAL Overview](README.md#backend-server-opal)
- [Database Setup](QUICK-START.md#3-setup-opal-database)
- [Environment Variables](QUICK-START.md#4-configure-environment-variables-optional)
- [Server Troubleshooting](TROUBLESHOOTING.md#3-opal-server-connection-failed)

### Frontend (React + Tauri)
- [Technology Stack](README.md#technology-stack)
- [Application Flows](README.md#key-application-flows)
- [Component Structure](README.md#project-structure)

### Build & Deploy
- [Development Workflow](QUICK-START.md#development-workflow)
- [Production Build](QUICK-START.md#building-for-production)
- [Windows Packaging](README.md#windows-packaging)
- [Cross-Platform Support](README.md#cross-platform-support)

## Common Scenarios

### "I want to start using Forge"
→ [Quick Start Guide](QUICK-START.md)

### "The app won't start"
→ [Troubleshooting - Port Issues](TROUBLESHOOTING.md#1-port-3000-already-in-use)
→ [Troubleshooting - Dev Server](TROUBLESHOOTING.md#10-dev-server-wont-start)

### "AI features aren't working"
→ [Configure API](QUICK-START.md#2-configure-ai-provider-optional)
→ [AI Troubleshooting](TROUBLESHOOTING.md#8-ai-feedback-not-generating)

### "I want to customize the app"
→ [Theming](README.md#6-theming--customization)
→ [Brand Config](README.md#brand-configuration)

### "I'm getting a specific error"
→ [Troubleshooting Guide](TROUBLESHOOTING.md) - Search for your error message

### "I want to understand the code"
→ [Architecture](README.md#project-architecture)
→ [Project Structure](README.md#project-structure)
→ [Key Flows](README.md#key-application-flows)

### "I want to contribute"
→ [Main Documentation](README.md#contributing)

## File Structure

```
docs/
├── INDEX.md              ← You are here
├── README.md             ← Main documentation
├── QUICK-START.md        ← Getting started guide
└── TROUBLESHOOTING.md    ← Problem solutions
```

## Additional Resources

### Helper Scripts

Located in project root:
- `start.bat` - Start the application (Windows)
- `kill-port-3000.bat` - Free up port 3000 if blocked

### Configuration Files

- `src-tauri/tauri.conf.json` - Tauri app settings
- `package.json` - Frontend dependencies
- `opal/package.json` - Backend dependencies
- `tailwind.config.ts` - UI styling
- `vite.config.ts` - Build configuration
- `tsconfig.json` - TypeScript settings

### Source Code Organization

- `src/components/` - React UI components
- `src/pages/` - Application pages/routes
- `src/lib/` - Utilities and services
- `src/hooks/` - Custom React hooks
- `opal/src/` - Backend server code

## Getting Help

If you can't find what you're looking for:

1. **Search the docs** - Use Ctrl+F to search within files
2. **Check Troubleshooting** - Most issues are covered there
3. **Open DevTools** - Press F12 to see error messages
4. **Review logs** - Check console output for details
5. **Ask for help** - support@forge.app or GitHub issues

## Documentation Conventions

- **Bold** - Important terms or emphasis
- `Code blocks` - File paths, commands, or code
- → - Points to another document or section
- [Links](URL) - Click to navigate to related content

## Keeping Docs Updated

As the project evolves:
- Update version numbers in README.md
- Add new features to appropriate sections
- Update troubleshooting with new issues
- Keep examples current with code changes

---

**Last Updated:** 2025-12-30
**Version:** 1.0.0
**Maintainers:** Forge Team
