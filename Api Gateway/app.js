const express = require("express");
const connectDB = require("./Config/db");
const port = process.env.PORT || 3000;
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const cors = require("cors");

connectDB()
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
  });

const app = express();
app.use(express.json());
app.use(cors());

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(400).json({ message: "Invalid token." });
  }
};

app.get("/", authMiddleware, (req, res) => {
  res.send("Hello from the Api Gateway!");
});

app.listen(port, () => {
  console.log(`Api Gateway listening on port ${port}`);
});
