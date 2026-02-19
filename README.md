# Civic Issue Management System (CIMS)

A comprehensive platform for reporting, tracking, and managing civic issues in your city. This repository contains both the User-facing application and the Department-facing administrative portal.

## Project Structure

```text
cims/
├── cimsuser/      # User-facing application (Report issues, view progress)
└── cimsdept/      # Department portal (Manage issues, update status)
```

## Prerequisites

- **Node.js**: v20 or higher
- **npm**: v10 or higher

## Getting Started

### 1. User Application (Citizen Side)

Navigate to the user application directory:
```bash
cd cimsuser
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```
By default, the application will run at [http://localhost:8080](http://localhost:8080).

---

### 2. Department Portal (Admin Side)

Navigate to the department portal directory:
```bash
cd cimsdept
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npx vite
```
By default, the portal will run at [http://localhost:5173](http://localhost:5173).

## Tech Stack

- **Frontend**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS & shadcn/ui
- **Backend & Database**: Supabase
- **AI Integration**: Google Gemini API for automated issue analysis

## Features

- **Issue Reporting**: Citizens can upload photos of civic problems and add details.
- **AI Analysis**: Automated categorization and description generation for reported issues using Gemini AI.
- **Live Tracking**: Real-time status updates (Solved, In Progress, Pending) on issue resolution.
- **Admin Dashboard**: Department-specific tools to prioritize, manage, and update the status of city maintenance tasks.
- **User Profiles**: Personalized dashboards for citizens to track their reported issues.
