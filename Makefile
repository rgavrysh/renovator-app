.PHONY: help install dev build test clean docker-up docker-down docker-logs

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies for all workspaces
	npm install

dev: ## Start development servers (frontend and backend)
	npm run dev

build: ## Build all workspaces
	npm run build

test: ## Run tests in all workspaces
	npm run test

clean: ## Clean node_modules and build artifacts
	rm -rf node_modules packages/*/node_modules packages/*/dist

docker-up: ## Start all Docker containers
	docker-compose up -d

docker-down: ## Stop all Docker containers
	docker-compose down

docker-logs: ## View Docker container logs
	docker-compose logs -f

docker-rebuild: ## Rebuild and restart Docker containers
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d
