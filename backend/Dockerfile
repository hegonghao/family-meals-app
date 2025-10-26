# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: run
FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
# 复制种子脚本需要的依赖（开发依赖中的ts-node）
RUN npm install ts-node typescript @types/node --save-dev
# 复制源文件以支持种子脚本
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
CMD ["node", "dist/main.js"]
