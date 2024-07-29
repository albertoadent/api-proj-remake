const express = require("express");
require("express-async-errors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");
const csurf = require("csurf");
const helmet = require("helmet");

const { environment, port } = require("./config");
const isProduction = environment === "production";

const app = express();

app.use(morgan("dev"));

app.use(cookieParser());
app.use(express.json());

if (!isProduction) {
  app.use(cors());
}
//hello

app.use(
  helmet.crossOriginResourcePolicy({
    policy: "cross-origin",
  })
);

app.use(
  csurf({
    cookie: {
      secure: isProduction,
      sameSite: isProduction && "Lax",
      httpOnly: true,
    },
  })
);

const routes = require("./routes");
app.use(routes);
app.use((_req, _res, next) => {
  const err = new Error("The requested resource couldn't be found.");
  err.title = "Resource Not Found";
  err.errors = { message: "The requested resource couldn't be found." };
  err.status = 404;
  next(err);
});
const { ValidationError } = require("sequelize");
app.use((err, _req, _res, next) => {
  if (err instanceof ValidationError) {
    let errors = {};
    for (let error of err.errors) {
      errors[error.path] = error.message;
    }
    err.title = "Validation error";
    err.errors = errors;
  }
  next(err);
});
app.use((err, _req, res, _next) => {
  if (err.status && !err.title) {
    switch (err.status) {
      case 404:
        err.title = err.message || "Resource Not Found";
        break;
      case 400:
        err.title = err.message || "Validation Error";
        break;
      case 403:
        return res.status(403).json({ message: "Forbidden" });
      case 401:
        return res.status(403).json({ message: "Authentication Required" });
    }
  }
  res.status(err.status || 500);
  console.error(err);
  res.json({
    title: isProduction ? undefined : err.title || "Server Error",
    message: err.message,
    errors: err.errors,
    stack: isProduction ? undefined : err.stack,
  });
});
module.exports = app;
