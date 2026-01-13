FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/api/package.json ./apps/api/package.json
RUN npm install --workspaces --include-workspace-root
COPY . .
WORKDIR /app/apps/api
RUN DATABASE_URL=postgresql://postgres:postgres@db:5432/school_egp npm run prisma:generate
RUN npm run build
CMD ["node", "dist/main.js"]
