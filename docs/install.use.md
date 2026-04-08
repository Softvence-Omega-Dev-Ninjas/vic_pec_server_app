# Setup & Usage Guide (Backend)

This document provides instructions on how to install and run the backend of the **Purebred Canine Registry (PCR)** project.

## Prerequisites
- **Node.js**: v18 or later
- **npm**: v8 or later
- **PostgreSQL**: Local database instance or a connection string
- **NestJS CLI** (Optional): `npm i -g @nestjs/cli`

## Installation

1. Clone the repository and navigate to the backend directory.
2. Install the project dependencies:
```bash
npm install
```
3. Configure the environment variables by creating a `.env` file in the root:
```env
PORT=3003
DATABASE_URL="postgresql://user:password@localhost:5432/vic_pec"
JWT_SECRET="your-super-secret-key"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
STRIPE_SECRET_KEY="your-stripe-secret"
```

## Database Setup (Prisma)

1. Generate the Prisma Client:
```bash
npx prisma generate
```
2. Sync the database with the schema:
```bash
npx prisma db push
```

## Running the Server

- **Development Mode** (with hot-reloading):
```bash
npm run start:dev
```
- **Production Mode**:
```bash
npm run build
npm run start:prod
```

## Testing & Quality
- Run all tests: `npm test`
- Run linting: `npm run lint`
- Format code: `npm run format`

## API Access
Once the server is running, the Swagger documentation will be available at:
`http://localhost:3003/docs`
