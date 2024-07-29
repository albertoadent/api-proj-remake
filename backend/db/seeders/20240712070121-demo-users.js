"use strict";

const { User } = require("../models");
const bcrypt = require("bcryptjs");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await User.bulkCreate(
      [
        {
          email: "demo@user.io",
          firstName: "Demo",
          lastName: "Lition",
          username: "Demo-lition",
          hashedPassword: bcrypt.hashSync("password"),
        },
        {
          email: "user1@user.io",
          firstName: "User",
          lastName: "One",
          username: "FakeUser1",
          hashedPassword: bcrypt.hashSync("password2"),
        },
        {
          email: "user4@user.io",
          firstName: "User",
          lastName: "Four",
          username: "FakeUser4",
          hashedPassword: bcrypt.hashSync("password4"),
        },
        {
          email: "user5@user.io",
          firstName: "User",
          lastName: "Five",
          username: "FakeUser5",
          hashedPassword: bcrypt.hashSync("password5"),
        },
        {
          email: "user2@user.io",
          firstName: "User",
          lastName: "Two",
          username: "FakeUser2",
          hashedPassword: bcrypt.hashSync("password3"),
        },
      ],
      { validate: true }
    );
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete(
      { schema: process.env.SCHEMA, tableName: "Users" },
      {
        username: {
          [Sequelize.Op.in]: [
            "Demo-Lition",
            "FakeUser1",
            "FakeUser4",
            "FakeUser5",
            "FakeUser2",
          ],
        },
      },
      {}
    );
  },
};