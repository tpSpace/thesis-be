const { ApolloServer } = require("apollo-server-express");
const { PrismaClient } = require("@prisma/client");
const express = require("express");
const { DateTimeResolver } = require("graphql-scalars");

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

const app = express();
app.disable("x-powered-by");

const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || "http://localhost:3031",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};

const PORT = process.env.PORT || 4000;

async function startServer() {
  await server.start();
  server.applyMiddleware({ app, cors: corsOptions });
  app.listen(PORT, () => {
    console.log(
      `🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`
    );
  });
}

startServer();
