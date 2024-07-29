"use strict";

const { Group } = require("../models");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await Group.bulkCreate(
      [
        {
          organizerId: 1,
          name: "First Group",
          about: "this group is a group about a group that does the group",
          type: "In Person",
          private: true,
          city: "Atlanta",
          state: "GA",
          numMembers: 1,
        },
        {
          organizerId: 2,
          name: "Second Group",
          about: "this group is a group about a group that does the group",
          type: "In Person",
          private: true,
          city: "Atlanta",
          state: "GA",
        },
        {
          organizerId: 3,
          name: "Third Group",
          about: "this group is a group about a group that does the group",
          type: "In Person",
          private: true,
          city: "Atlanta",
          state: "GA",
        },
        {
          organizerId: 4,
          name: "Fourth Group",
          about: "this group is a group about a group that does the group",
          type: "In Person",
          private: true,
          city: "Atlanta",
          state: "GA",
        },
      ],
      { validate: true }
    );
  },

  async down(queryInterface, Sequelize) {},
};
