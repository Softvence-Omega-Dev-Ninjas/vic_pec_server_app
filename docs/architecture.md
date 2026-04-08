# Backend Architecture Guide

This document describes the high-level architecture of the **Purebred Canine Registry (PCR)** backend application.

## Overview

The backend is built with **NestJS**, a progressive Node.js framework. It follows a highly modular design to ensure scalability, maintainability, and clear separation of concerns.

## Key Technologies

- **Language**: TypeScript
- **Framework**: NestJS
- **ORM**: Prisma (with PostgreSQL)
- **Security**: JWT (JSON Web Tokens) with Cookies
- **Validation**: `class-validator` & `class-transformer`
- **File Storage**: Cloudinary (Image uploads)
- **Payments**: Stripe API
- **Documentation**: Swagger (OpenAPI)

## Design Patterns

### Modular Architecture
The system is divided into functional units (Modules). Each module consists of:
1. **Module**: Registers controllers, services, and handles dependency injection.
2. **Controller**: Manages incoming requests, security guards, and response formatting.
3. **Service**: Contains reusable business logic and interacts with the database.
4. **DTO (Data Transfer Object)**: Defines schemas for request validation.

### Layered Responsibility
- **Controller Layer**: Handles HTTP-level logic (parameters, query, body, headers).
- **Service Layer**: Implements core business logic, validation, and data orchestration.
- **Database Layer**: Prisma handles abstraction for PostgreSQL.

## Authentication & Authorization

### JWT + Cookie Strategy
The system uses **JWT** for secure communication. The token is typically stored as an HTTP-only cookie to mitigate XSS risks.
1. **AuthGuard**: Protects sensitive routes by verifying the JWT.
2. **RolesGuard**: Restricts access based on the user's role (e.g., `ADMIN`, `OWNER`, `BREEDER`).

### Permissions System
For fine-grained access control, the system includes a `PermissionModule` that manages specific actions a user or role can perform.

## Real-Time Updates
The project uses **Socket.io** (`@nestjs/websockets`) for real-time notifications, such as when a canine registration is approved or a payment is successful.

---

## Conclusion
This architecture provides a robust foundation for the PCR system, enabling secure business logic and integration with critical external services like Stripe and Cloudinary.
