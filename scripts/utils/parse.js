const intlparser = require("intl-messageformat-parser");
const { getMessageVariants, flatten } = require("./getMessageVariants");
const { parse } = require("../../lib/parse");

class ParseError extends Error {
  constructor(args) {
    super("ParseError");
    // Workaround for https://github.com/istanbuljs/istanbuljs/issues/139
    this.constructor = ParseError;
    this.__proto__ = ParseError.prototype;
    // End Workaround
    this.data = args;
  }
}

exports.ParseError = ParseError;

exports.parse = (messages) => {
  const invalidICUFormat = [];
  const invalidXML = [];
  const langCache = new Map();
  // eslint-disable-next-line global-require
  for (const [key, message] of Object.entries(messages)) {
    const variantMap = new Map();
    let parsed = null;

    try {
      parsed = intlparser.parse(message);
    } catch (e) {
      invalidICUFormat.push({ key, message });
      continue;
    }
    // Parsing validates Intl AST format
    const variants = flatten(getMessageVariants(parsed));
    for (const variant of variants) {
      const variantKey =
        variant.plurals
          .map(({ pluralId, selector }) => `${pluralId}:${selector}`)
          .join(",") || "default";
      variantMap.set(variantKey, variant.value);
      try {
        parse(variant.value);
      } catch (e) {
        invalidXML.push({
          key,
          message,
          variant: variant.value,
          variantKey,
        });
        continue;
      }
    }
    langCache.set(key, { message });
  }
  if (invalidICUFormat.length || invalidXML.length) {
    throw new ParseError({
      invalidICUFormat,
      invalidXML,
    });
  }
  return langCache;
};
