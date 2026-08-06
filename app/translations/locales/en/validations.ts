export default {
    default: "The field {{path}} is invalid",
    required: "The field {{path}} is required",
    oneOf: "The field {{path}} must be one of the following values: {{values}}",
    notOneOf: "The field {{path}} must not be one of the following values: {{values}}",
    notType: "The field {{path}} must be of type {{type}}",
    defined: "The field {{path}} must be defined",

    string: {
        length: "The field {{path}} must be exactly {{length}} characters long",
        min: "The field {{path}} must be at least {{min}} characters long",
        max: "The field {{path}} must be at most {{max}} characters long",
        matches: "The field {{path}} must match the required format",
        email: "The field {{path}} must be a valid email address",
        url: "The field {{path}} must be a valid URL",
        uuid: "The field {{path}} must be a valid UUID",
        trim: "The field {{path}} must not contain leading or trailing spaces",
        lowercase: "The field {{path}} must be in lowercase",
        uppercase: "The field {{path}} must be in uppercase"
    },

    number: {
        min: "The field {{path}} must be greater than or equal to {{min}}",
        max: "The field {{path}} must be less than or equal to {{max}}",
        lessThan: "The field {{path}} must be less than {{less}}",
        moreThan: "The field {{path}} must be greater than {{more}}",
        positive: "The field {{path}} must be a positive number",
        negative: "The field {{path}} must be a negative number",
        integer: "The field {{path}} must be an integer"
    },

    date: {
        min: "The field {{path}} must be after {{min}}",
        max: "The field {{path}} must be before {{max}}"
    },

    object: {
        noUnknown: "The field {{path}} contains unknown keys"
    },

    array: {
        min: "The field {{path}} must contain at least {{min}} items",
        max: "The field {{path}} must contain at most {{max}} items"
    }
};
