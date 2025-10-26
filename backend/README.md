# Family Meals Backend

NestJS + TypeORM service for the family ordering platform. Provides authentication, dish management, and order workflows.

## Run Locally

```bash
npm install
npm run start:dev
```

The API listens on `http://localhost:3000/api`. Copy `.env.example` to `.env` and update database credentials as needed.

## Modules

- `AuthModule`: username/password login issuing JWT tokens.
- `UsersModule`: create, list, and update administrator accounts.
- `MenuModule`: manage dishes by meal slot (activate, deactivate, adjust price).
- `OrdersModule`: create, update, cancel, and query orders by date and slot.

## Environment Variables

| Key | Description | Default |
| --- | --- | --- |
| `PORT` | API port | 3000 |
| `DB_HOST` / `DB_PORT` | PostgreSQL host & port | postgres / 5432 |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | Database credentials | postgres / postgres / family_meals |
| `JWT_SECRET` | JWT signing secret | family-meals-secret |
| `JWT_EXPIRES` | Token TTL | 7d |

## Docker

Bring up API + PostgreSQL with:

```bash
docker compose up --build
```

## Key Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST /api/auth/login` | Sign in, returns JWT |
| `POST /api/users` | Create admin user |
| `GET /api/menu/dishes` | List dishes (optional `slot` filter) |
| `POST /api/menu/dishes` | Create a dish |
| `GET /api/menu/slots/:slot` | Active dishes for a meal slot |
| `POST /api/orders` | Create an order |
| `GET /api/orders/by-date` | Orders by date and optional slot |
| `POST /api/orders/:id/cancel` | Cancel an order (before meal date) |

Check DTOs/controllers for full request details. Authenticated routes require `Authorization: Bearer <token>`.
