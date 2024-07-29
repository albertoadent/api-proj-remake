'use strict';

const { EventImage } = require("../models");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await EventImage.bulkCreate(
      [
        { eventId: 1, url: "eventimage1.url", preview: true },
        { eventId: 2, url: "eventimage2.url", preview: true },
      ],
      { validate: true }
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      {
        schema: process.env.SCHEMA,
        tableName: "EventImages",
      },
      {
        id: { [Sequelize.Op.in]: [1, 2] },
      }
    );
  }
};