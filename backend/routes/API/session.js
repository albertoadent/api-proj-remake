const express = require("express");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");

const { setTokenCookie} = require("../../utils/auth");
const { User } = require("../../db/models");

const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const validateLogin = [
  (req, res, next) => {
    const { credential, username, email } = req.body;
    req.body.credential = credential? credential: username ? username : email;
    return next();
  },
  check("credential")
    .exists({ checkFalsy: true })
    .notEmpty()
    .withMessage("Email is required"),
  check("email")
  .optional()
    .isEmail()
    .withMessage("Please provide a valid email."),
  check("username")
    .optional()
    .notEmpty()
    .withMessage("Please provide a valid username."),
  check("password")
    .exists({ checkFalsy: true })
    .withMessage("Password is required"),
  handleValidationErrors,
];

const router = express.Router();

/*                        LOG IN                         */

router.post("/", validateLogin, async (req, res, next) => {
    const { username, password, email, credential } = req.body;
    try {
        if (!((username || email) && password)&&!credential)
            throw new Error("insufficient credentials given");
        const user = await User.unscoped().findOne({
            where: {
                [Op.or]: { username: credential, email: credential },
            },
        });
        
        const error = new Error("Invalid credentials");
        error.status = 401;
        error.title = "Login failed";
        
        if (!user) {
            error.errors = { credential: "Invalid Username or email" };
            throw error;
        }
        if (!bcrypt.compareSync(password, user.hashedPassword.toString())) {
            error.errors = { credential: "Incorrect Password" };
            throw error;
        }
        
        const safeUser = {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
        };
        
        await setTokenCookie(res, safeUser);
        
        return res.json({ user: safeUser });
    } catch (err) {
        if(err.status === 401){
            return res.status(401).json({message:err.message})
        }
        next(err);
    }
});

/*                        LOG OUT                         */

router.delete("/", (_req, res) => {
    res.clearCookie("token");
    return res.json({ message: "success" });
});

router.get("/", (req, res) => {
  const { user } = req;
  if (user) {
    const safeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    return res.json({ user: safeUser });
  } else return res.json({ user: null });
});

module.exports = router;