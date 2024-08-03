const express = require("express");
const bcrypt = require("bcryptjs");

const { setTokenCookie, requireAuth } = require("../../utils/auth");
const { User } = require("../../db/models");

const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const router = express.Router();

const validateSignup = [
  check("email")
    .exists({ checkFalsy: true })
    .isEmail()
    .withMessage("Invalid email"),
  check("username")
    .exists({ checkFalsy: true })
    .isLength({ min: 4 })
    .withMessage("Please provide a username with at least 4 characters."),
  check("username").not().isEmail().withMessage("Username cannot be an email."),
  check("password")
    .exists({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage("Password must be 6 characters or more."),
  check("firstName")
    .exists({ checkFalsy: true })
    .withMessage("First Name is required"),
  check("lastName")
    .exists({ checkFalsy: true })
    .withMessage("Last Name is required"),
  handleValidationErrors,
];

router.post("/", validateSignup, async (req, res, next) => {
  const { email, password, username, firstName, lastName } = req.body;
  const hashedPassword = bcrypt.hashSync(password);
  try {
    const user = await User.create({
      email,
      username,
      hashedPassword,
      firstName,
      lastName,
    });

    const safeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    await setTokenCookie(res, safeUser);

    return res.status(201).json({
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
});

router.use("/", (err, req, res, next) => {
  // console.log(err);
  const error = { message: "User already exists", errors: {} };
  if (req.url !== "/") return next(err);
  if(!Array.isArray(err)) return next(err)
  const {errors:[...errors]} = err;
  errors.forEach((e) => {
    if (e.path === "email")
      error.errors.email = "User with that email already exists";
    if (e.path === "username")
      error.errors.username = "User with that username already exists";
  });
  return res.status(500).json(error);
});

router.get("/all", async (req, res) => {
  let allUsers = await User.findAll();
  return res.json(allUsers);
});

module.exports = router;
