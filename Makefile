.PHONY: db/up db/down db/logs db/migrate db/generate db/studio db/deploy db/reset \
        prod/build prod/migrate prod/up prod/down prod/logs

BACKEND_DIR := apps/backend

# ──────────────────────────────────────────────
# Dev: local PostgreSQL via docker compose
# ──────────────────────────────────────────────
db/up:
	cd $(BACKEND_DIR) && docker compose up -d postgres

db/down:
	cd $(BACKEND_DIR) && docker compose down

db/logs:
	cd $(BACKEND_DIR) && docker compose logs -f postgres

# Prisma
db/migrate:
	cd $(BACKEND_DIR) && pnpm prisma migrate dev

db/generate:
	cd $(BACKEND_DIR) && pnpm prisma generate

db/studio:
	cd $(BACKEND_DIR) && pnpm prisma studio

db/deploy:
	cd $(BACKEND_DIR) && pnpm prisma migrate deploy

db/reset:
	cd $(BACKEND_DIR) && pnpm prisma migrate reset

# ──────────────────────────────────────────────
# Production: docker-compose.prod.yml
# Requires .env.production at the repo root.
# ──────────────────────────────────────────────
prod/build:
	docker compose -f docker-compose.prod.yml build

prod/migrate:
	docker compose -f docker-compose.prod.yml run --rm --no-deps migrate

prod/up:
	docker compose -f docker-compose.prod.yml up -d

prod/down:
	docker compose -f docker-compose.prod.yml down

prod/logs:
	docker compose -f docker-compose.prod.yml logs -f

# Full production deploy: build → migrate → start
prod/deploy: prod/build prod/migrate prod/up
