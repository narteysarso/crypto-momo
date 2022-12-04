class RequiredParameterError extends Error {
    constructor(param) {
        super(`${param} cannot be null or undefined`);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, RequiredParameterError);
        }
    }
}

class InvalidPropertyError extends Error {
    constructor(msg) {
        super(msg);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidPropertyError);
        }
    }
}

class UniqueContantError extends Error {
    constructor(value) {
        super(`${value} must be unique.`)

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, UniqueConstraintError)
        }
    }
}

module.exports = {
    RequiredParameterError,
    InvalidPropertyError,
    UniqueContantError
}