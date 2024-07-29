"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Group extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      //Group belongs to User referenced by organizerId
      Group.belongsTo(models.User, {
        foreignKey: "organizerId",
        as: "Organizer",
      });
      //Group belongs to many Users through Memberships
      Group.belongsToMany(models.User, {
        through: models.Membership,
        foreignKey: "groupId",
        otherKey: "userId",
      });
      //Group has many Memberships referenced by groupId
      Group.hasMany(models.Membership, {
        foreignKey: "groupId",
        hooks: true,
        onDelete: "CASCADE",
        as: "Member",
      });
      //Group has many Venues referenced by groupId
      Group.hasMany(models.Venue, {
        foreignKey: "groupId",
        hooks: true,
        onDelete: "CASCADE",
      });
      //Group has many Group Images referenced by groupId
      Group.hasMany(models.GroupImage, {
        foreignKey: "groupId",
        hooks: true,
        onDelete: "CASCADE",
      });
      //Group has many Events referenced by groupId
      Group.hasMany(models.Event, {
        foreignKey: "groupId",
        hooks: true,
        onDelete: "CASCADE",
      });
    }
  }
  Group.init(
    {
      organizerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: sequelize.models.User,
        },
      },
      name: { type: DataTypes.STRING, allowNull: false },
      about: { type: DataTypes.STRING, allowNull: false },
      type: {
        type: DataTypes.ENUM,
        values: ["Online", "In Person"],
        allowNull: false,
      },
      private: { type: DataTypes.BOOLEAN, allowNull: false },
      city: { type: DataTypes.STRING, allowNull: false },
      state: { type: DataTypes.STRING, allowNull: false },
      numMembers: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue("numMembers");
        },
      },
      previewImage: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue("previewImage");
        },
      },
    },
    {
      sequelize,
      modelName: "Group",
      hooks: {
        async afterFind(groups, options) {
          if (!groups) return;
          const isArray = Array.isArray(groups);
          const instances = isArray ? groups : [groups];

          for (const group of instances) {
            const numMembers = await sequelize.models.Membership.count({
              where: { groupId: group.id },
            });
            group.setDataValue("numMembers", numMembers);

            const previewImage = await sequelize.models.GroupImage.findOne({
              where: { groupId: group.id,preview:true },
              attributes: ["url"],
            });
            group.setDataValue(
              "previewImage",
              previewImage ? previewImage.url : null
            );
          }
        },
      },
    }
  );
  return Group;
};
