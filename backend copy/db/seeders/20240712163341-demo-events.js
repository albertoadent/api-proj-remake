"use strict";

const { Event } = require("../models");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await Event.create({
      groupId: 1,
      venueId: 1,
      name: "this place",
      type: "Online",
      description:"this place is a place where your place does a place about a place",
      startDate: "2025-11-19 20:00:00",
      endDate: "2025-11-19 22:00:00",
      capacity: 15,
      price: 10.0,
    });
    await Event.create({
      groupId: 2,
      venueId: 2,
      name: "this place",
      type: "In Person",
      startDate: "2025-11-19 20:00:00",
      endDate: "2025-11-19 22:00:00",
      description:"this place is a place where your place does a place about a place",
      capacity: 15,
      price: 10.0,
    });
    await Event.create({
      groupId: 2,
      venueId: 3,
      name: "this place",
      type: "In Person",
      description:"this place is a place where your place does a place about a place",
      startDate: "2025-11-19 20:00:00",
      endDate: "2025-11-19 22:00:00",
      capacity: 15,
      price: 10.0,
    });
    await Event.create({
      groupId: 1,
      venueId: 4,
      name: "this place",
      type: "In Person",
      description:"this place is a place where your place does a place about a place",
      startDate: "2025-11-19 20:00:00",
      endDate: "2025-11-19 22:00:00",
      capacity: 15,
      price: 10.0,
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete(
      { schema: process.env.SCHEMA, tableName: "Events" },
      {
        id: { [Op.in]: [1, 2, 3, 4] },
      },
      {}
    );
  },
};
