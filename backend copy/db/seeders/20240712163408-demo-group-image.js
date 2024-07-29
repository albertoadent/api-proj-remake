"use strict";

const { GroupImage } = require("../models");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await GroupImage.bulkCreate(
      [
        { groupId: 1, url: "groupimage1.url", preview: true },
        { groupId: 2, url: "groupimage2.url", preview: true },
      ],
      { validate: true }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      {
        schema: process.env.SCHEMA,
        tableName: "GroupImages",
      },
      {
        id: { [Sequelize.Op.in]: [1, 2] },
      }
    );
  },
};
