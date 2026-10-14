const ApiError = require('../utils/ApiError');

// Validates and replaces req[source] with the parsed (coerced, stripped) zod output.
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
    return next(ApiError.badRequest(details[0]?.message || 'Invalid request', details));
  }
  if (source === 'query') {
    req.validatedQuery = result.data;
  } else {
    req[source] = result.data;
  }
  return next();
};

module.exports = validate;
