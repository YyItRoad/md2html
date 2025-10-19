# Use an official Node.js runtime as a parent image
FROM node:22-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm

# Copy manifests and config files first to leverage Docker cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages/config/ ./packages/config/

# Copy only the necessary packages for the api service
COPY packages/api/ ./packages/api/
COPY packages/core/ ./packages/core/
COPY packages/shared/ ./packages/shared/
COPY patches/ ./patches/

# Install all dependencies based on the copied packages
RUN pnpm install

# Change to the api package directory
WORKDIR /usr/src/app/packages/api

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["pnpm", "dev"]
