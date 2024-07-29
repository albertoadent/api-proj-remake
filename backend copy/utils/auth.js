const jwt = require("jsonwebtoken");
const { jwtConfig } = require("../config");
const {
  User,
  Venue,
  Group,
  Sequelize,
  Membership,
  Event,
  Attendance,
  EventImage,
  GroupImage,
} = require("../db/models");

const { secret, expiresIn } = jwtConfig;

const setTokenCookie = (res, user) => {
  // Create the token.
  const safeUser = {
    id: user.id,
    email: user.email,
    username: user.username,
  };
  const token = jwt.sign(
    { data: safeUser },
    secret,
    { expiresIn: parseInt(expiresIn) } // 604,800 seconds = 1 week
  );

  const isProduction = process.env.NODE_ENV === "production";

  // Set the token cookie
  res.cookie("token", token, {
    maxAge: expiresIn * 1000, // maxAge in milliseconds
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction && "Lax",
  });

  return token;
};

const restoreUser = (req, res, next) => {
  // token parsed from cookies
  const { token } = req.cookies;
  req.user = null;

  return jwt.verify(token, secret, null, async (err, jwtPayload) => {
    if (err) {
      return next();
    }

    try {
      const { id } = jwtPayload.data;
      req.user = await User.findByPk(id, {
        attributes: {
          include: ["email", "createdAt", "updatedAt"],
        },
      });
    } catch (e) {
      res.clearCookie("token");
      return next();
    }

    if (!req.user) res.clearCookie("token");

    return next();
  });
};

const requireAuth = function (req, _res, next) {
  if (req.user) return next();

  const err = new Error("Authentication required");
  err.title = "Authentication required";
  err.errors = { message: "Authentication required" };
  err.status = 401;
  // return _res.status(err.status).json({
  //   message: "Authentication required",
  // });
  return next(err);
};

const getGroups = async (instance, Model) => {
  if (!instance) throw new Error("instance is null");
  // console.log(instance.toJSON(), Model.name, "in get groups function");
  switch (Model) {
    case User:
      const ownedGroups = await instance.getGroups();
      const joinedGroups = await instance.getJoinedGroups();
      return [...ownedGroups, ...joinedGroups];
    case Group:
      return [instance];
    case Membership:
    case GroupImage:
    case Event:
    case Venue:
      const group = await instance.getGroup();
      return [group];
    case EventImage:
    case Attendance:
      const event = await instance.getEvent();
      return getGroups(event, Event);
    default:
      throw new Error("relationship not supported for this model");
  }
};
const getEvents = async (instance, Model) => {
  if (!instance) throw new Error("instance is null");
  // console.log(instance.toJSON(), Model.name, "in get groups function");
  switch (Model) {
    case Event:
      return [instance];
    case User:
    case Group:
      return instance.getEvents();
    case EventImage:
    case Attendance:
    case Venue:
      const event = await instance.getEvent();
      return [event];
    case Membership:
    case GroupImage:
      const group = await instance.getGroup();
      return getEvents(group, Group);
    default:
      throw new Error("relationship not supported for this model");
  }
};

const hasAccessGroup = async (group, user, clearance = ["organizer"]) => {
  const isOrganizer = clearance.includes("organizer")
    ? group.organizerId == user.id
    : false;
  if (isOrganizer) return true;
  const memberships = await user.getMemberships({
    where: {
      groupId: group.id,
      status: {
        [Sequelize.Op.in]: clearance.filter((role) => role !== "organizer"),
      },
    },
  });
  user.memberships = memberships;
  return !!memberships[0];
};
const hasAccessEvent = async (event, user, clearance = ["host"]) => {
  const attendances = await user.getAttendances({
    where: {
      eventId: event.id,
      status: {
        [Sequelize.Op.in]: clearance,
      },
    },
  });
  user.attendances = attendances;
  return !!attendances[0];
};

const checkUserAccessTo = async (
  user,
  Model,
  modelId,
  clearance,
  checkModel = Group
) => {
  // console.log(clearance);
  // console.log(
  //   user.toJSON(),
  //   Model.name,
  //   modelId,
  //   clearance,
  //   "in check user access to function"
  // );
  const instance = await Model.findByPk(modelId); //should be checked by exists
  if (!instance) {
    return false;
  }
  switch (checkModel) {
    case Event:
      const events = await getEvents(instance, Model);
      if (!events[0]) return false;
      for (const event of events) {
        // console.log("checking has access")
        const hasAccessEventBool = await hasAccessEvent(event, user, clearance);
        if (hasAccessEventBool) return true;
      }
      return false;

    default:
      const groups = await getGroups(instance, Model);
      if (!groups[0]) return false;
      for (const group of groups) {
        // console.log("checking has access")
        const hasAccessGroupBool = await hasAccessGroup(group, user, clearance);
        if (hasAccessGroupBool) return true;
      }
      return false;
  }
};

const clearForAccess = (allowedRoles) => async (req, res, next) => {
  // await populateUser(req.user);
  const paramArray = Object.keys(req.params);
  // console.log(paramArray, allowedRoles, "In clear for access function");
  try {
    for (const param of paramArray) {
      // console.log("clearing for access");
      const modelName =
        param.charAt(0).toUpperCase() + param.slice(1, param.indexOf("Id"));
      const Model = require(`../db/models`)[modelName === "Member"?"User":modelName];
      const isClear = await checkUserAccessTo(
        req.user,
        Model,
        req.params[param],
        Array.isArray(allowedRoles) || allowedRoles === undefined
          ? allowedRoles
          : allowedRoles.allowed,
        Array.isArray(allowedRoles) || allowedRoles === undefined
          ? undefined
          : allowedRoles.model
      );
      if (!isClear) {
        // console.log("not clear");
        const error = new Error("Forbidden");
        error.status = 403;
        throw error;
        return res.status(403).json({ message: "Forbidden" });
      }
      // console.log("clear");
    }
    return next();
  } catch (err) {
    next(err);
  }
};

const exists = (options) => async (req, res, next) => {
  try {
    const bodyKeys = Object.keys(req.body).filter((key) => key.endsWith("Id"));
    bodyKeys.forEach((keyId) => (req.params[keyId] = req.body[keyId]));
    const promises = Object.keys(req.params).map(async (modelId) => {
      let modelName = modelId.replace("Id", "");
      if (modelName === "member") modelName = "user";
      const capitalizedModelName =
        modelName.charAt(0).toUpperCase() + modelName.slice(1);
      const Model = require(`../db/models`)[capitalizedModelName];
      // console.log(Model);
      if (req.params[modelId] === null) {
        err = new Error(`${capitalizedModelName} is null`);
        err.status = 404;
        throw err;
      }
      // console.log(options);
      const modelInstance = await Model.findByPk(
        req.params[modelId],
        options === true
          ? undefined
          : (options && options[modelName.toLowerCase()]) || options
      );
      // console.log("modelInstance");
      if (!modelInstance) {
        err = new Error(`${capitalizedModelName} couldn't be found`);
        err.status = 404;
        throw err;
      }
      if (modelName === "user") {
        // await populateUser(modelInstance);
        req.otherUser = modelInstance;
      } else if (!req[modelName]) req[modelName] = modelInstance;
      // console.log(req[modelName]);
    });
    bodyKeys.forEach((keyId) => delete req.params[keyId]);
    await Promise.all(promises);
    next();
  } catch (err) {
    next(err);
  }
};

const authorization = (optionsObj) => {
  let options = { requireAuth: true, exists: true };
  if (Array.isArray(optionsObj)) {
    options.clearance = optionsObj;
  } else if (typeof optionsObj === "string") {
    options.clearance = [optionsObj];
  } else if (optionsObj !== undefined) {
    if (optionsObj.exists !== undefined) options.exists = optionsObj.exists;
    if (optionsObj.requireAuth !== undefined)
      options.requireAuth = optionsObj.requireAuth;
    if (optionsObj.clearance !== undefined)
      options.clearance = optionsObj.clearance;
  }
  // console.log("authorization setup")
  // console.log(options);
  arrayObj = {
    requireAuth: options.requireAuth ? requireAuth : undefined,
    exists: options.exists ? exists(optionsObj.exists) : undefined,
    clearance: options.clearance
      ? clearForAccess(
          options.clearance === true ? undefined : options.clearance
        )
      : undefined,
  };
  // console.log(arrayObj);
  return Object.values(arrayObj);
};

module.exports = {
  setTokenCookie,
  restoreUser,
  requireAuth,
  authorization,
  exists,
  clearForAccess,
};
