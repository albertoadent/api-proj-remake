const express = require("express");
const router = express.Router();

const { get, create, edit, del, catchRoute, throwError } =
  require("../../utils/routeHelpers").route(router);
const {
  Event,
  Venue,
  Group,
  EventImage,
  Attendance,
  Sequelize,
} = require("../../db/models");

get(
  "/",
  {
    validation: {
      model: "EventQuery",
      attributes: {
        page: true,
        size: true,
        name: true,
        type: true,
        startDate: true,
      },
    },
  },
  async ({query}) =>{
    let { page = 1, size = 20, name, type, startDate } = query;
    page = parseInt(page);
    size = parseInt(size);

    const options = { where: {} };
    options.limit = size;
    options.offset = size * (page - 1);

    if (name) {
      options.where.name = { [Sequelize.Op.like]: "%" + name + "%" };
    }
    if (type) {
      options.where.type = type;
    }
    if (startDate) {
      options.where.startDate = {
        [Sequelize.Op.gt]: startDate,
      };
    }

    return Event.findAll({
      attributes: {
        exclude: ["createdAt", "updatedAt", "price", "description", "capacity"],
      },
      include: [
        { model: Venue, attributes: ["id", "city", "state"] },
        { model: Group, attributes: ["id", "city", "state", "name"] },
      ],
      ...options
    })}
);

get(
  "/:eventId",
  {
    requireAuth: false,
    exists: {
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
      include: [
        { model: Venue, attributes: ["id", "city", "state"] },
        { model: Group, attributes: ["id", "city", "state", "name"] },
        { model: EventImage, attributes: ["id", "url", "preview"] },
      ],
    },
  },
  async ({ event }) => event
);

create(
  "/:eventId/images",
  {
    clearance: { model: Event, allowed: ["host", "co-host", "attending"] },
    status: 200,
  },
  async ({ event, body }) => {
    const image = await event.createEventImage(body);
    return { id: image.id, url: image.url, preview: image.preview };
  }
);

edit(
  "/:eventId",
  { clearance: ["organizer", "co-host"], validation: "Event" },
  async ({ event, body }) => event.update(body)
);

del(
  "/:eventId",
  { clearance: ["organizer", "co-host"] },
  async ({ event }) =>
    event.destroy() && {
      message: "Successfully deleted",
    }
);

get(
  "/:eventId/attendees",
  { requireAuth: true, clearance: ["organizer", "co-host"] },
  async ({ event }) => {
    const users = await event.getUsers({
      attributes: ["id", "firstName", "lastName"],
    });
    const Attendees = users.map((user) => {
      const jsonUser = user.toJSON();
      jsonUser.Attendance = { status: jsonUser.Attendance.status };
      return jsonUser;
    });
    return { Attendees };
  }
);

catchRoute(
  "/:eventId/attendees",
  { requireAuth: false, exists: true },
  async ({ event, errorStatus }) => {
    if (errorStatus !== 403 && errorStatus !== 401 && errorStatus !== undefined)
      throwError(errorStatus || 500, "Caught error");
    const users = await event.getUsers({
      through: {
        model: Attendance,
        where: { status: { [Sequelize.Op.in]: ["co-host", "member"] } },
      },
      attributes: ["id", "firstName", "lastName"],
    });
    const Attendees = users.map((user) => {
      const jsonUser = user.toJSON();
      jsonUser.Attendance = { status: jsonUser.Attendance.status };
      return jsonUser;
    });
    return { Attendees };
  },
  "GET"
);

create(
  "/:eventId/attendance",
  {
    requireAuth: true,
    exists: true,
    clearance: ["organizer", "co-host", "member"],
  },
  async ({ user, event }) => {
    const [attendance, createdNewAttendance] = await Attendance.findOrCreate({
      where: {
        userId: user.id,
        eventId: event.id,
      },
    });
    return createdNewAttendance
      ? attendance
      : throwError(
          400,
          attendance.toJSON().status === "pending"
            ? "Attendance has already been requested"
            : "User is already a member of the event"
        );
  }
);

edit(
  "/:eventId/attendance",
  { clearance: ["organizer", "co-host"] },
  async ({ event, otherUser, body }) => {
    if (body.status === "pending") {
      throwError(400, "Bad Request", {
        status: "Cannot change a attendance status to pending",
      });
    }
    const attendance = await Attendance.findOne({
      where: {
        eventId: event.id,
        userId: otherUser.id,
      },
    });
    if (attendance === null) {
      throwError(
        404,
        "Attendance between the user and the event does not exist"
      );
    }
    let canUpdate = false;
    if (
      (attendance.toJSON().status === "pending" &&
        body.status === "attending") ||
      (attendance.toJSON().status === "waitlist" &&
        body.status === "attending") ||
      (attendance.toJSON().status === "pending" &&
        body.status === "waitlist") ||
      (attendance.toJSON().status === "attending" &&
        body.status === "co-host") ||
      (attendance.toJSON().status === "attending" &&
        body.status === "waitlist") ||
      (attendance.toJSON().status === "co-host" && body.status === "attending")
    ) {
      canUpdate = true;
    }
    if (!canUpdate) {
      throwError(400, "Bad Request", {
        status: "Cannot change a attendance status to " + body.status,
      });
    }
    let data = await attendance.update({
      eventId: event.id,
      userId: body.memberId,
      status: body.status,
    });
    const { id, userId, eventId, status } = data.toJSON();
    return {
      id,
      eventId,
      userId,
      status,
    };
  }
);

del(
  "/:eventId/attendance/:userId",
  { clearance: ["organizer", "co-host", "member"] },
  async ({ event, otherUser, user }) => {
    const group = await event.getGroup();
    if (group.organizerId !== user.id) throwError(403);
    const attendance = await Attendance.findOne({
      where: {
        eventId: event.id,
        userId: otherUser.id,
      },
    });

    if (attendance) {
      await attendance.destroy();
      return { message: "Successfully deleted attendance from event" };
    }

    throwError(404, "Attendance does not exist for this User");
  }
);

catchRoute(
  "/:eventId/attendance/:userId",
  { requireAuth: true, exists: true },
  async ({ event, otherUser, user }) => {
    const attendance = await Attendance.findOne({
      where: {
        eventId: event.id,
        userId: otherUser.id,
      },
    });

    if (otherUser.id !== user.id) {
      throwError(403, "Forbidden");
    }

    if (attendance) {
      await attendance.destroy();
      return { message: "Successfully deleted attendance from event" };
    }

    throwError(404, "Attendance does not exist for this User");
  },
  "DELETE"
);

module.exports = router;
