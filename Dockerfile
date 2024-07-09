# Build application with Webpack
FROM node:20 AS build

WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the application with Webpack
RUN npm run build

# Create production image
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy 'server.js' from build stage
COPY --from=build /usr/src/app/server.js ./server.js

# Copy 'dist' directory from build stage
COPY --from=build /usr/src/app/dist ./dist

# Install only production dependencies (using npm ci)
COPY package*.json ./
RUN npm i --omit=dev

# Expose port
EXPOSE 3000
EXPOSE 3030

# Command to run the server
CMD ["node", "server.js"]