const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bookRouter = require("./routes/booksRouter.js");
const userRouter = require("./routes/userRouter.js");

// Load environment varriables from .env file
dotenv.config();

// Express instance
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Config File for MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("mongoDB connected");
  })
  .catch((err) => {
    console.log(err);
  });

// Routes
app.use("/api/v1/books", bookRouter);
app.use("/api/v1/users", userRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
