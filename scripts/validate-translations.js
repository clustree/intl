#!/usr/bin/env node

/* eslint-disable max-depth, import/no-nodejs-modules, no-console */
const path = require("path");

// TODO check that translations tags have the same count and ids
const intlparser = require("intl-messageformat-parser");
const { parse, tokenize } = require("../lib/parse");
const chalk = require("chalk");

const prefix = path.join(process.cwd(), "messages", "translations");
const defaultLanguage = "en";
const languages = ["en", "fr"];

function raiseParseError(ast) {
  console.log(chalk.magenta(JSON.stringify(ast, null, 2)));
  throw new Error("unexpected");
}

// TODO: simplify
function getMessageVariants(ast) {
  const { type } = ast;
  if (type === "messageFormatPattern") {
    return ast.elements.map(getMessageVariants);
  }
  if (type === "messageTextElement") {
    return ast.value;
  }
  if (type === "argumentElement") {
    if (ast.format === null) {
      return `{${ast.id}}`;
    }
    if (ast.format.type === "numberFormat") {
      return `{${ast.id}, number}`;
    }
    if (ast.format.type === "pluralFormat") {
      if (!ast.format.ordinal) {
        return {
          type: "plural",
          id: ast.id,
          values: ast.format.options.map(option => {
            if (option.type === "optionalFormatPattern") {
              return {
                selector: option.selector,
                value: getMessageVariants(option.value)
              };
            }
            raiseParseError(ast);
            return null;
          })
        };
      }
    }
  }
  raiseParseError(ast);
  return null;
}

function astGetValues(ast) {
  const { type } = ast;
  if (type === "messageFormatPattern") {
    const set = new Set();
    for (const element of ast.elements) {
      for (const value of astGetValues(element)) {
        set.add(value);
      }
    }
    return set;
  }
  if (type === "messageTextElement") {
    return new Set();
  }
  if (type === "argumentElement") {
    if (ast.format === null) {
      return new Set().add(ast.id);
    }
    if (ast.format.type === "numberFormat") {
      return new Set().add(ast.id);
    }
    if (ast.format.type === "pluralFormat") {
      if (!ast.format.ordinal) {
        const set = new Set();
        set.add(ast.id);
        for (const o of ast.format.options) {
          if (o.type === "optionalFormatPattern") {
            for (const value of astGetValues(o.value)) {
              set.add(value);
            }
          } else {
            raiseParseError(ast);
            return null;
          }
        }
        return set;
      }
    }
  }
  raiseParseError(ast);
  return null;
}

function getValues(message) {
  const ast = intlparser.parse(message);
  return astGetValues(ast);
}

function getComponents(message) {
  const tags = new Set(
    tokenize(message)
      .filter(e => e.type.startsWith("jsx"))
      .map(e => e.id)
  );
  return tags;
}

// TODO: simplify
function flatten(ast) {
  if (Array.isArray(ast)) {
    const res = ast.reduce(
      (acc, token) => {
        if (typeof token === "string") {
          return acc.map(e => ({
            ...e,
            value: e.value + token
          }));
        } else {
          let retVal = [];
          const pluralId = token.id;
          for (const pluralValue of token.values) {
            const { selector } = pluralValue;
            for (const inner of flatten(pluralValue.value)) {
              retVal = retVal.concat(
                acc.map(e => ({
                  plurals: [
                    ...e.plurals,
                    { pluralId, selector },
                    ...inner.plurals
                  ],
                  value: e.value + inner.value
                }))
              );
            }
          }
          return retVal;
        }
      },
      [{ value: "", plurals: [] }]
    );
    return res;
  }
  return ast;
}

exports.validate = () => {
  const invalidCDLR = [];
  const invalidXML = [];
  const potentialErrors = [];

  const messageCache = new Map();

  for (const language of languages) {
    const langCache = new Map();
    // eslint-disable-next-line global-require
    const messages = require(path.join(prefix, `${language}.json`));
    for (const [key, message] of Object.entries(messages)) {
      const data = {};
      const variantMap = new Map();
      let parsed = null;
      try {
        parsed = intlparser.parse(message);
      } catch (e) {
        invalidCDLR.push({ language, key, message });
        continue;
      }
      // Parsing validates Intl AST format
      const variants = flatten(getMessageVariants(parsed));
      for (const variant of variants) {
        const variantKey =
          variant.plurals
            .map(({ pluralId, selector }) => `${pluralId}:${selector}`)
            .join("") || "default";
        variantMap.set(variantKey, variant.value);
        try {
          parse(variant.value);
        } catch (e) {
          invalidXML.push({
            language,
            key,
            message,
            variant: variant.value,
            variantKey
          });
          continue;
        }
      }
      data.message = message;
      data.variants = variantMap;
      langCache.set(key, data);
    }
    messageCache.set(language, langCache);
  }

  for (const message of messageCache.get(defaultLanguage).values()) {
    const components = new Set();
    const values = new Set();
    for (const component of getComponents(message.message)) {
      components.add(component);
    }
    for (const value of getValues(message.message)) {
      values.add(value);
    }
    message.components = components;
    message.values = values;
  }

  for (const language of languages) {
    if (language === defaultLanguage) {
      continue;
    }
    for (const [key, message] of messageCache.get(language)) {
      const defaultMessage = messageCache.get(defaultLanguage).get(key);
      const components = defaultMessage.components;
      const values = defaultMessage.values;
      let flag = false;
      const errorObj = {
        language,
        key,
        message: message.message,
        defaultMessage: messageCache.get(defaultLanguage).get(key).message,
        components: new Set(),
        values: new Set()
      };
      for (const component of getComponents(message.message)) {
        if (!components.has(component)) {
          errorObj.components.add(component);
          flag = true;
        }
      }
      for (const value of getValues(message.message)) {
        if (!values.has(value)) {
          errorObj.values.add(value);
          flag = true;
        }
      }
      if (flag) {
        potentialErrors.push(errorObj);
      }
    }
  }

  if (invalidCDLR.length) {
    process.exitCode = 1;
    console.log(chalk.bold.underline("Invalid CDLR messages"));
    for (const errorObj of invalidCDLR) {
      logErrorObj(errorObj);
    }
  }
  if (invalidXML.length) {
    process.exitCode = 1;
    console.log(chalk.bold.underline("Invalid XML messages"));
    for (const errorObj of invalidXML) {
      logErrorObj(errorObj);
    }
  }
  if (potentialErrors.length) {
    console.log(chalk.underline("Potential error Keys"));
    for (const errorObj of potentialErrors) {
      logErrorObj(errorObj);
    }
  }
};

function logErrorObj(errorObj) {
  const {
    language,
    key,
    message,
    defaultMessage,
    variantKey,
    variant,
    components,
    values
  } = errorObj;
  const logVariant = errorObj.variantKey && errorObj.variantKey !== "default";
  console.log(chalk`  {yellow ${language}} {green ${key}} ${message}`);
  if (logVariant) {
    console.log(chalk`    {gray ${variantKey}} ${variant}`);
  }
  if (defaultMessage) {
    console.log(chalk`    {gray ${defaultMessage}}`);
  }
  if (components && components.size) {
    console.log(
      `      Missing components ${[...errorObj.components]
        .sort()
        .map(e => chalk.blue(e))
        .join(", ")} in default Message`
    );
  }
  if (values && values.size) {
    console.log(
      `      Missing values ${[...errorObj.values]
        .sort()
        .map(e => chalk.magenta(e))
        .join(", ")} in default Message`
    );
  }
  console.log();
}

if (!module.parent) {
  exports.validate();
}
