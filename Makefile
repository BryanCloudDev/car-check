.PHONY: db/up db/down db/logs db/migrate db/generate db/studio db/deploy db/reset

BACKEND_DIR := apps/backend

# Docker
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
