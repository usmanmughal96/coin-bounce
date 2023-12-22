const express = require('express');
const { PORT } = require('./config/index');
const dbConnect = require('./database/index');
const router = require('./routes/index');
const errorHandler = require('./middlewares/errorHandler');
const cookieParser = require('cookie-parser'); // Import cookie-parser

const app = express();

app.use(express.json());
app.use(cookieParser()); // Use cookie-parser middleware
app.use(express.urlencoded({ extended: true })); // Place this middleware after cookie-parser

app.use(router);

dbConnect();

// Define your routes and additional middleware here

// Error handler middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log('Backend is running on port: ' + PORT);
});
