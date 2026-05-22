# 🌱 Arona Agrícola — Sistema Web en AWS EC2 con Docker

> Sistema de gestión agrícola desplegado en arquitectura distribuida usando Docker, AWS EC2, Angular y Spring Boot.

---

## 👥 Integrantes

| Nombre |
|--------|
| Cesia Lizarbe Mesajil |
| Cristhian Yaranga Julian |
| Shawn Manrique Rojas |

---

## 📋 Descripción del Proyecto

**Arona Agrícola** es una plataforma web de gestión para la Sociedad Agrícola Arona S.A. Permite a administradores y encargados gestionar campos de cultivo, producción, enfermedades, calidad de cosecha y actividades en tiempo real.

El sistema fue desplegado en **3 instancias EC2 independientes en AWS**, cada una corriendo un servicio en Docker:

| Instancia | Servicio |
|-----------|----------|
| EC2 #1 | SQL Server 2022 |
| EC2 #2 | Backend Spring Boot |
| EC2 #3 | Frontend Angular |

La comunicación entre servicios se realiza mediante **Elastic IPs públicas de AWS**.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** Angular 17+ (servido con NGINX)
- **Backend:** Spring Boot (Java, API REST)
- **Base de Datos:** SQL Server 2022
- **Contenedores:** Docker + Docker Compose
- **Cloud:** AWS EC2 (Ubuntu 24.04, instancias t3.small)
- **Registro de imágenes:** Docker Hub
- **Documentación API:** Swagger / OpenAPI 3.1

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                     AWS Cloud                       │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │   EC2 #1     │  │   EC2 #2     │  │  EC2 #3   │  │
│  │  SQL Server  │◄─│  Spring Boot │◄─│  Angular  │  │
│  │  Port: 1433  │  │  Port: 8085  │  │  Port: 80 │  │
│  └──────────────┘  └──────────────┘  └───────────┘  │
│   Elastic IP        Elastic IP        Elastic IP     │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 Configuración de Security Groups

### EC2 #1 — SQL Server
| Puerto | Protocolo | Uso |
|--------|-----------|-----|
| 22 | TCP | SSH |
| 1433 | TCP | SQL Server |

### EC2 #2 — Backend Spring Boot
| Puerto | Protocolo | Uso |
|--------|-----------|-----|
| 22 | TCP | SSH |
| 8085 | TCP | Spring Boot API |

### EC2 #3 — Frontend Angular
| Puerto | Protocolo | Uso |
|--------|-----------|-----|
| 22 | TCP | SSH |
| 80 | TCP | Angular (NGINX) |

---

## 🌐 Comunicación entre Servicios

La comunicación entre servicios se realiza mediante **IPs Elásticas (Elastic IPs) públicas de AWS**. El Backend se conecta al SQL Server mediante su IP pública en el puerto 1433, y el Frontend apunta al Backend mediante su IP pública en el puerto 8085.

Cadena de conexión del Backend:
```
jdbc:sqlserver://IP_PUBLICA_SQL:1433;databaseName=aronadb;encrypt=true;trustServerCertificate=true
```

---

## 🔧 Variables de Entorno Utilizadas

### Backend (Spring Boot)
| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servidor (8085) |
| `SERVER_URL` | URL pública del backend |
| `DATABASE_URL` | Cadena de conexión JDBC a SQL Server |
| `DATABASE_USERNAME` | Usuario de la base de datos (`sa`) |
| `DATABASE_PASSWORD` | Contraseña de la base de datos |
| `DATABASE_DRIVER` | Driver JDBC (`com.microsoft.sqlserver.jdbc.SQLServerDriver`) |

### SQL Server
| Variable | Descripción |
|----------|-------------|
| `ACCEPT_EULA` | Aceptación de licencia (`Y`) |
| `SA_PASSWORD` | Contraseña del usuario `sa` |

---

## 🐳 Imágenes Docker Hub

| Servicio | Imagen |
|----------|--------|
| SQL Server | `cesia206/sql-server:2022` |
| Backend Spring Boot | `cesia206/springboot-sqlserver:1.0` |
| Frontend Angular | `cesia206/angular-frontend:1.0` |

---

## 🚀 Pasos de Despliegue

### 1. Instalación de Docker en cada EC2

```bash
sudo apt update
sudo apt install docker.io docker-compose-v2 -y
sudo usermod -aG docker ubuntu
exit
# Volver a conectarse por SSH
docker --version
docker compose version
```

---

### 2. EC2 #1 — SQL Server

```bash
mkdir sqlserver && cd sqlserver
nano docker-compose.yml
```

**`docker-compose.yml`:**
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

```bash
docker compose up -d
docker ps
# Si falla:
docker logs sqlserver
```

---

### 3. EC2 #2 — Backend Spring Boot

#### Dockerfile del Backend

```dockerfile
# Stage 1: Build with Maven
FROM cesia206/maven:3.9-amazoncorretto-25-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run with Java
FROM cristhianyj/eclipse-temurin:25-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8085
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### Construir y subir imagen

```bash
docker build -t cesia206/springboot-sqlserver:1.0 .
docker login
docker push cesia206/springboot-sqlserver:1.0
```

#### Desplegar en EC2 #2

```bash
mkdir backend && cd backend
nano docker-compose.yml
```

**`docker-compose.yml`:**
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
      DATABASE_PASSWORD: Arona@123!
      DATABASE_DRIVER: com.microsoft.sqlserver.jdbc.SQLServerDriver
```

```bash
docker pull cesia206/springboot-sqlserver:1.0
docker compose up -d
docker ps
docker logs -f springboot-sqlserver
```

---

### 4. EC2 #3 — Frontend Angular

#### Configuración `environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://44.205.1.117:8085/api'
};
```

#### Dockerfile del Frontend

```dockerfile
# Etapa 1: Build Angular
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Etapa 2: NGINX
FROM nginx:alpine
COPY --from=build /app/dist/arona-agricola/browser /usr/share/nginx/html
EXPOSE 80
```

#### `.dockerignore`

```
node_modules
dist
.angular
.git
.vscode
```

#### Construir y subir imagen

```bash
npm run build
docker build -t cesia206/angular-frontend:1.0 .
docker push cesia206/angular-frontend:1.0
```

#### Desplegar en EC2 #3

```bash
mkdir frontend && cd frontend
nano docker-compose.yml
```

**`docker-compose.yml`:**
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

```bash
docker pull cesia206/angular-frontend:1.0
docker compose up -d
docker ps
```

---

## 📸 Evidencia de Funcionamiento

### ✅ Backend — Swagger UI (API funcionando en EC2 #2)
<img width="1568" height="784" alt="image" src="https://github.com/user-attachments/assets/9d2c1b09-f41d-4aa0-9ba9-9e3076b22a82" />

---

### ✅ Frontend — Dashboard Principal (Angular en EC2 #3)
<img width="1568" height="783" alt="image" src="https://github.com/user-attachments/assets/781c1178-5252-4316-a1f7-ae1a062d8fec" />

---

### ✅ Build Docker imagen Angular en VS Code
<img width="1512" height="786" alt="image" src="https://github.com/user-attachments/assets/41f0b55f-9959-4a5c-935c-6ed031480837" />

---

### ✅ Base de Datos — SQL Server ejecutándose (EC2 #1)
<img width="1568" height="710" alt="image" src="https://github.com/user-attachments/assets/07b0c020-9a6a-4a41-b577-443e842d6f40" />

---

### ✅ Docker Compose en las 3 instancias EC2
<img width="1512" height="802" alt="image" src="https://github.com/user-attachments/assets/27267bbc-2b94-4478-bb4f-db8c47620836" />

---

## ✅ Resultado Final

El sistema fue desplegado exitosamente con:

- ✅ Docker + Docker Compose en 3 instancias EC2
- ✅ SQL Server 2022 corriendo en contenedor con volumen persistente
- ✅ Spring Boot API REST documentada con Swagger (OAS 3.1)
- ✅ Frontend Angular servido con NGINX
- ✅ Imágenes publicadas en Docker Hub
- ✅ Comunicación entre servicios mediante Elastic IPs de AWS
- ✅ Arquitectura distribuida en 3 servidores independientes
