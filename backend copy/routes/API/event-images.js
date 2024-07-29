const express = require("express");
const router = express.Router();
const { del } = require("../../utils/routeHelpers").route(router);

del(
  "/:eventImageId",
  { clearance: ["organizer", "co-host"] },
  async ({ eventImage }) =>
    eventImage.destroy() && { message: "Successfully deleted" }
);

module.exports = router;