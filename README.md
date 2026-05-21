# ase251_RCO_CesiaLizarbe

# 🌐 Despliegue de Sistema Web en AWS EC2 con Docker

## 📌 Descripción del Proyecto

El sistema fue desplegado utilizando una arquitectura distribuida en AWS EC2, separando cada servicio en una instancia independiente para mejorar la organización, escalabilidad y mantenimiento.

## 🏗️ Arquitectura Utilizada

| Instancia EC2 | Servicio            |
| ------------- | ------------------- |
| EC2 #1        | SQL Server          |
| EC2 #2        | Backend Spring Boot |
| EC2 #3        | Frontend Angular    |

La comunicación entre servicios se realizó mediante IPs públicas (Elastic IP).

---

# 🚀 1. Creación de Instancias EC2

Se crearon 3 instancias EC2 con Ubuntu 24.04.

## Configuración utilizada

| Configuración | Valor             |
| ------------- | ----------------- |
| AMI           | Ubuntu 24.04      |
| Tipo          | t3.small          |
| Red           | VPC personalizada |
| IP            | Elastic IP        |

---

# 🔐 2. Configuración de Security Groups

## EC2 SQL Server

| Puerto | Uso        |
| ------ | ---------- |
| 22     | SSH        |
| 1433   | SQL Server |

## EC2 Backend

| Puerto | Uso             |
| ------ | --------------- |
| 22     | SSH             |
| 8085   | API Spring Boot |

## EC2 Frontend

| Puerto | Uso     |
| ------ | ------- |
| 22     | SSH     |
| 80     | Angular |

---

# 🐳 3. Instalación de Docker en las Instancias

## Actualizar paquetes

```bash
sudo apt update
```

## Instalar Docker y Docker Compose

```bash
sudo apt install docker.io docker-compose-v2 -y
```

## Agregar permisos Docker al usuario

```bash
sudo usermod -aG docker ubuntu
```

## Salir y volver a ingresar

```bash
exit
```

## Verificar instalación

```bash
docker --version
```

```bash
docker compose version
```

---

# 🗄️ 4. Despliegue de SQL Server (EC2 #1)

## Crear carpeta del proyecto

```bash
mkdir sqlserver
cd sqlserver
```

## Crear archivo docker-compose.yml

```bash
nano docker-compose.yml
```

## Contenido del docker-compose.yml

```yaml
version: '3'

services:
  sqlserver:
    image: cesia206/sql-server:2022
    container_name: sqlserver
    restart: always

    environment:
      ACCEPT_EULA: "Y"
      SA_PASSWORD: "Arona@123!"

    ports:
      - "1433:1433"

    volumes:
      - sql_data:/var/opt/mssql

volumes:
  sql_data:
```

## Levantar SQL Server

```bash
docker compose up -d
```

## Verificar contenedor

```bash
docker ps
```

## Ver logs si ocurre un error

```bash
docker logs sqlserver
```

---

# ☕ 5. Backend Spring Boot

## Ruta del proyecto

```text
C:\Users\OneDrive\Desktop\ASE251S3_T06-be
```

---

# 📦 6. Dockerfile Backend

## Archivo Dockerfile

```dockerfile
# =========================
# Etapa 1: Build Maven
# =========================
FROM cesia206/maven:3.9-amazoncorretto-25-alpine AS builder

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# =========================
# Etapa 2: Ejecutar aplicación
# =========================
FROM cristhianyj/eclipse-temurin:25-jre-alpine

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8085

ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

# 🏗️ 7. Construcción de Imagen Backend

## Construir imagen

```bash
docker build -t cesia206/springboot-sqlserver:1.0 .
```

## Verificar imágenes

```bash
docker images
```

## Login Docker Hub

```bash
docker login
```

## Subir imagen

```bash
docker push cesia206/springboot-sqlserver:1.0
```

---

# ⚙️ 8. Configuración application.properties

```properties
spring.datasource.url=${DATABASE_URL}

spring.datasource.username=${DATABASE_USERNAME}

spring.datasource.password=${DATABASE_PASSWORD}

spring.datasource.driver-class-name=${DATABASE_DRIVER}

server.port=${PORT:8085}
```

---

# 🚀 9. Despliegue Backend en EC2 #2

## Crear carpeta

```bash
mkdir backend
cd backend
```

## Crear docker-compose.yml

```bash
nano docker-compose.yml
```

## Contenido del docker-compose.yml

```yaml
version: '3'

services:

  backend:
    image: cesia206/springboot-sqlserver:1.0

    container_name: springboot-sqlserver

    restart: always

    ports:
      - "8085:8085"

    environment:
      PORT: 8085

      SERVER_URL: http://IP_PUBLICA_BACKEND:8085

      DATABASE_URL: jdbc:sqlserver://IP_PUBLICA_SQL:1433;databaseName=aronadb;encrypt=true;trustServerCertificate=true

      DATABASE_USERNAME: sa

      DATABASE_PASSWORD: "Arona@123!"

      DATABASE_DRIVER: com.microsoft.sqlserver.jdbc.SQLServerDriver
```

## Descargar imagen

```bash
docker pull cesia206/springboot-sqlserver:1.0
```

## Levantar backend

```bash
docker compose up -d
```

## Verificar contenedor

```bash
docker ps
```

## Ver logs

```bash
docker logs -f springboot-sqlserver
```

---

# 🅰️ 10. Frontend Angular

## Ruta del proyecto

```text
C:\Users\OneDrive\Desktop\ASE251S3_T06-fe
```

---

# 🌍 11. Configuración de environment.ts

## environment.ts

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://IP_PUBLICA_BACKEND:8085/api'
};
```

## environment.prod.ts

```typescript
export const environment = {
  production: true,
  apiUrl: 'http://IP_PUBLICA_BACKEND:8085/api'
};
```

---

# 🐳 12. Dockerfile Frontend Angular

## Archivo Dockerfile

```dockerfile
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
```

---

# 🚫 13. Archivo .dockerignore

## Crear archivo .dockerignore

```text
node_modules
dist
.angular
.git
.vscode
```

---

# 🏗️ 14. Construcción de Imagen Frontend

## Generar build Angular

```bash
npm run build
```

## Construir imagen Docker

```bash
docker build -t cesia206/angular-frontend:1.0 .
```

## Verificar imágenes

```bash
docker images
```

## Subir imagen Docker Hub

```bash
docker push cesia206/angular-frontend:1.0
```

---

# 🌐 15. Despliegue Frontend en EC2 #3

## Crear carpeta

```bash
mkdir frontend
cd frontend
```

## Crear docker-compose.yml

```bash
nano docker-compose.yml
```

## Contenido del docker-compose.yml

```yaml
version: '3'

services:

  frontend:
    image: cesia206/angular-frontend:1.0

    container_name: angular-frontend

    restart: always

    ports:
      - "80:80"
```

## Descargar imagen

```bash
docker pull cesia206/angular-frontend:1.0
```

## Levantar frontend

```bash
docker compose up -d
```

## Verificar contenedor

```bash
docker ps
```

---

# ✅ 16. Verificación Final

## Backend

```text
http://IP_PUBLICA_BACKEND:8085
```

## Swagger

```text
http://IP_PUBLICA_BACKEND:8085/swagger-ui/index.html
```

## Frontend

```text
http://IP_PUBLICA_FRONTEND
```

---

# 🐋 17. Docker Hub

## Imágenes utilizadas

| Imagen              | Nombre                            |
| ------------------- | --------------------------------- |
| Backend Spring Boot | cesia206/springboot-sqlserver:1.0 |
| Frontend Angular    | cesia206/angular-frontend:1.0     |
| SQL Server          | cesia206/sql-server:2022          |

---

# 🎯 19. Resultado Final

El sistema fue desplegado exitosamente utilizando:

* Docker
* Docker Compose
* AWS EC2
* Angular
* Spring Boot
* SQL Server
* Docker Hub

La arquitectura final quedó distribuida en 3 servidores independientes conectados mediante IPs públicas de AWS, permitiendo la comunicación entre frontend, backend y base de datos de manera correcta.
