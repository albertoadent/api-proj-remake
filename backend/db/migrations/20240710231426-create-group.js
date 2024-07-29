"use strict";

const options = {
  schema: process.env.NODE_ENV === "production" ? process.env : undefined,
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "Groups",
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        organizerId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "Users",
          },
        },
        name: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        about: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        type: {
          type: Sequelize.ENUM,
          allowNull: false,
          values: ["Online", "In Person"],
        },
        private: {
          type: Sequelize.BOOLEAN,
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
    options.tableName = "Groups";
    await queryInterface.dropTable(options);
  },
};
