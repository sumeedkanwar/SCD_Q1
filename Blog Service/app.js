const express = require("express");
const connectDB = require("./Config/db");
const port = process.env.PORT || 3002;
const Blog = require("./Models/Blog");
const View = require("./Models/View");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const dotenv = require("dotenv");

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

const authOriginalUser = (req, res, next) => {
  const { blogId } = req.params;

  Blog.findById(blogId)
    .then((blog) => {
      if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
      }
      if (blog.author.toString() !== req.userId) {
        return res
          .status(403)
          .json({ message: "You are not authorized to delete this blog" });
      }
      next();
    })
    .catch((err) => {
      return res.status(500).json({ message: "Server error" });
    });
};

app.get("/", (req, res) => {
  res.send("Hello from the Blog Service!");
});

app.post("/", authMiddleware, async (req, res) => {
  const { title, content } = req.body;

  const blog = new Blog({ title, content, author: req.userId });
  await blog.save();

  const blogView = new View({ blogId: blog._id });
  await blogView.save();

  res.status(201).json({ message: "Blog created successfully" });
});

app.post("/create", async (req, res) => {
  const { title, content, author } = req.body;

  const blog = new Blog({ title, content, author });
  await blog.save();

  res.status(201).json({ message: "Blog created successfully" });
});

app.post(
  "/delete/:blogId",
  authMiddleware,
  authOriginalUser,
  async (req, res) => {
    const { blogId } = req.params;

    const blog = await Blog.find().findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    if (blog.author.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this blog" });
    }
    await blog.remove();
    await View.deleteOne({ blogId });
    res.status(200).json({ message: "Blog deleted successfully" });
  }
);

app.get("/", async (req, res) => {
  const blogs = await Blog.find().populate("author", "username");
  res.json(blogs);
});

app.post("/view/:blogId", async (req, res) => {
  const { blogId } = req.params;
  const view = await View.findOne({ blogId });

  if (view) {
    view.views++;
    await view.save();
  } else {
    const newView = new View({ blogId, views: 1 });
    await newView.save();
  }

  res.status(200).json({ message: "View count incremented" });
});

app.listen(port, () => {
  console.log(`Blog Service listening on port ${port}`);
});
