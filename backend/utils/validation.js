const { validationResult, check } = require("express-validator");
const { Model } = require("sequelize");
const { Venue } = require("../db/models");

// middleware for formatting errors from express-validator middleware
// (to customize, see express-validator's documentation)
const handleValidationErrors = (req, _res, next) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    const errors = {};
    validationErrors
      .array()
      .forEach((error) => (errors[error.path] = error.msg));

    const err = Error("Bad request");
    err.errors = errors;
    err.status = 400;
    err.title = "Bad request";
    next(err);
  }
  next();
};

const validateValidId = (model) => async (id) => {
  if (id === null) return;
  if (typeof model == "function" && model.prototype instanceof Model) {
    const instance = await model.findByPk(id);
    if (!instance) {
      throw new Error(`id: ${id} is not a valid id in the ${model.name} model`);
    }
  } else if (typeof model === "string") {
    // Try to require the model by its name
    const models = require("../db/models");
    const ModelClass = models[model.charAt(0).toUpperCase() + model.slice(1)];

    if (!ModelClass || !(ModelClass.prototype instanceof Model)) {
      throw new Error(`Model ${model} is not defined`);
    }

    const instance = await ModelClass.findByPk(id);
    if (!instance) {
      throw new Error(
        `ID: ${id} is not a valid ID in the ${ModelClass.name} model`
      );
    }
  } else {
    throw new Error(`Invalid model type provided: ${model}`);
  }
};

const genCheck = (attribute, { attributes }) => {
  const prefix = check(attribute);
  if (attributes === undefined) return prefix.exists();
  if (attributes === false) return prefix.optional();
  const isOptional = attributes[attribute];
  if (isOptional === undefined) return undefined;
  return isOptional ? prefix.optional() : prefix.exists();
};

/*

model: Group
attributes:{
  name:true, -> name is required
  about:false, -> about is not required, but will be checked if exists
  private:undefined -> private is not checked and does not exist
}

if attributes is undefined then everything will default to true

*/

const validations = (options) => {
  const group = {
    name: genCheck("name", options)
      ?.isLength({ min: 1, max: 60 })
      .withMessage("Name must be 60 characters or less"),
    about: genCheck("about", options)
      ?.isLength({ min: 50, max: 255 })
      .withMessage("About must be 60 characters or more"),
    type: genCheck("type", options)
      ?.isIn(["Online", "In Person"])
      .withMessage("Type must be 'Online' or 'In person'"),
    city: genCheck("city", options)?.notEmpty().withMessage("City is required"),
    state: genCheck("state", options)
      ?.notEmpty()
      .withMessage("State is required"),
  };

  const validateLatitude = (value) => {
    if (typeof value !== "number") {
      throw new Error("Latitude must be a number");
    }
    if (value < -90 || value > 90) {
      throw new Error("Latitude must be between -90 and 90");
    }
    return true;
  };

  const validateLongitude = (value) => {
    if (typeof value !== "number") {
      throw new Error("Longitude must be a number");
    }
    if (value < -180 || value > 180) {
      throw new Error("Longitude must be between -180 and 180");
    }
    return true;
  };

  const venue = {
    address: genCheck("address", options)
      ?.notEmpty()
      .withMessage("Street address is required"),
    city: genCheck("city", options)?.notEmpty().withMessage("City is required"),
    state: genCheck("state", options)
      ?.notEmpty()
      .withMessage("State is required"),
    lat: genCheck("lat", options)
      ?.isDecimal({ decimal_digits: "1," })
      .custom(validateLatitude)
      .withMessage("Latitude is not valid"),
    lng: genCheck("lng", options)
      ?.isDecimal({ decimal_digits: "1," })
      .custom(validateLongitude)
      .withMessage("Longitude is not valid"),
  };

  const inRange =
    (range = [0, Infinity]) =>
    (num) => {
      const [lower, upper] = range;
      if (num < lower || num > upper) {
        throw new Error("value is not in range");
      }
      return true;
    };

  const isAfterDate =
    (field) =>
    (value, { req }) => {
      const comparisonDate = field ? new Date(req.body[field]) : new Date();

      if (new Date(value) <= comparisonDate) {
        throw new Error("Date must be in the future");
      }

      return true;
    };

  const event = {
    name: genCheck("name", options)
      ?.isLength({ min: 5 })
      .notEmpty()
      .withMessage("Name must be at least 5 characters"),
    type: genCheck("type", options)
      ?.isIn(["Online", "In person", "online", "in Person", "In person"])
      .withMessage("Type must be Online or In person"),
    capacity: genCheck("capacity", options)
      ?.isInt()
      .withMessage("Capacity must be an integer"),
    price: genCheck("price", options)
      ?.isDecimal()
      .custom(inRange())
      .withMessage("Price is invalid"),
    description: genCheck("description", options)
      ?.notEmpty()
      .withMessage("Description is required"),
    startDate: genCheck("startDate", options)
      ?.custom(isAfterDate())
      .withMessage("Start date must be in the future"),
    endDate: genCheck("endDate", options)
      ?.custom(isAfterDate("startDate"))
      .withMessage("End date is less than start date"),
  };
  const eventquery = {
    page: check("page")
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage(
        "Page must be greater than or equal to 1 and less than or equal to 10"
      ),
    size: check("size")
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage(
        "Size must be greater than or equal to 1 and less than or equal to 20"
      ),
    name: genCheck("name", options)
      ?.isString()
      .notEmpty()
      .withMessage("Name must be a string"),
    type: genCheck("type", options)
      ?.isIn(["Online", "In person", "online", "in Person", "In person"])
      .withMessage("Type must be Online or In person"),
    startDate: genCheck("startDate", options)
      ?.isDate()
      .withMessage("Start date must be a valid datetime")
      .custom(isAfterDate())
      .withMessage("Start date must be in the future"),
  };

  const membership = {
    status: genCheck("status", options)
      ?.not()
      .isIn(["pending"])
      .withMessage("Cannot change a membership status to pending"),
  };
  const attendance = {
    status: genCheck("status", options)
      ?.not()
      .isIn(["pending"])
      .withMessage("Cannot change an attendance status to pending"),
  };

  const groupimage = {
    url: genCheck("url", options)
      ?.isString()
      .withMessage("url must be a string"),
    preview: genCheck("preview", options)?.isBoolean("preview must be boolean"),
  };
  const eventimage = {
    url: genCheck("url", options)
      ?.isString()
      .withMessage("url must be a string"),
    preview: genCheck("preview", options)?.isBoolean("preview must be boolean"),
  };

  const validationObj = {
    group,
    venue,
    event,
    eventquery,
    membership,
    attendance,
    groupimage,
    eventimage,
  };
  return validationObj[options.model.toLowerCase()];
};

const validate = (options) => {
  if (typeof options === "string") {
    return [
      ...Object.values(validations({ model: options })),
      handleValidationErrors,
    ];
  }
  return [
    ...Object.values(validations(options)).filter((ele) => ele !== undefined),
    handleValidationErrors,
  ];
};

module.exports = {
  handleValidationErrors,
  check,
  validate,
};
