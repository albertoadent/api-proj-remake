"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class GroupImage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      //Group Image belongs to Group referenced by groupId
      GroupImage.belongsTo(models.Group, {
        foreignKey: "groupId",
      });
    }
  }
  GroupImage.init(
    {
      groupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: sequelize.models.Group,
        },
      },
      url: { type: DataTypes.STRING },
      preview: { type: DataTypes.BOOLEAN },
    },
    {
      sequelize,
      modelName: "GroupImage",
    }
  );
  return GroupImage;
};
