const express = require("express");
const router = express.Router();
const { del } = require("../../utils/routeHelpers").route(router);

del(
  "/:groupImageId",
  { clearance: ["organizer", "co-host"] },
  async ({ groupImage }) =>
    groupImage.destroy() && { message: "Successfully deleted" }
);

module.exports = router;
