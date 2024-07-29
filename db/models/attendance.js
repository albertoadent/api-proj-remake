"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Attendance extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      //Attendance belongs to User referenced by userId
      Attendance.belongsTo(models.User, {
        foreignKey: "userId",
      });
      //Attendance belongs to Group referenced by groupId
      Attendance.belongsTo(models.Event, {
        foreignKey: "eventId",
      });
    }
  }
  Attendance.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: sequelize.models.User,
        },
      },
      eventId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: sequelize.models.Event,
        },
      },
      status: {
        type: DataTypes.ENUM,
        values: ["attending", "pending", "waitlist", "host", "co-host"],
        allowNull: false,
        defaultValue: "pending",
      },
    },
    {
      sequelize,
      modelName: "Attendance",
    }
  );
  return Attendance;
};
