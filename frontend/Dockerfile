# ---- build stage ----
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# If you still use REACT_APP_API_BASE_URL in code, consider making calls relative ("/api")
# and omit this env in production builds. Otherwise you can pass it at build time:
ARG REACT_APP_API_BASE_URL=/
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
RUN npm run build

# ---- runtime stage ----
FROM nginx:alpine
# SPA-friendly nginx config with API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Static assets
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
