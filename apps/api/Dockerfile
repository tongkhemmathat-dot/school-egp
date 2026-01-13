FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/api/package.json ./apps/api/package.json
RUN npm install --workspaces --include-workspace-root
COPY . .
WORKDIR /app/apps/api
RUN npm run build
CMD ["node", "dist/main.js"]
