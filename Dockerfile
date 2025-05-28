FROM oven/bun:latest

WORKDIR /app

# Copy package files and install dependencies
COPY package.json bun.lockb ./
RUN bun install --production

# Copy rest of the application
COPY . .

# Generate Prisma client (only essential build step)
RUN bunx prisma generate

# Declare Environment Variables
# These will be expected by your application.
# Actual values for many of these should be supplied by Kubernetes at runtime.
ENV NODE_ENV=production
ENV PORT=4000 
# Default port, can be overridden by Kubernetes
ENV DATASOURCE_URL=
ENV ROLE_ADMIN_CODE=1
ENV ROLE_TEACHER_CODE=1
ENV ROLE_STUDENT_CODE=1
ENV CLIENT_ORIGIN=

# Use the PORT ENV for EXPOSE
EXPOSE ${PORT}

# Start the server
# Ensure your application (src/index.js) uses process.env.PORT, process.env.DATASOURCE_URL, etc.
CMD ["bun", "src/index.js"]