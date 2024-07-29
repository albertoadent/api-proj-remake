// backend/routes/api/index.js
const router = require("express").Router();

const { restoreUser, setTokenCookie } = require("../../utils/auth.js");

const { User } = require("../../db/models");

router.use(restoreUser);

router.get("/restore-user", (req, res) => {
  return res.json(req.user);
});

router.post("/test", (req, res) => {
  res.json({ requestBody: req.body });
});

router.get("/set-token-cookie", async (_req, res) => {
  const user = await User.findOne({
    where: {
      username: "Demo-lition",
    },
  });
  setTokenCookie(res, user);
  return res.json({ user: user });
});

router.use("/session", require("./session"));
router.use("/users", require("./users"));
router.use("/groups", require("./groups"));
router.use("/venues", require("./venues"));
router.use("/events", require("./events"));
router.use("/event-images", require("./event-images"));
router.use("/group-images", require("./group-images"));

module.exports = router;