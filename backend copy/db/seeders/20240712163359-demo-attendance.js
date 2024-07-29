"use strict";

const { Event } = require("../models");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const event1 = await Event.findByPk(1);
    const event2 = await Event.findByPk(2);
    const event3 = await Event.findByPk(3);

    await event1.createAttendee({
      userId: 1,
      status: "attending",
    });
    await event1.createAttendee({
      userId: 3,
      status: "host",
    });
    await event1.createAttendee({
      userId: 4,
      status: "waitlist",
    });
    await event1.createAttendee({
      userId: 2,
      status:"co-host"
    });

    await event2.createAttendee({
      userId: 4,
      status: "attending",
    });
    await event2.createAttendee({
      userId: 1,
      status:"host"
    });

    await event3.createAttendee({
      userId: 2,
      status: "host",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      {
        schema: process.env.SCHEMA,
        tableName: "Attendances",
      },
      { id: { [Sequelize.Op.in]: [1, 2, 3, 4, 5, 6] } }
    );
  },
};