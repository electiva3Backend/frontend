# ---- Primera Etapa: Construcción ----
FROM node:20-alpine AS build
WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./
RUN npm install

# Copia el resto del código y compila el proyecto para producción
COPY . .
RUN npm run build
# Nota: En Vite, esto genera una carpeta llamada 'dist' con tus archivos listos para producción.


# ---- Segunda Etapa: Servidor de Producción ----
FROM nginx:1.25-alpine

# Copia los archivos compilados de React hacia la carpeta pública de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copia la configuración de Nginx para que las rutas de React funcionen al recargar la página (F5)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]