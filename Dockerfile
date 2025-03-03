FROM oven/bun:latest

WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
RUN bun install --production

# Copy rest of the application
COPY . .

# Generate Prisma client (only essential build step)
RUN bunx prisma generate

EXPOSE 4000

# Start the server directly with Node (not nodemon for production)
CMD ["bun", "src/index.js"]