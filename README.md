# Where Did Our Money Go API

REST API for a shared personal expense tracking application. This initial structure provides Express, MongoDB with mongoose, JWT authentication, Swagger documentation, and a layered architecture ready for future user stories.

## Tech Stack

- Node.js
- Express
- MongoDB
- mongoose
- JWT
- bcrypt
- Swagger/OpenAPI

## Project Structure

```text
src/
  config/
  controllers/
  docs/
  middlewares/
  models/
  routes/
  services/
  app.js
  server.js
```

## Environment

Create a local `.env` file based on `.env.example`.

```bash
PORT=3000
BASE_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/where-did-our-money-go
JWT_SECRET=change-me-in-local-env
JWT_EXPIRES_IN=1d
```

## Installation

```bash
npm install
```

## Running The API

Static start:

```bash
npm start
```

Development start with automatic restart on file changes:

```bash
npm run dev
```

## Available Endpoints

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /transactions`
- `POST /transactions`
- `DELETE /transactions/:id`
- `GET /transactions/summary`
- `GET /api-docs`

Protected routes require an `Authorization: Bearer <token>` header. The token is returned by the register and login endpoints.

## Family ID (`familyId`)

Each user belongs to one family; transactions are scoped by the `familyId` embedded in the JWT.

- **Registration**: `familyId` is optional. If you omit it or send an empty string, the API assigns a new id (format `fam-` plus 24 hex characters) and returns it with the user payload and token.
- **Joining an existing family**: send a `familyId` chosen by your product (for example a code shared between members). It must be a **lowercase slug**: 3–50 characters, letters and digits only, with optional single hyphens between segments (no leading/trailing hyphen, no underscores or spaces). Values are stored normalized in lowercase.
- **Login**: unchanged; `familyId` always comes from the stored user record.

## Categories

Transactions accept only these categories:

- `alimentação`
- `higiene`
- `limpeza`
- `lazer`
- `guloseimas`
- `bebidas`
- `transporte`
- `educação`
- `documentação`
- `outros`

## Swagger

The OpenAPI specification lives at `src/docs/swagger.yaml`.

When the API is running, Swagger UI is available at:

```text
http://localhost:3000/api-docs
```

## Notes For Deployment

This project is prepared to evolve toward GitHub Actions CI and Vercel deployment. Environment variables should be configured in the deployment platform rather than committed to the repository.

## Vercel Serverless Notes

- In Vercel, API handlers run in serverless functions (cold/warm starts), not in a single long-lived Node process.
- Auth operations (`/auth/register`, `/auth/login`) now force a MongoDB connection check before any `User.findOne` or `User.create`.
- The database connector caches in-flight connections to avoid race conditions during cold starts and concurrent invocations.

Required Vercel environment variables:

- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN` (optional, defaults to `1d`)
