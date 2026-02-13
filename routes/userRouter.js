const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User.js");
const Book = require("../models/Book.js");

const userRouter = express.Router();

userRouter.post("/", async (req, res) => {
  try {
    const { name, email, isStudent } = req.body;

    // check if email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }

    const user = await User.create({ name, email, isStudent });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

userRouter.get("/", async (req, res) => {
  try {
    const users = await User.find();

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------
// Fetch single user by ID
// -------------------------------------------------
userRouter.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------
// Delete a user
// -------------------------------------------------
userRouter.delete("/:userId", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------
// Get All books currently borrowed by a user
// /api/v1/users/:userId/borrowed
// -------------------------------------------------
userRouter.get("/:userId/borrowed", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    //  {UserInfo}
    const user = await User.findById(userId).lean();

    if (!user) return res.status(404).json({ error: "User not found" });

    const books = await Book.find({ borrowedBy: userId }).lean();

    res
      .status(200)
      .json({ user: { name: user.name, email: user.email }, books });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = userRouter;
