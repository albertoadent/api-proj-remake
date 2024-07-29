"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Venue extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      //Venue belongs to Group referenced by groupId
      Venue.belongsTo(models.Group, {
        foreignKey: "groupId",
      });
      //Venue has many Events referenced by venueId
      Venue.hasMany(models.Event, {
        foreignKey: "venueId",
        hooks: true,
        onDelete: "CASCADE",
      });
    }
  }
  Venue.init(
    {
      groupId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: {
          model: sequelize.models.Group,
        },
      },
      address: { allowNull: false, type: DataTypes.STRING },
      city: { allowNull: false, type: DataTypes.STRING },
      state: { allowNull: false, type: DataTypes.STRING },
      lat: { allowNull: false, type: DataTypes.DECIMAL },
      lng: { allowNull: false, type: DataTypes.DECIMAL },
    },
    {
      sequelize,
      modelName: "Venue",
    }
  );
  return Venue;
};
