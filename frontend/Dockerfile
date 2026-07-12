# -----------------------------
# Stage 1: Build the React App
# -----------------------------
FROM node:22-alpine as build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Declare build-time arguments for Vite env vars
# These must be passed via --build-arg or docker-compose build args
ARG VITE_API_URL

# Make them available as environment variables during the npm build
ENV VITE_API_URL=$VITE_API_URL

# Build the Vite project for production (creates the /dist folder)
RUN npm run build

# -----------------------------
# Stage 2: Serve with Nginx
# -----------------------------
FROM nginx:alpine

# Remove default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the static files from the build stage to Nginx's serving directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx config to handle React Router client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]