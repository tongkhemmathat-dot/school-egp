FROM node:20-bullseye
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y libreoffice libreoffice-calc poppler-utils && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/converter/package.json ./apps/converter/package.json
RUN npm install --workspaces --include-workspace-root
COPY . .
WORKDIR /app/apps/converter
RUN npm run build
EXPOSE 5000
CMD ["node", "dist/index.js"]
