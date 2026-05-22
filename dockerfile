# =========================
# Etapa 1: Build Angular
# =========================
FROM node:20 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

# =========================
# Etapa 2: NGINX
# =========================
FROM nginx:alpine

COPY --from=build /app/dist/arona-agricola/browser /usr/share/nginx/html

EXPOSE 80