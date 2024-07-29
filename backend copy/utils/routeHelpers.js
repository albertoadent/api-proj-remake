const { authorization } = require("./auth");
const auth = require("./auth");
const { validate } = require("./validation");

const validateAuth = (validateOptions, authOptions) => {
  return (
    [
      ...authorization(authOptions),
      validateOptions ? validate(validateOptions) : undefined,
    ].filter((ele) => ele !== undefined) || []
  );
};

const checkFor = (toCheck, param1, param2) => {
  if (typeof toCheck === "string") {
    const arr = [];
    switch (toCheck) {
      case "validation":
        return validate(param1);
      case "clearance":
      case "authorization":
        arr.unshift(auth.clearForAccess(param1));
      case "exists":
        arr.unshift(auth.exists(toCheck === "exists" ? param1 : true));
      case "requireAuth":
        arr.unshift(auth.requireAuth);
        return arr;
      default:
        return validateAuth(param1, param2);
    }
  }

  const {
    validation = undefined,
    requireAuth,
    exists,
    clearance,
  } = toCheck || {};

  if (
    validation !== undefined ||
    requireAuth !== undefined ||
    exists !== undefined ||
    clearance !== undefined
  ) {
    return validateAuth(validation, { requireAuth, exists, clearance });
  }

  if (typeof param2 === "function") {
    if (process.env.NODE_ENV === "development") {
      console.log(toCheck.method, toCheck.url, "checkFor not used correctly");
    }
    return param2(); // if checkFor isn't called
  }

  return (req, res, next) => {
    if (process.env.NODE_ENV === "development") {
      console.log(req.method, req.url, "checkFor has empty params");
    }
    next();
  };
};

const route = (router = require("express").Router()) => {
  const handleResponse = (status) => (req, res, next) => {
    try {
      const { response } = req;
      if (!response) return next();
      res.status(status || req.status || 200).json(response);
    } catch (error) {
      next(error);
    }
  };
  const wrapAsync = (responseCb) => async (req, res, next) => {
    try {
      req.response = await responseCb(req);
      next();
    } catch (error) {
      next(error);
    }
  };

  const get = (url, hasMiddleware, responseCb = hasMiddleware) => {
    if (Array.isArray(hasMiddleware))
      router.get(
        url,
        [...checkFor(...hasMiddleware), wrapAsync(responseCb)],
        handleResponse()
      );
    else if (typeof hasMiddleware === "object" && hasMiddleware !== null)
      router.get(
        url,
        [...checkFor(hasMiddleware), wrapAsync(responseCb)],
        handleResponse()
      );
    else router.get(url, wrapAsync(responseCb), handleResponse());
  };

  const create = (url, hasMiddleware, responseCb = hasMiddleware) => {
    if (Array.isArray(hasMiddleware))
      router.post(
        url,
        [...checkFor(...hasMiddleware), wrapAsync(responseCb)],
        handleResponse(201)
      );
    else if (typeof hasMiddleware === "object" && hasMiddleware !== null)
      router.post(
        url,
        [...checkFor(hasMiddleware), wrapAsync(responseCb)],
        handleResponse(201)
      );
    else router.post(url, wrapAsync(responseCb), handleResponse(201));
  };

  const edit = (url, hasMiddleware, responseCb = hasMiddleware) => {
    if (Array.isArray(hasMiddleware))
      router.put(
        url,
        [...checkFor(...hasMiddleware), wrapAsync(responseCb)],
        handleResponse()
      );
    else if (typeof hasMiddleware === "object" && hasMiddleware !== null) {
      router.put(
        url,
        [...checkFor(hasMiddleware), wrapAsync(responseCb)],
        handleResponse()
      );
    } else router.put(url, wrapAsync(responseCb), handleResponse());
  };

  const del = (url, hasMiddleware, responseCb = hasMiddleware) => {
    if (Array.isArray(hasMiddleware))
      router.delete(
        url,
        [...checkFor(...hasMiddleware), wrapAsync(responseCb)],
        handleResponse()
      );
    else if (typeof hasMiddleware === "object" && hasMiddleware !== null)
      router.delete(
        url,
        [...checkFor(hasMiddleware), wrapAsync(responseCb)],
        handleResponse()
      );
    else router.delete(url, wrapAsync(responseCb), handleResponse());
  };
  const use = (url, hasMiddleware, responseCb = hasMiddleware) => {
    if (Array.isArray(hasMiddleware))
      router.use(
        url,
        [...checkFor(...hasMiddleware), wrapAsync(responseCb)],
        handleResponse()
      );
    else if (typeof hasMiddleware === "object" && hasMiddleware !== null)
      router.use(
        url,
        [...checkFor(hasMiddleware), wrapAsync(responseCb)],
        handleResponse()
      );
    else router.delete(url, wrapAsync(responseCb), handleResponse());
  };
  const tryRoute = (url, hasMiddleware, responseCb = hasMiddleware) => {
    if (Array.isArray(hasMiddleware))
      router.use(
        url,
        [...checkFor(...hasMiddleware), wrapAsync(responseCb)],
        handleResponse()
      );
    else if (typeof hasMiddleware === "object" && hasMiddleware !== null)
      router.use(
        url,
        [...checkFor(hasMiddleware), wrapAsync(responseCb)],
        handleResponse()
      );
    else router.use(url, wrapAsync(responseCb), handleResponse());
  };
  const catchRoute = (url, hasMiddleware, responseCb = hasMiddleware, method) => {
    if (Array.isArray(hasMiddleware))
      router.use(
        url,
        [
          (error, r, rs, n) =>
            r.method === method
              ? (r.errorStatus = (error.status || 500) && n())
              : n(error),
          ...checkFor(...hasMiddleware),
          wrapAsync(responseCb),
        ],
        handleResponse()
      );
    else if (typeof hasMiddleware === "object" && hasMiddleware !== null)
      router.use(
        url,
        [
          (error, r, rs, n) =>
            r.method === method
              ? (r.errorStatus = (error.status || 500) && n())
              : n(error),
          ...checkFor(hasMiddleware),
          wrapAsync(responseCb),
        ],
        handleResponse()
      );
    else
      router.use(
        url,
        [
          (error, r, rs, n) =>
            r.method === method
              ? (r.errorStatus = (error.status || 500) && n())
              : n(error),
          wrapAsync(responseCb),
        ],
        handleResponse()
      );
  };

  const throwError = (status, message, errors = {}) => {
    const error = new Error(message);
    error.status = status || 404;
    if (!error.message) {
      switch (status) {
        case 404:
          error.message = "Resource not Found";
          break;
        case 400:
          error.message = "Bad Request";
          break;
        case 401:
          error.message = "Authentication Required";
          break;
        case 403:
          error.message = "Forbidden";
          break;
        default:
          error.message = "Error message not specified";
      }
    }
    error.errors = errors;
    throw error;
  };

  const models = require("../db/models");

  return {
    get,
    edit,
    create,
    del,
    use,
    tryRoute,
    catchRoute,
    throwError,
    router,
    ...models,
  };
};

module.exports = {
  checkFor,
  route,
};
