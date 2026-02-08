FROM node:20-alpine

WORKDIR /app

# Copy root package.json and workspace configuration
COPY package.json ./
COPY packages/backend/package.json ./packages/backend/

# Install dependencies
RUN npm install

# Copy backend source code
COPY packages/backend ./packages/backend

WORKDIR /app/packages/backend

EXPOSE 4000

CMD ["npm", "run", "dev"]
