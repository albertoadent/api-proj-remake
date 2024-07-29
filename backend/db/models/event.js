"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    static associate(models) {
      //Event has many Event Images referenced by eventId
      Event.hasMany(models.EventImage, {
        foreignKey: "eventId",
        hooks: true,
        onDelete: "CASCADE",
      });
      //Event has many Attendances referenced by eventId
      Event.hasMany(models.Attendance, {
        foreignKey: "eventId",
        hooks: true,
        onDelete: "CASCADE",
        as: "Attendee",
      });
      //Event belongs to a Group referenced by groupId
      Event.belongsTo(models.Group, {
        foreignKey: "groupId",
      });
      //Event belongs to a Venue referenced by venueId
      Event.belongsTo(models.Venue, {
        foreignKey: "venueId",
      });
      //Events belongs to many Users through Attandances
      Event.belongsToMany(models.User, {
        through: models.Attendance,
        foreignKey: "eventId",
        otherKey: "userId",
        onDelete: "CASCADE",
      });
    }
  }
  Event.init(
    {
      venueId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: sequelize.models.Venue,
        },
      },
      groupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: sequelize.models.Group,
        },
      },
      name: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.STRING, allowNull: false },
      type: {
        type: DataTypes.ENUM,
        values: ["Online", "In Person"],
        allowNull: false,
        set(value) {
          const capitalize = (word) => word[0].toUpperCase() + word.slice(1);
          const words = value.split(" ");
          const setTo = words.map(capitalize).join(" ");
          this.setDataValue("type", setTo);
        },
      },
      capacity: { type: DataTypes.INTEGER, allowNull: false },
      price: { type: DataTypes.DECIMAL, allowNull: false },
      numAttending: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue("numAttending");
        },
      },
      previewImage: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue("previewImage");
        },
      },
      startDate: { type: DataTypes.DATE },
      endDate: { type: DataTypes.DATE },
    },
    {
      sequelize,
      modelName: "Event",
      hooks: {
        async afterFind(events, options) {
          if (!events) return;
          const isArray = Array.isArray(events);
          const instances = isArray ? events : [events];

          for (const event of instances) {
            const numMembers = await sequelize.models.Attendance.count({
              where: { eventId: event.id },
            });
            event.setDataValue("numAttending", numMembers);

            const previewImage = await sequelize.models.EventImage.findOne({
              where: { eventId: event.id, preview: true },
              attributes: ["url"],
            });
            event.setDataValue(
              "previewImage",
              previewImage ? previewImage.url : null
            );
          }
        },
      },
    }
  );
  return Event;
};
