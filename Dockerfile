# Use the official Node.js image as the base image
FROM node:16

# Set the working directory inside the container
WORKDIR /training_ms

# Copy package.json and yarn.lock into the working directory
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the project files into the container
COPY . .

# Build the TypeScript code (if needed)
RUN yarn build

# Expose the port the app will run on
EXPOSE 8000

# Start the application
CMD ["yarn", "start"]
