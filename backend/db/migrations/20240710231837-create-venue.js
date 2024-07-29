"use strict";

const options = {
  schema: process.env.NODE_ENV === "production" ? process.env.SCHEMA : undefined,
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "Venues",
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        groupId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "Groups",
          },
        },
        address: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        city: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        state: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        lat: {
          type: Sequelize.DECIMAL,
          allowNull: false,
        },
        lng: {
          type: Sequelize.DECIMAL,
          allowNull: false,
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
    options.tableName = "Venues";
    await queryInterface.dropTable(options);
  },
};
