# API Routes Documentation

This document lists the major API endpoints of the backend, categorized by their corresponding module.

## Base URL
Local: `http://localhost:3003`

---

## Authentication & User
| HTTP | Endpoint | Description |
|------|----------|-------------|
| POST | `/user/signup` | Register a new user account |
| POST | `/user/signin` | Log in and receive JWT credentials |
| POST | `/user/signout` | Invalidate current session/clear cookies |
| GET  | `/user/me` | Fetch authenticated user's profile |
| PATCH| `/user/update` | Update user profile information |

## Canine Management
| HTTP | Endpoint | Description |
|------|----------|-------------|
| POST | `/canine/register` | Register a new puppy or adult canine |
| GET  | `/canine/list` | Retrieve list of authorized canines |
| GET  | `/canine/:id` | Fetch detailed profile of a specific canine |
| PATCH| `/canine/:id` | Update canine details/health notes |
| DELETE| `/canine/:id` | Soft-delete or remove canine entry |

## Litter Management
| HTTP | Endpoint | Description |
|------|----------|-------------|
| POST | `/litter/create` | Register a new litter for a breed |
| GET  | `/litter/list` | List all litters owned by the user |
| GET  | `/litter/:id` | View specific litter and its puppies |

## Admin Management
| HTTP | Endpoint | Description |
|------|----------|-------------|
| GET  | `/admin/stats` | Dashboard statistics (Admin only) |
| GET  | `/admin/users` | List all registered users |
| PATCH| `/admin/verify/:id` | Verify/Approve a canine or litter |
| POST | `/admin/permissions` | Modify user roles and permissions |

---

## Swagger API Documentation
A complete and interactive documentation of ALL routes is available at:
`http://localhost:3003/docs`
(Run the server locally to access this URL)
