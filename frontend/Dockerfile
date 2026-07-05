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

# Note: If your React app uses client-side routing (React Router), 
# you typically need a custom nginx configuration to redirect all traffic to index.html.
# For now, we will expose port 80.
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]