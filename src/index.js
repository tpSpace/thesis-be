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

const resolvers = {
  Query: Query,
  Mutation: Mutation,
  DateTime: DateTimeResolver,
};

const app = express();
app.disable("x-powered-by");

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
    "http://34.92.234.88:4000/graphql",
    "http://34.92.234.88:4000", // Added for direct access
    "http://34.96.173.121",
    "http://34.96.173.121:80",
    "http://34.96.173.121:3000",
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
}

startServer();
