const { ApolloServer } = require("apollo-server-express");
const { PrismaClient } = require("@prisma/client");
const express = require("express");
const { DateTimeResolver } = require("graphql-scalars");
const cors = require("cors");

const fs = require("fs");
const path = require("path");

const { getUserId, getUserRoleId } = require("./utils/jwt");

const Query = require("./resolvers/Query");
const Mutation = require("./resolvers/Mutation");

const prisma = new PrismaClient();

// Database initialization function
async function initializeDatabase() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Run Prisma migrations
    const { execSync } = require('child_process');
    try {
      console.log('🔄 Running database migrations...');
      execSync('bunx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✅ Database migrations completed successfully');
    } catch (error) {
      console.error('❌ Error running migrations:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

const resolvers = {
  Query: Query,
  Mutation: Mutation,
  DateTime: DateTimeResolver,
};

const app = express();
app.disable("x-powered-by");

// Add IP logging middleware
app.use((req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress;
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Request from IP: ${ip}, Path: ${req.path}, Method: ${req.method}`);
  next();
});

const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// CORS configuration for ingress setup
const corsOptions = {
  // Allow both direct access and via the ingress
  origin: [
    "http://localhost:3031",
    "http://localhost:3000",
    "https://app.example.com", // Your ingress host
    "http://app.example.com", // Non-SSL version
    "http://34.96.244.61:4000/graphql",
    "http://34.96.244.61:4000", // Added for direct access
    "http://34.96.173.121",
    "http://34.96.173.121:80",
    "http://34.96.173.121:3000",
    "http://10.28.3.1:4000",
    "http://10.28.3.1",
    "http://34.150.28.208/",
    "http://34.150.28.208:3000",
    "http://34.96.173.121:4000/graphql",
  ],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  exposedHeaders: ["set-cookie"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Simple health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Simple health check endpoint
app.get("/hello", (req, res) => {
  res.status(200).send("hello");
});

const server = new ApolloServer({
  typeDefs: fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf-8"),
  resolvers,
  context: ({ req, res }) => {
    return {
      ...req,
      ...res,
      prisma,
      userId: req && req.headers.authorization ? getUserId(req) : null,
      roleId: req && req.headers.authorization ? getUserRoleId(req) : null,
    };
  },
});

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Initialize database first
    await initializeDatabase();

    await server.start();
    // Pass cors: false since we're handling it at the Express level
    server.applyMiddleware({
      app,
      cors: false,
      // Important: Match the path from your ingress configuration
      path: "/api/graphql",
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server ready at http://localhost:${PORT}/api/graphql`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
// process.on('SIGINT', async () => {
//   console.log('Shutting down server...');
//   await prisma.$disconnect();
//   process.exit(0);
// });

// process.on('SIGTERM', async () => {
//   console.log('Shutting down server...');
//   await prisma.$disconnect();
//   process.exit(0);
// });

startServer();
