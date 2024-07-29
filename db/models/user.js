"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      //A User can have many groups that it owns referenced by the organizerId
      User.hasMany(models.Group, {
        foreignKey: "organizerId",
        hooks: true,
        onDelete: "CASCADE",
      });
      //A User can have many memberships referenced by the userId
      User.hasMany(models.Membership, {
        foreignKey: "userId",
        hooks: true,
        onDelete: "CASCADE",
      });
      //A User has many Attendances referenced by the userId
      User.hasMany(models.Attendance, {
        foreignKey: "userId",
        hooks: true,
        onDelete: "CASCADE",
      });
      //User belongs to many Events through Attandances
      User.belongsToMany(models.Event, {
        through: models.Attendance,
        foreignKey: "userId",
        otherKey: "eventId",
        onDelete: "CASCADE",
      });
      //User belongs to many Groups through Membership
      User.belongsToMany(models.Group, {
        through: models.Membership,
        foreignKey: "userId",
        otherKey: "groupId",
        onDelete: "CASCADE",
        as: "JoinedGroups",
      });
    }
  }

  User.init(
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      hashedPassword: { type: DataTypes.STRING, allowNull: false },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
