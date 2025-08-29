# Overview

This is a workflow automation platform built as a full-stack web application. The system allows users to create, configure, and execute visual workflows using a drag-and-drop interface. Workflows consist of interconnected nodes that perform various actions like HTTP requests, data logging, and other automated tasks. The application provides real-time execution monitoring with detailed logs and status tracking.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite for development and building
- **UI Library**: Radix UI components with shadcn/ui for consistent design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints for workflows and executions
- **Request Processing**: Express middleware for JSON parsing, CORS handling, and request logging
- **Error Handling**: Centralized error handling with proper HTTP status codes

## Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless PostgreSQL database
- **Schema Management**: Drizzle migrations for database schema versioning
- **In-Memory Storage**: Fallback memory storage implementation for development/testing
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple

## Workflow Engine
- **Execution Model**: Node-based workflow execution with dependency resolution
- **Node Types**: 
  - StartNode: Workflow initiation trigger
  - FetchApiNode: HTTP request execution with configurable methods, headers, and body
  - LogMessageNode: Data output and logging functionality
- **Connection System**: Visual node connections defining execution flow
- **Status Tracking**: Real-time execution status monitoring (running, completed, failed, stopped)

## Component Architecture
- **Canvas System**: Interactive workflow builder with drag-and-drop functionality
- **Node Palette**: Categorized node library for workflow construction
- **Configuration Panel**: Dynamic forms for node parameter configuration
- **Execution Monitor**: Real-time execution tracking with detailed logs
- **Responsive Design**: Mobile-first approach with adaptive layouts

## Development Tools
- **Build System**: Vite with TypeScript compilation and hot module replacement
- **Code Quality**: ESLint and TypeScript strict mode for code consistency
- **Development Server**: Express server with Vite middleware integration
- **Asset Management**: Vite-based asset bundling and optimization

# External Dependencies

## Database Services
- **Neon**: Serverless PostgreSQL database hosting
- **Drizzle ORM**: Type-safe database operations and migrations

## UI Libraries
- **Radix UI**: Headless component primitives for accessibility
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking and compilation
- **React Query**: Server state management and caching
- **Wouter**: Lightweight routing library

## Utilities
- **Axios**: HTTP client for API requests
- **date-fns**: Date manipulation and formatting
- **clsx**: Conditional class name utility
- **class-variance-authority**: Component variant management
- **React Hook Form**: Form state management and validation
- **Zod**: Schema validation and type inference

## Runtime Dependencies
- **Express**: Web application framework
- **connect-pg-simple**: PostgreSQL session store
- **nanoid**: Unique ID generation
- **tsx**: TypeScript execution for development server