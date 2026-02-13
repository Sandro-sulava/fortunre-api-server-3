const express = require("express");
const mongoose = require("mongoose");
const Book = require("../models/Book.js");
const User = require("../models/User.js");

const bookRouter = express.Router();

// ! Fetch All Books

bookRouter.get("/", async (req, res) => {
  try {
    const books = await Book.find();

    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ! Create book
bookRouter.post("/", async (req, res) => {
  try {
    const { title, author, genre, isAvailable, publishedYear } = req.body;

    // TITLE !== string min 1 symbol ------

    const existingBook = await Book.findOne({ title, author });

    if (existingBook) {
      return res.status(409).json({ error: "Book already exist" });
    }

    const book = await Book.create({
      title,
      author,
      genre,
      isAvailable,
      publishedYear,
    });

    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ! Delete Book
bookRouter.delete("/:bookId", async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.bookId);
    res.status(200).json({ message: "Book deleted successfully", data: book });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ! Get single Book
bookRouter.get("/:bookId", async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ! Update book
bookRouter.put("/:bookId", async (req, res) => {
  try {
    const bookUpdated = await Book.findByIdAndUpdate(
      req.params.bookId,
      req.body,
      { new: true },
    );

    res.status(200).json(bookUpdated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ! Borrow a book
// /api/v1/books/698a1cf2911fb79722b20730/borrow/698cc917c27fe58b8ad74442
// POST
// /api/v1/books/:bookId/borrow/:userId
//
bookRouter.post("/:bookId/borrow/:userId", async (req, res) => {
  try {
    // {bookId: "698a1c8c5b604a9110187da0", userId:"228a1c8c5b604a9110187da0" }
    const { bookId, userId } = req.params;

    // 1) Validate IDs early (helps beginners avoid confusing errors)
    // mongoose.isValidObjectId("507f1f77bcf86cd799439011"); // true
    // mongoose.isValidObjectId("not-an-id"); // false
    // mongoose.isValidObjectId("123"); // false

    if (
      !mongoose.isValidObjectId(bookId) ||
      !mongoose.isValidObjectId(userId)
    ) {
      return res.status(400).json({ error: "Invalid bookId or userId" });
    }

    // 2) Make sure the user exists
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ error: "User not found" });

    // 2.5) **Check how many books the user already borrowed**
    const borrowCount = await Book.countDocuments({ borrowedBy: userId });
    if (borrowCount > 2) {
      return res
        .status(409)
        .json({ error: "User has reached max borrow limit (2 book)" });
    }

    // 3) Atomically claim the book if it's available
    //    We filter by: _id matches AND isAvailable is true AND borrowedBy is null
    //    If another request already took it, this will return null.
    const updated = await Book.findOneAndUpdate(
      { _id: bookId, isAvailable: true, borrowedBy: null },
      // $set is a MongoDB operator to update specific fields without overwriting the whole document
      { $set: { isAvailable: false, borrowedBy: userId } },
      { new: true },
    );

    // Either book doesn't exist OR it was already borrowed
    if (!updated) {
      return res
        .status(409)
        .json({ error: "Book is already borrowed or dont exist" });
    }

    await updated.populate("borrowedBy", "name email");

    res.status(200).json({
      message: `Book borowed by ${updated.borrowedBy.name}`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ! return a book
// /api/v1/books/698a1c8c5b604a9110187da0/return
// POST
// /api/v1/books/:bookId/return
//

bookRouter.post("/:bookId/return", async (req, res) => {
  try {
    // {bookId: "698a1c8c5b604a9110187da0" }
    const { bookId } = req.params;

    // 1) Validate IDs early (helps beginners avoid confusing errors)
    // mongoose.isValidObjectId("507f1f77bcf86cd799439011"); // true
    // mongoose.isValidObjectId("not-an-id"); // false
    // mongoose.isValidObjectId("123"); // false

    if (!mongoose.isValidObjectId(bookId)) {
      return res.status(400).json({ error: "Invalid bookId or userId" });
    }

    // Only return if the book is currently marked as borrowed
    const updated = await Book.findOneAndUpdate(
      { _id: bookId, isAvailable: false },
      { $set: { isAvailable: true, borrowedBy: null } },
      { new: true },
    );

    // Either book doesn't exist OR it was already borrowed
    if (!updated) {
      return res
        .status(409)
        .json({ error: "Book is not currently borrowed or dont exist" });
    }

    res.status(200).json({ message: "Book returned", data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = bookRouter;
