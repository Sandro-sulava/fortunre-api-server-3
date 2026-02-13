const mongoose = require("mongoose");

// Book Schema

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Book title is required"] },
    author: { type: String, required: [true, "Author title is required"] },
    genre: String,
    publishedYear: {
      type: Number,
      required: [true, ["Published year is required"]],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },

    // Who currently borrowed the book
    borrowedBy: {
      // 698a1c8c5b604a9110187da0
      type: mongoose.Schema.Types.ObjectId, // MongoDB's special ID type
      ref: "User", // tells Mongoose this field points to documents from the "users" collection
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Compile schema
const Book = mongoose.model("Book", bookSchema);

module.exports = Book;
