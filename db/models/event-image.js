"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class EventImage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      //Event Image belongs to an Event referenced by eventId
      EventImage.belongsTo(models.Event,{
        foreignKey:"eventId",
      })
    }
  }
  EventImage.init(
    {
      eventId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: sequelize.models.Event,
        },
      },
      url: { type: DataTypes.STRING, allowNull: false },
      preview: { type: DataTypes.BOOLEAN, allowNull: false },
    },
    {
      sequelize,
      modelName: "EventImage",
    }
  );
  return EventImage;
};
