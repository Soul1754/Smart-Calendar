`# Smart Calendar App

## Overview
The **Smart Calendar App** is an AI-powered scheduling assistant that automatically finds the best time slots for meetings by analyzing calendar availability across multiple participants. It integrates with **Google Calendar** and **Microsoft Outlook Calendar** using OAuth 2.0 authentication.

## Features
- **OAuth 2.0 Authentication** (Google & Microsoft)
- **AI-powered Scheduling** to find common free slots
- **Event Management** (Create, Update, Delete events)
- **Automatic Email Responses** if no slots are available
- **Dashboard** to view and manage meetings
- **Smart Notifications** & Reminders

## Tech Stack
### Backend:
- **Node.js** + **Express.js**
- **Passport.js** (OAuth 2.0 authentication)
- **MongoDB/PostgreSQL** (for storing user data & events)
- **Google Calendar API** & **Microsoft Graph API**

### Frontend:
- **React.js** + **React Router**
- **Axios** (for API calls)
- **TailwindCSS** (for UI styling)

## Setup Instructions
### Prerequisites
- Node.js (>= v16)
- MongoDB or PostgreSQL Database
- Google & Microsoft OAuth Credentials

### Backend Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/Soul1754/Smart-Calendar.git
   cd Smart-Calendar/backend