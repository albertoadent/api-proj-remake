const route = require("../../utils/routeHelpers").route();
const {
  router,
  get,
  create,
  edit,
  del,
  catchRoute,
  throwError,
  Group,
  GroupImage,
  User,
  Membership,
  Venue,
  Sequelize,
} = route;

get("/", async () => {
  const Groups = await Group.findAll();
  return { Groups };
});

get("/current", ["requireAuth"], async ({ user }) => {
  const ownedGroups = await user.getGroups();
  let joinedGroups = await user.getJoinedGroups();
  joinedGroups = joinedGroups.map((group) => {
    return { ...group.toJSON(), Membership: undefined };
  });
  return {
    Groups: [...ownedGroups, ...joinedGroups],
  };
});

get(
  "/:groupId",
  {
    requireAuth: false,
    exists: {
      include: [
        {
          model: GroupImage,
          attributes: ["id", "url", "preview"],
        },
        {
          model: Venue,
          attributes: "id groupId address city state lat lng".split(" "),
        },
        {
          model: User,
          as: "Organizer",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
    },
  },
  async ({ group }) => {
    return { ...group.toJSON(), previewImage: undefined };
  }
);

create(
  "/",
  { requireAuth: true, exists: false, validation: "Group" },
  async ({ user, body }) => user.createGroup(body)
);

create(
  "/:groupId/images",
  {
    clearance: true,
    validation: "groupimage",
  },
  async ({ group, body }) => group.createGroupImage(body)
);

edit(
  "/:groupId",
  {
    clearance: true,
    validation: { model: "Group", attributes: false },
  },
  async ({ group, body }) => group.update(body)
);

del(
  "/:groupId",
  { clearance: true },
  async ({ group }) => group.destroy() && { message: "Successfully deleted" }
);

get(
  "/:groupId/venues",
  { clearance: ["organizer", "co-host"] },
  async ({ group }) => {
    const Venues = await group.getVenues({
      attributes: { exclude: ["createdAt", "updatedAt"] },
    });
    return { Venues };
  }
);

create(
  "/:groupId/venues",
  { clearance: ["organizer", "co-host"], validation: "Venue" },
  async ({ group, body }) => group.createVenue(body)
);

get(
  "/:groupId/events",
  { requireAuth: false, exists: true },
  async ({ group }) => {
    const Events = await group.getEvents({
      attributes: {
        exclude: ["createdAt", "updatedAt", "price", "description", "capacity"],
      },
      include: [
        { model: Venue, attributes: ["id", "city", "state"] },
        { model: Group, attributes: ["id", "city", "state", "name"] },
      ],
    });
    return { Events };
  }
);

create(
  "/:groupId/events",
  { clearance: ["organizer", "co-host"], validation: "Event" },
  async ({ user, group, body }) => {
    const event = await group.createEvent(body);
    await user.createAttendance({ eventId: event.id, status: "host" });
    return event;
  }
);

get(
  "/:groupId/members",
  { clearance: ["organizer", "co-host"] },
  async ({ group }) => {
    const users = await group.getUsers({
      attributes: ["id", "firstName", "lastName"],
    });
    const Members = users.map((user) => {
      const jsonUser = user.toJSON();
      jsonUser.Membership = { status: jsonUser.Membership.status };
      return jsonUser;
    });
    return { Members };
  }
);

catchRoute(
  "/:groupId/members",
  { requireAuth: false, exists: true },
  async ({ group, errorStatus }) => {
    if (errorStatus !== 403 && errorStatus !== 401 && errorStatus !== undefined)
      throwError(errorStatus || 500, "Caught error");
    const users = await group.getUsers({
      through: {
        model: Membership,
        where: { status: { [Sequelize.Op.in]: ["co-host", "member"] } },
      },
      attributes: ["id", "firstName", "lastName"],
    });
    const Members = users.map((user) => {
      const jsonUser = user.toJSON();
      jsonUser.Membership = { status: jsonUser.Membership.status };
      return jsonUser;
    });
    return { Members };
  },
  "GET"
);

create(
  "/:groupId/membership",
  { requireAuth: true, exists: true },
  async ({ user, group }) => {
    if (user.id === group.organizerId)
      return { message: "User is already a member of the group" };
    const [membership, createdNewMembership] = await Membership.findOrCreate({
      where: {
        userId: user.id,
        groupId: group.id,
      },
    });
    return createdNewMembership
      ? membership
      : throwError(
          400,
          membership.toJSON().status === "pending"
            ? "Membership has already been requested"
            : "User is already a member of the group"
        );
  }
);

edit(
  "/:groupId/membership",
  { clearance: ["organizer"] },
  async ({ group, otherUser, body }) => {
    if (body.status === "pending") {
      throwError(400, "Bad Request", {
        status: "Cannot change a membership status to pending",
      });
    }
    const membership = await Membership.findOne({
      where: {
        groupId: group.id,
        userId: otherUser.id,
      },
    });
    if (!membership) {
      throwError(
        404,
        "Membership between the user and the group does not exist"
      );
    }
    let canUpdate = false;
    if (
      (membership.toJSON().status === "pending" && body.status === "member") ||
      (membership.toJSON().status === "pending" && body.status === "co-host") ||
      (membership.toJSON().status === "member" && body.status === "co-host") ||
      (membership.toJSON().status === "co-host" && body.status === "member")
    ) {
      canUpdate = true;
    }
    if (!canUpdate) {
      throwError(400, "Bad Request", {
        status: "Cannot change a membership status to " + body.status,
      });
    }
    let data = await membership.update({
      groupId: group.id,
      userId: body.memberId,
      status: body.status,
    });
    const { id, userId, groupId, status } = data.toJSON();
    return {
      id,
      groupId,
      memberId: userId,
      status,
    };
  }
);

catchRoute(
  "/:groupId/membership",
  { clearance: ["organizer", "co-host"] },
  async ({ group, otherUser, body, errorStatus }) => {
    if (errorStatus && errorStatus !== 403)
      throwError(errorStatus, "Caught error");
    if (body.status === "pending")
      throwError(400, "Bad Request", {
        status: "Cannot change a membership status to pending",
      });

    const membership = await Membership.findOne({
      where: {
        groupId: group.id,
        userId: otherUser.id,
      },
    });
    if (!membership)
      throwError(
        404,
        "Membership between the user and the group does not exist"
      );

    let canUpdate = false;
    if (membership.toJSON().status === "pending" && body.status === "member")
      canUpdate = true;

    if (!canUpdate)
      throwError(400, "Bad Request", {
        status: "Cannot change a membership status to " + body.status,
      });

    let data = await membership.update({
      groupId: group.id,
      userId: body.memberId,
      status: body.status,
    });
    const { id, userId, groupId, status } = data.toJSON();
    return {
      id,
      groupId,
      memberId: userId,
      status,
    };
  },
  "PUT"
);

del(
  "/:groupId/membership/:memberId",
  { clearance: ["organizer", "co-host", "member", "pending"] },
  async ({ group, otherUser, user }) => {
    if (group.organizerId !== user.id) throwError(403, "Forbidden");
    const membership = await Membership.findOne({
      where: {
        groupId: group.id,
        userId: otherUser.id,
      },
    });

    if (otherUser.id === user.id) throwError(403, "Forbidden");

    if (membership) {
      await membership.destroy();
      return { message: "Successfully deleted membership from group" };
    }

    throwError(404, "Membership does not exist for this User");
  }
);

catchRoute(
  "/:groupId/membership/:memberId",
  { requireAuth: true, exists: true },
  async ({ group, otherUser, user }) => {
    const membership = await Membership.findOne({
      where: {
        groupId: group.id,
        userId: otherUser.id,
      },
    });

    if (otherUser.id !== user.id) throwError(403, "Forbidden");

    if (membership) {
      await membership.destroy();
      return { message: "Successfully deleted membership from group" };
    }

    throwError(404, "Membership does not exist for this User");
  },
  "DELETE"
);

module.exports = router;
