# Civic Issue Management System - Department Portal Requirements Document

## 1. Website Overview

### 1.1 Website Name
Civic Issue Management System - Department Portal

### 1.2 Website Description\nA web-based application designed for government officials to manage, monitor, and resolve civic issues reported by citizens. The system enables efficient complaint handling, inter-departmental coordination, and performance tracking across multiple government departments.

## 2. Core Functionality

### 2.1 User Authentication
- Department officials login using departmental email and password
- Forgot password functionality:\n  - User clicks Forgot Password link on login page
  - System prompts user to enter registered email address
  - Upon submission, system sends password reset link to the provided email
  - User clicks the reset link in email\n  - System displays password reset form with two fields:
    - New Password input field
    - Confirm Password input field
  - User enters new password in both fields
  - System validates password match and updates credentials
  - User redirected to login page with success confirmation
- Access control based on department jurisdiction (Municipal, Panchayat, Town Panchayat, Corporation, Water Department, Energy Department, PWD)\n
### 2.2 Dashboard
- Display department name in header
- Sidebar navigation menu with four main sections:
  - Recent Problems
  - Progress Problems
  - Solved Problems
  - Report Generation

### 2.3 Recent Problems Management
- View all newly reported complaints
- Review complaint details including user-submitted images and descriptions
- Two action options for each complaint:
  - Accept: Take responsibility if issue belongs to the department\n  - Redirect: Forward to correct department using AI-based categorization (Water, Electricity, or PWD)

### 2.4 Progress Problems Tracking\n- Manage accepted complaints through three stages:
  - Notified: Initial stage after acceptance
  - Progress: Updated when officer begins work (automatically notifies citizen)
  - Completed: Final stage with solved image upload
- Automatic status updates and citizen notifications
- Completed issues automatically move to Solved Problems section

### 2.5 Solved Problems Archive\n- Historical record of all resolved complaints
- View completion details and uploaded solution images

### 2.6 Report Generation
- Generate analytical reports with time-based filters:
  - Daily
  - Weekly
  - Monthly
  - Yearly
- Key performance indicators included:
  - Total complaints received
  - Number of solved issues
  - Pending issues count
  - Average resolution time
  - Location-based issue distribution
- Download reports as PDF for documentation and planning\n
### 2.7 AI-Powered Routing\n- Automatic complaint categorization and department assignment
- Intelligent redirection to Water Department, Energy Department, or PWD based on issue analysis\n
## 3. Design Style

### 3.1 Color Scheme
- Primary color: Deep blue (#1E3A8A) representing government authority and trust
- Secondary color: Green (#10B981) for completed/success states
- Accent color: Orange (#F59E0B) for pending/progress indicators
- Background: Light gray (#F3F4F6) for clean, professional appearance

### 3.2 Layout Structure
- Fixed header with department branding
- Left sidebar navigation (240px width) with collapsible menu
- Main content area with card-based layout for complaint display\n- Responsive grid system for report dashboards

### 3.3 Visual Elements
- Rounded corners (8px border-radius) for modern, approachable feel
- Subtle shadows (0-2px 4px rgba(0,0,0,0.1)) for depth and hierarchy
- Status badges with color coding (gray for notified, blue for progress, green for completed)
- Icon set: Line-style icons for clarity and professionalism
- Data visualization: Bar charts and pie charts for report generation module

### 3.4 Interactive Components
- Hover effects on action buttons with smooth transitions (0.3s)
- Modal dialogs for complaint detail views
- Toast notifications for status updates and confirmations
- Loading indicators for AI processing and report generation