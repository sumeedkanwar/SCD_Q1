const express = require("express");
const connectDB = require("./Config/db");
const port = process.env.PORT || 3004;
const User = require("./Models/User");
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

const authOriginalUser = (req, res, next) => {
  const { username } = req.params;
  User.findOne({ username })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user._id.toString() !== req.userId) {
        return res
          .status(403)
          .json({ message: "You are not authorized to delete this user" });
      }
      next();
    })
    .catch((err) => {
      return res.status(500).json({ message: "Server error" });
    });
};

app.get("/", (req, res) => {
  res.send("Hello from the Profile Service!");
});

app.post("/", authMiddleware, authOriginalUser, async (req, res) => {
  const { bio, avatar } = req.body;

  const user = await User.findById(req.userId);
  if (bio) user.profile.bio = bio;
  if (avatar) user.profile.avatar = avatar;

  await user.save();
  res.status(200).json({ message: "Profile updated successfully" });
});

app.get("/", authMiddleware, async (req, res) => {
  const user = await User.findById(req.userId);
  res.json(user.profile);
});

app.listen(port, () => {
  console.log(`Profile Service listening on port ${port}`);
});
