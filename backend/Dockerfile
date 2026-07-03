# Use the official Node.js Alpine image for a smaller footprint
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first
# This utilizes Docker's layer caching to speed up builds if dependencies haven't changed
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose the port your backend runs on (assuming 5000, adjust if different)
EXPOSE 5000

# Command to run the backend server
# Check your backend/package.json to see if you use "npm start" or "node server.js"
CMD ["npm", "start"]