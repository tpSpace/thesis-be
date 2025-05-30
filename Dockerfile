FROM oven/bun:latest

WORKDIR /app

# Install OpenSSL
RUN apt-get update -y && \
    apt-get install -y openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY package.json ./
RUN bun install --production

# Copy rest of the application
COPY . .

# Generate Prisma client (only essential build step)
RUN bunx prisma generate

# Declare Environment Variables
ENV NODE_ENV=production
ENV PORT=4000 
ENV DATASOURCE_URL=
ENV ROLE_ADMIN_CODE=1
ENV ROLE_TEACHER_CODE=1
ENV ROLE_STUDENT_CODE=1
ENV CLIENT_ORIGIN=

# Use the PORT ENV for EXPOSE
EXPOSE ${PORT}

# Start the server
CMD ["bun", "src/index.js"]