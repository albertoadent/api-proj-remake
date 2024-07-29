"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Membership extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      //Membership belongs to User referenced by userId
      Membership.belongsTo(models.User, {
        foreignKey: "userId",
      });
      //Membership belongs to Group referenced by groupId
      Membership.belongsTo(models.Group, {
        foreignKey: "groupId",
      });
    }
  }
  Membership.init(
    {
      userId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: {
          model: sequelize.models.User,
        },
      },
      groupId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: {
          model: sequelize.models.Group,
        },
      },
      status: {
        allowNull: false,
        type: DataTypes.ENUM,
        values: ["pending", "member", "co-host"],
        defaultValue: "pending"
      },
    },
    {
      sequelize,
      modelName: "Membership",
    }
  );
  return Membership;
};
