# Backend Project Structure

This document outlines the directory structure and organization of the **Purebred Canine Registry (PCR)** backend.

## Directory Overview

```text
/
├── prisma/                 # Database schema and migration management
│   ├── migrations/         # SQL migration history
│   ├── model/              # Modularized Prisma schema parts (Breed, Canine, Litter, etc.)
│   └── schema.prisma       # Main Prisma entry point
├── src/                    # Source code of the application
│   ├── main/               # Core business logic modules
│   │   ├── admin/          # Administration modules (User management, stats, etc.)
│   │   ├── breed/          # Breed management logic
│   │   ├── canine/         # Canine registration and profile logic
│   │   ├── litter/         # Litter registration and management
│   │   ├── user/           # User authentication and profile logic
│   │   └── ...             # Other modules (Payment, Stripe, Mail, Report)
│   ├── cloudinary/         # Integration with Cloudinary for image storage
│   ├── decorator/          # Custom NestJS decorators (e.g., GetUser)
│   ├── guard/              # Authentication and authorization guards (JWT, Roles)
│   ├── notifications/      # Real-time and email notification system
│   ├── app.module.ts       # Root module of the application
│   ├── main.ts             # Application entry point
│   └── ...
├── .env                    # Environment variables (Sensitive - DO NOT COMMIT)
├── nest-cli.json           # NestJS CLI configuration
├── package.json            # Project dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

## Core Folders

### `prisma/`
The project uses **Prisma ORM**. Instead of a single massive schema file, logic is divided into files under `prisma/model/`. These are merged during the build process to maintain a clean database design.

### `src/main/`
Each subdirectory here represents a functional module of the application. A standard module includes:
- `module.ts`: Registers components.
- `controller.ts`: Defines API endpoints and handles HTTP requests.
- `service.ts`: Contains the business logic.
- `dto/`: Data Transfer Objects for validating incoming requests.

### `src/guard/`
Contains logic for protecting routes. Usually includes:
- `AuthGuard`: Ensures the user is logged in via JWT.
- `RolesGuard`: Restricts access to specific roles (e.g., ADMIN, OWNER).
