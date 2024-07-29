"use strict";

const { Group } = require("../models");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const group1 = await Group.findByPk(1); //organizer 1
    const group2 = await Group.findByPk(2); //organizer 2
    const group3 = await Group.findByPk(3); //organizer 3
    const group4 = await Group.findByPk(4); //organizer 4

    group1.createMember({ userId: 2, status: "co-host" });
    group1.createMember({ userId: 3, status: "member" });
    group1.createMember({ userId: 4, status: "member" });
    group1.createMember({ userId: 5, status: "pending" });

    group2.createMember({ userId: 1, status: "co-host" });
    group2.createMember({ userId: 3, status: "member" });
    group2.createMember({ userId: 4, status: "member" });
    group2.createMember({ userId: 5, status: "pending" });

    group3.createMember({ userId: 2, status: "co-host" });
    group3.createMember({ userId: 4, status: "member" });
    group3.createMember({ userId: 5, status: "pending" });

    group4.createMember({ userId: 2, status: "co-host" });
    group4.createMember({ userId: 5, status: "member" });
    group4.createMember({ userId: 3, status: "pending" });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      {
        tableName: "Memberships",
        schema: process.env.SCHEMA,
      },
      {
        id: {
          [Sequelize.Op.in]: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
        },
      }
    );
  },
};
