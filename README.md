# Civic Issue Management System (CIMS)

A comprehensive platform for reporting, tracking, and managing civic issues in your city. This repository contains both the User-facing application and the Department-facing administrative portal.

## Project Structure

```text
civic/
├── user side/cims-main/      # User-facing application (Report issues, view progress)
└── dept side/app-84dd1k6elqm9/ # Department portal (Manage issues, update status)
```

## Prerequisites

- **Node.js**: v20 or higher
- **npm**: v10 or higher

## Getting Started

### 1. User Application (Citizen Side)

Navigate to the user application directory:
```bash
cd "user side/cims-main"
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
cd "dept side/app-84dd1k6elqm9"
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```
By default, the portal will run at [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Frontend**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS & shadcn/ui
- **Backend & Database**: Supabase
- **AI Integration**: Google Gemini API for automated issue analysis

## Features

- **Issue Reporting**: Citizens can upload photos of civic problems.
- **AI Analysis**: Automated categorization and description generation for reported issues.
- **Live Tracking**: Real-time status updates on issue resolution.
- **Admin Dashboard**: Department-specific tools to prioritize and manage city maintenance tasks.
