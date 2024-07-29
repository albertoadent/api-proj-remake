"use strict";

const options = {
  schema: process.env.NODE_ENV === "production" ? process.env.SCHEMA : undefined,
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "Memberships",
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "Users",
          },
        },
        groupId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "Groups",
          },
        },
        status: {
          type: Sequelize.ENUM,
          allowNull: false,
          values: ["pending", "member", "co-host"],
          defaultValue: "pending",
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      },
      options
    );
  },
  async down(queryInterface, Sequelize) {
    options.tableName = "Memberships";
    await queryInterface.dropTable(options);
  },
};
