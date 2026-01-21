FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Using npm install instead of npm ci for development flexibility
# package-lock.json exists but npm install is more forgiving in dev environments
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port Vite runs on
EXPOSE 3000

# Start the Vite dev server
CMD ["npm", "run", "dev"]
