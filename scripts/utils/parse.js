const intlparser = require("intl-messageformat-parser");

class ParseError extends Error {
  constructor(args) {
    super("ParseError");
    // Workaround for https://github.com/istanbuljs/istanbuljs/issues/139
    this.constructor = ParseError;
    this.__proto__ = ParseError.prototype;
    // End Workaround
    this.data = args;
    this.message = JSON.stringify(args, null, 2);
  }
}

exports.ParseError = ParseError;

exports.parse = (messages) => {
  const invalidICUFormat = [];
  const langCache = new Map();
  // eslint-disable-next-line global-require
  for (const [key, message] of Object.entries(messages)) {
    try {
      intlparser.parse(message);
    } catch (e) {
      invalidICUFormat.push({ key, message });
      continue;
    }
    langCache.set(key, { message });
  }
  if (invalidICUFormat.length) {
    throw new ParseError({
      invalidICUFormat,
    });
  }
  return langCache;
};
