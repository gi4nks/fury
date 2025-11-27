# Fury - Bookmark Organizer Makefile
# A comprehensive build and development automation tool

.PHONY: help install dev build start lint type-check clean db-setup db-migrate db-generate db-reset test setup

# Default target
help: ## Show this help message
	@echo "Fury - Bookmark Organizer"
	@echo ""
	@echo "Available targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Installation and Setup
install: ## Install all dependencies
	npm install

setup: install db-setup ## Complete project setup (install deps + setup database)
	@echo "✅ Project setup complete!"
	@echo "Run 'make dev' to start the development server"

# Development
dev: ## Start development server
	npm run dev

build: ## Build for production
	npm run build

start: ## Start production server
	npm run start

# Code Quality
lint: ## Run ESLint
	npm run lint

type-check: ## Run TypeScript type checking
	npx tsc --noEmit

check: lint type-check ## Run all code quality checks

# Database Operations
db-setup: ## Setup database (generate client + run migrations)
	npm run prisma:generate
	npm run prisma:migrate

db-migrate: ## Run database migrations
	npm run prisma:migrate

db-generate: ## Generate Prisma client
	npm run prisma:generate

db-reset: ## Reset database (WARNING: This will delete all data)
	@echo "⚠️  This will delete all data in the database!"
	@read -p "Are you sure? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		npx prisma migrate reset --force; \
	else \
		echo "Database reset cancelled."; \
	fi

db-studio: ## Open Prisma Studio
	npx prisma studio

# Testing (placeholder for future tests)
test: ## Run tests (when implemented)
	@echo "No tests implemented yet"

# Cleanup
clean: ## Clean build artifacts and caches
	rm -rf .next
	rm -rf node_modules/.cache
	rm -f tsconfig.tsbuildinfo

clean-db: ## Clean database files
	rm -f prisma/dev.db
	rm -f prisma/dev.db-journal

clean-all: clean clean-db ## Clean everything (build + db + node_modules)
	rm -rf node_modules
	rm -f package-lock.json

# Development Workflow
dev-full: check db-setup dev ## Full development workflow (check code + setup db + start dev server)

# Production Deployment
prod-build: check build ## Production build with checks
	@echo "✅ Production build ready!"

# Utility
deps-update: ## Update all dependencies
	npm update

deps-audit: ## Check for security vulnerabilities
	npm audit

deps-fix: ## Fix security vulnerabilities automatically
	npm audit fix

# Environment
env-check: ## Check environment variables
	@echo "Checking environment variables..."
	@if [ -z "$$OPENAI_API_KEY" ]; then \
		echo "⚠️  OPENAI_API_KEY not set (AI features will be limited)"; \
	else \
		echo "✅ OPENAI_API_KEY is set"; \
	fi

# Information
info: ## Show project information
	@echo "Fury - Bookmark Organizer"
	@echo "========================"
	@echo "Node version: $$(node --version)"
	@echo "NPM version: $$(npm --version)"
	@echo "Next.js version: $$(npm list next | head -1 | awk -F@ '{print $$2}')"
	@echo "Prisma version: $$(npm list prisma | head -1 | awk -F@ '{print $$2}')"
	@echo ""
	@echo "Database: SQLite (prisma/dev.db)"
	@echo "Development server: http://localhost:3000"