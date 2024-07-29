const express = require("express");
const router = express.Router();

const { edit } = require("../../utils/routeHelpers").route(router);

edit(
  "/:venueId",
  { clearance: ["organizer", "co-host"], validation: "Venue" },
  async ({ venue, body }) => venue.update(body)
);

module.exports = router;
