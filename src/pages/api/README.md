# API Routes

## User Routes (`/api/user/`)

### `/api/user/profile` - User Profile Management

- **GET**: Get current user's profile settings (isPublic, publicUsername)
- **POST**: Update user's profile settings (isPublic, publicUsername)

### `/api/user/stats` - Private User Statistics

- **GET**: Get current user's private statistics (total guesses, accuracy, recent guesses)

### `/api/user/public-stats` - Public User Statistics

- **GET**: Get public statistics for a user by username
- Param `username` - the public username to look up

### `/api/user/generate-username` - Username Generation

- **POST**: Generate a random available username

## Item Routes (`/api/item/`)

### `/api/item/submit` - Submit Item Guess

- **POST**: Submit a guess for an item

### `/api/item/next` - Get Next Item

- **GET**: Get the next item to guess

## Challenge Routes (`/api/challenge/`)

### `/api/challenge/create` - Create Challenge

- **POST**: Create a new challenge from a guess

### `/api/challenge/[id]` - Challenge Details

- **GET**: Get challenge details by ID

## Leaderboard Routes (`/api/leaderboard/`)

### `/api/leaderboard/index` - Global Leaderboard

- **GET**: Get global leaderboard data

### `/api/leaderboard/user` - User Leaderboard Position

- **GET**: Get user's position on leaderboard

## Admin Routes (`/api/admin/`)

### `/api/admin/stats` - Admin Statistics

- **GET**: Get admin-level statistics

### `/api/admin/scrape` - Scrape Items

- **POST**: Trigger item scraping

### `/api/admin/add` - Add Items

- **POST**: Manually add items

### `/api/admin/item/stats` - Item Statistics

- **GET**: Get statistics for specific items
