include .env
export

UI_DIR := $(shell pwd)
export UI_DIR

export AP_ENVIRONMENT=$(ENVIRONMENT)
export AP_DEV_BLOCKS=$(WORKFLOW_DEV_BLOCKS)
export AP_BLOCKS_SOURCE=FILE
export AP_TELEMETRY_ENABLED=false
export AP_SENTRY_DSN=
export AP_DB_TYPE=POSTGRES
export AP_POSTGRES_DATABASE=$(POSTGRES_NAME)
export AP_POSTGRES_HOST=$(POSTGRES_HOST)
export AP_POSTGRES_PASSWORD=$(POSTGRES_PASSWORD)
export AP_POSTGRES_PORT=$(POSTGRES_PORT)
export AP_POSTGRES_USERNAME=$(POSTGRES_USER)
export AP_EXECUTION_MODE=SANDBOX_CODE_ONLY
export AP_ENCRYPTION_KEY=$(WORKFLOW_ENCRYPTION_KEY)
export AP_FRONTEND_URL=http://127.0.0.1:4200/
export AP_JWT_SECRET=$(WORKFLOW_JWT_SECRET)
export AP_REDIS_HOST=$(SESSION_REDIS_HOST)
export AP_REDIS_PORT=$(SESSION_REDIS_PORT)
export AP_REDIS_DB=$(SESSION_REDIS_DB)
export AP_QUEUE_MODE=REDIS

build-ui:
	source ~/.nvm/nvm.sh \
		&& cd frontend \
		&& nvm install \
		&& nvm use \
		&& npm i --legacy-peer-deps \
		&& npm run build

dev-ui:
	source ~/.nvm/nvm.sh \
		&& cd frontend \
		&& nvm use \
		&& rm -rf build \
		&& HTTPS=true npm run start

build-general-editor:
	cd general-editor \
		&& npm i --legacy-peer-deps \
		&& npm run build:module

build-react-image-annotate:c
	cd react-image-annotate \
		&& npm i --legacy-peer-deps \
		&& npm run build

build-tool-llm-editor:
	cd tool-llm-editor \
		&& npm i --legacy-peer-deps \
		&& npm run build

build-three-dimensional-editor:
	cd three-dimensional-editor \
		&& npm i --legacy-peer-deps \
		&& npm run build

migrate:
	python3 migrate.py

setup: build-ui \
	build-general-editor \
	build-react-image-annotate \
	build-tool-llm-editor \
	build-three-dimensional-editor

	python3 -m pip install aixblock_core \
		&& python3 setup_core.py

worker:
	python3 worker.py

run:
	python3 main.py

reset-workflow:
	cd workflow \
		&& rm -rf .nx cache dist node_modules tmp package-lock.json

install-workflow: reset-workflow
	source ~/.nvm/nvm.sh \
		&& cd workflow \
		&& chmod +x ./bin/post-install \
		&& nvm install \
		&& nvm use \
		&& npm install \
		&& pnpm store add @tsconfig/node18@1.0.0 @types/node@18.17.1 typescript@4.8.4

workflow-frontend:
	source ~/.nvm/nvm.sh \
		&& cd workflow \
		&& nvm use \
		&& npm run serve:frontend

workflow-engine:
	source ~/.nvm/nvm.sh \
		&& cd workflow \
		&& nvm use \
		&& npm run serve:engine

workflow-backend:
	source ~/.nvm/nvm.sh \
		&& cd workflow \
		&& nvm use \
		&& npm run serve:backend
