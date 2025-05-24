const express = require("express");
const connectDB = require("./Config/db");
const port = process.env.PORT || 3003;
const Comment = require("./Models/Comment");
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

app.get("/", (req, res) => {
  res.send("Hello from the Comment Service!");
});

app.post("/", authMiddleware, async (req, res) => {
  const { blogId, content } = req.body;

  const comment = new Comment({
    blogId,
    content,
    author: req.userId,
  });

  await comment.save();
  res.status(201).json({ message: "Comment added successfully" });
});

app.get("/:blogId", async (req, res) => {
  const comments = await Comment.find({ blogId: req.params.blogId }).populate(
    "author",
    "username"
  );
  res.json(comments);
});

app.listen(port, () => {
  console.log(`Comment Service listening on port ${port}`);
});
