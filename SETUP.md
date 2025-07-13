# Spectrum Setup Guide

## Authentication Setup

This application uses GitHub OAuth for authentication. Follow these steps to set up the authentication system:

### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: Spectrum
   - **Homepage URL**: `http://localhost:4321`
   - **Authorization callback URL**: `http://localhost:4321/api/auth/callback/github`
4. Click "Register application"
5. Copy the **Client ID** and **Client Secret**

### 2. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Auth Configuration
AUTH_SECRET=your_random_secret_here_32_characters_minimum
AUTH_TRUST_HOST=true

# Admin Configuration
ADMIN_EMAIL=your-admin@email.com
```

**Generate AUTH_SECRET**: Run `openssl rand -hex 32` to generate a secure random secret.

### 3. Admin Configuration

Set the `ADMIN_EMAIL` environment variable to your GitHub email address to get admin access.

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:4321`

## Usage

### For Regular Users:

1. Visit the homepage
2. Click "Sign in with GitHub"
3. Access your dashboard to view game stats and play

### For Admins:

1. Sign in with your configured admin email
2. You'll see an "Admin Panel" button in the navigation
3. Use the admin dashboard to add new items for the game

## Database Integration

The current implementation uses placeholder data. To integrate with a real database:

1. Add your database configuration to the environment variables
2. Update the database queries in:
   - `src/pages/admin.astro` (for saving items)
   - `src/pages/dashboard.astro` (for loading game data)
   - Add API endpoints for game functionality

## Features

- **Authentication**: GitHub OAuth integration
- **User Dashboard**: Game statistics and play interface
- **Admin Dashboard**: Add and manage items
- **Modern Dark Theme**: Minimalist design with Inter font
- **Responsive**: Works on all devices
- **TypeScript**: Full type safety
