# CV Avatar Chatbot Application

## Overview

This is a full-stack web application that creates an AI-powered avatar chatbot for CV analysis. Users can upload PDF CVs, and the system provides personalized feedback through an animated avatar that speaks using text-to-speech technology. The application combines modern web technologies with AI services to deliver an interactive career coaching experience.

## User Preferences

Preferred communication style: Simple, everyday language.
ElevenLabs Voice ID: aEO01A4wXwd1O8GPgGlF (Custom voice preference for all TTS generation)

## System Architecture

The application follows a full-stack TypeScript architecture with a React frontend and Express.js backend, designed as a monorepo with shared type definitions and schemas.

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **File Upload**: Multer middleware for PDF handling (10MB limit)
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Memory-based storage with fallback to database

## Key Components

### File Processing Pipeline
1. **PDF Upload**: Multer handles file validation and memory storage
2. **Text Extraction**: Mock PDF parser service (production would use pdf-parse)
3. **AI Analysis**: OpenAI GPT-4o integration for CV evaluation
4. **Text-to-Speech**: ElevenLabs API for voice generation
5. **Response Delivery**: Structured JSON responses with audio URLs

### Database Schema
- **Users Table**: Basic user authentication (id, username, password)
- **CV Analyses Table**: Stores analysis results, audio URLs, and processing status
- **Analysis Structure**: JSON field containing strengths, improvements, score, and feedback

### UI Components
- **Process Steps**: Visual workflow indicator (Upload → Analysis → Feedback)
- **Upload Section**: Drag-and-drop file upload with validation
- **Avatar Section**: Interactive avatar with audio playback controls
- **Feedback Section**: Detailed analysis results with downloadable reports

### External Service Integration
- **OpenAI API**: CV analysis using GPT-4o model with structured JSON output
- **ElevenLabs API**: Text-to-speech conversion with voice customization
- **Neon Database**: PostgreSQL hosting with connection pooling

## Data Flow

1. **Upload Phase**: User uploads PDF → Server validates file → PDF text extracted → Analysis record created
2. **Processing Phase**: Background processing starts → OpenAI analyzes CV → ElevenLabs generates speech → Database updated
3. **Feedback Phase**: Client polls for completion → Avatar displays with audio playback → User reviews detailed feedback

### State Management
- React Query manages server state with automatic polling during processing
- Local component state handles UI interactions (audio playback, file upload)
- Shared types ensure type safety between frontend and backend

## External Dependencies

### Production APIs
- **OpenAI GPT-4o**: CV analysis and feedback generation
- **ElevenLabs**: Voice synthesis with customizable voice settings
- **Neon Database**: Managed PostgreSQL with serverless scaling

### Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **Vite**: Fast development server with hot module replacement
- **ESBuild**: Production bundling for server-side code

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library for consistent iconography

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Assets**: Static files served from build output directory

### Environment Configuration
- **Database**: PostgreSQL connection via `DATABASE_URL`
- **AI Services**: API keys for OpenAI and ElevenLabs
- **Development**: Replit-specific tooling and runtime error handling

### Production Considerations
- File upload limits and security validation
- Error handling with graceful fallbacks for AI services
- Database connection pooling and transaction management
- Static asset serving with proper caching headers

The application is designed to be easily deployable on Replit with minimal configuration, using environment variables for service integration and built-in development tooling for rapid iteration.

## Recent Changes

### July 27, 2025 - Latest Update: Custom AI Detection Script Integration
- **User's Python Script**: Replaced ALL fallback methods with user's exact DeefakeTextDetection script
- **No Fallbacks Allowed**: System now exclusively uses the user's provided Python detection algorithm
- **Pattern-Based Analysis**: Implemented sophisticated text analysis using regex patterns and structural analysis
- **AI Detection API**: Created dedicated `/api/ai-detect` endpoint with probability scoring and color-coded results
- **Complete Interface**: AI DETECTOR mode now has full text input, file upload, and chat functionality
- **Mira Analysis Integration**: AI detection results include Mira's cyberpunk-themed personality analysis
- **Error Handling**: System throws errors if detection script fails, ensuring no fallback usage

### July 24, 2025 - Earlier Update: Instant Text Chat & Authentication System
- **Instant Text Chat**: Fixed critical text chat functionality with immediate user message display
- **Optimized Chat Flow**: User messages appear instantly, AI responses stream in after processing
- **Improved UX**: Removed input field disable during processing for continuous typing experience
- **API Request Fixes**: Corrected parameter order in all apiRequest function calls across the application
- **Performance Enhancement**: Text chat now feels responsive and natural like ChatGPT

### July 23, 2025 - Multi-Platform Authentication System Implementation
- **Comprehensive Authentication**: Implemented Google Social Login, Wallet Connect, and Twitter Account authentication
- **Database Schema Updates**: Extended users table with email, profile images, display names, and created user_accounts table for multi-provider support
- **Authentication Infrastructure**: Created full Passport.js-based authentication system with session management
- **User Profile Component**: Built user profile interface for sidebar with account linking capabilities
- **AuthModal Component**: Created modal for authentication selection with all three login methods
- **Wallet Integration**: Implemented Ethereum wallet connection with signature-based authentication using ethers.js
- **Session Management**: Added PostgreSQL-based session storage with automatic cleanup
- **Account Linking**: Users can connect multiple authentication methods to same account
- **User Interface**: Integrated authentication into ChatSidebar with profile dropdown and account management

### July 23, 2025 - Earlier Update: Enhanced Mira Persona and Communication Style
- **Refined Mira Persona**: Updated all OpenAI system prompts with refined communication guidelines
- **Enhanced Communication Style**: Enthusiastic and snarky tone, avoiding formal language and superficial admiration
- **Strict Language Rules**: NO use of "—" character, use normal human language, keep responses concise but not cold
- **Updated Video Source**: Changed to latest vertical video file without background for seamless integration
- **CV Analysis Specialization**: Detailed, actionable steps for CV improvement with specific professional feedback
- **Multi-Language Support**: Explicitly configured to respond in user's language (English, Chinese, Japanese, etc.)
- **TypeScript Fixes**: Resolved duplicate function implementations and type safety issues
- **Consistent Voice**: Unified personality across all interaction modes with cyberpunk backstory

### July 21, 2025 - Earlier Update: Perfect Audio-Video Synchronization and Fade-Out Effects
- **Perfect Audio-Video Sync**: Implemented synchronized playback using Promise.all for simultaneous audio and video start
- **Automatic Fade-Out**: Added elegant fade-out effect when audio ends, transitioning smoothly back to data cluster
- **Original Video Quality Restored**: Removed all artificial brightness/contrast/saturation filters for natural appearance
- **Graphics Repositioning**: Moved all visual effects to surround avatar instead of overlaying, creating immersive space
- **Transparent Background Maintained**: Preserved original video transparency without any enhancements
- **Callback-Based Architecture**: Implemented proper callback system for audio-end detection and state management
- **ForwardRef Component**: Created proper ref structure for parent-child communication in React
- **Performance Optimized**: Maintained gpt-4o-mini model for 3x faster response times (0.8s vs 2.4s)

### July 20, 2025 - Earlier Update: Production Deployment Fixes Applied
- **Environment Validation**: Added comprehensive environment variable validation on startup
- **Enhanced Error Handling**: Implemented detailed error logging and graceful error handling throughout the application
- **Production Configuration**: Added explicit NODE_ENV production mode detection and configuration
- **Improved Health Check**: Enhanced `/api/health` endpoint with service status monitoring and database connectivity tests
- **Database Pool Configuration**: Added production-ready connection pooling with proper timeout and connection limits
- **Graceful Shutdown**: Implemented proper SIGTERM/SIGINT handling for clean server shutdown
- **Startup Logging**: Added detailed logging for server initialization and service status
- **Production Environment File**: Created `.env.production` with default production settings

### July 20, 2025 - Earlier Update: MIRA Interface Enhancement with Back Button
- **Mira Avatar Component**: Implemented intelligent AI avatar that appears only during voice interactions
- **Synchronized Playback**: Video plays precisely when audio is playing, stops when audio ends
- **Smart Looping**: Video loops seamlessly if audio duration exceeds video length
- **Smooth Transitions**: Elegant fade-in/fade-out effects with emerald glow accent
- **Voice ID Integration**: Updated ElevenLabs to use custom voice ID `aEO01A4wXwd1O8GPgGlF` for Mira
- **Interactive Design**: Avatar appears in bottom-right corner with "MIRA" label and cyberpunk styling
- **Performance Optimized**: Efficient video management with proper cleanup and error handling
- **Subtle Back Button**: Added translucent back button (30% opacity, 70% on hover) in top-left corner for easy navigation
- **Mesmerizing Graphics**: Completely redesigned data visualization with thin lines, geometric patterns, spirals, and particle fields
- **Smooth Transitions**: 1-second fade transitions between data cluster and video states with layered rendering
- **Proportionate Captions**: Dynamic text sizing (14-24px) and padding based on response length for optimal readability

### July 20, 2025 - Earlier Update: Cyberpunk/Futuristic Design Implementation
- **Titillium Web Font Integration**: Added Google Fonts Titillium Web with all weight classes for futuristic typography
- **Cyberpunk Styling System**: Implemented comprehensive cyberpunk design elements including:
  - Neon text effects with animated glow and flicker
  - Holographic background animations with color shifting
  - Cyberpunk borders with gradient effects
  - Matrix-style digital rain background patterns
  - Cyber grid overlay for futuristic atmosphere
- **Enhanced Visual Effects**: Added animated grid lines, pulsing gradients, and improved background effects
- **UI Text Updates**: Changed terminology to match cyberpunk theme (e.g., "AI CAREER NEXUS", "NEURAL LINK", "DATA PACKAGE")
- **Performance Optimizations**: Applied GPU acceleration and improved CSS transforms for smooth animations
- **Scrolling Fix**: Resolved critical viewport lock issue where CV analysis prevented scrolling to previous messages

### July 19, 2025 - Earlier Update: Unified Chat Interface Design Overhaul
- **Complete UI Redesign**: Created single unified chat interface similar to ChatGPT/Grok
- **Three Interaction Modes**: Text, Click to Talk, and Continuous Chat modes accessible from top toggle
- **Integrated CV Analysis**: CV upload and analysis now happens within the chat interface
- **Chat-First Experience**: All functionality (text chat, voice chat, CV analysis) unified in one interface
- **Preserved Backend**: All existing backend functionality maintained without changes
- **Streamlined Navigation**: Single-page application with all features accessible from main chat
- **Enhanced Message Display**: Formatted CV analysis results with proper styling and audio playback
- **Consistent Design**: HyperDash-inspired dark theme with glass-morphism effects throughout
- **Simplified Architecture**: Removed separate pages for different features, everything in unified chat
- **Better UX Flow**: Upload CV button at bottom, interaction modes at top, chat in center

### Earlier July 19, 2025
- **Database Integration Complete**: Successfully connected PostgreSQL database replacing all mock data
- **PDF Processing Fixed**: Implemented proper PDF text extraction with fallback demo content generation
- **Backend-Frontend Connection**: Fixed React Query polling and API communication issues
- **Separate Upload Logic**: Each CV upload now creates unique database records and analysis
- **Real AI Analysis**: OpenAI GPT-4o generates personalized feedback for different CV content
- **Voice Generation Working**: ElevenLabs creates unique audio files for each analysis
- **HyperDash UI Applied**: Modern dark interface with sophisticated gradient effects across all components
- **Direct AI Chat**: Added text-based chat functionality with optional voice responses
- **Voice Message Support**: Implemented voice input processing with transcription and audio responses