FROM node:20-bullseye
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/api/package.json ./apps/api/package.json
RUN npm install --workspaces --include-workspace-root
COPY . .
WORKDIR /app/packages/shared
RUN npm run build
WORKDIR /app/apps/api
RUN DATABASE_URL=postgresql://postgres:postgres@db:5432/school_egp npm run prisma:generate
RUN npm run build
RUN chmod +x /app/apps/api/docker-entrypoint.sh
ENTRYPOINT ["/app/apps/api/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
