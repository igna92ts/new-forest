const internalError = message => {
  return { message };
};

exports.missingRequiredProperty = property => internalError(`missing property ${property}`);
exports.defaultError = msg => internalError(msg);
