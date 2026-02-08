FROM node:20-alpine

WORKDIR /app

# Copy root package.json and workspace configuration
COPY package.json ./
COPY packages/frontend/package.json ./packages/frontend/

# Install dependencies
RUN npm install

# Copy frontend source code
COPY packages/frontend ./packages/frontend

WORKDIR /app/packages/frontend

EXPOSE 3000

CMD ["npm", "run", "dev"]
