"use strict";

const { Venue } = require("../models");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await Venue.bulkCreate(
      [
        {
          groupId: 1,
          address: "123 Passion Lane",
          city: "Atlanta",
          state: "GA",
          lat: 1.23,
          lng: 23.56,
        },
        {
          groupId: 2,
          address: "123 Passion Lane",
          city: "Atlanta",
          state: "GA",
          lat: 1.23,
          lng: 23.56,
        },
        {
          groupId: 2,
          address: "1234 Passion Lane",
          city: "Atlanta",
          state: "GA",
          lat: 1.23,
          lng: 23.56,
        },
        {
          groupId: 1,
          address: "12345 Passion Lane",
          city: "Atlanta",
          state: "GA",
          lat: 1.23,
          lng: 23.56,
        },
        {
          groupId: 3,
          address: "123456 Passion Lane",
          city: "Atlanta",
          state: "GA",
          lat: 1.23,
          lng: 23.56,
        },
      ],
      { validate: true }
    );
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete(
      { schema: process.env.SCHEMA, tableName: "Venues" },
      {
        id: { [Op.in]: [1, 2, 3, 4, 5] },
      },
      {}
    );
  },
};
