class AuthzError extends Error {}
module.exports.AuthzError = AuthzError;

class InvalidInput extends AuthzError {}
module.exports.InvalidInput = InvalidInput;
