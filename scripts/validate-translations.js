#!/usr/bin/env node

/* eslint-disable max-depth, import/no-nodejs-modules, no-console */
const path = require("path");

// TODO check that translations tags have the same count and ids
const intlparser = require("intl-messageformat-parser");
const { tokenize } = require("../lib/parse");
const chalk = require("chalk");
const { parse } = require("./utils/parse");

const defaultPrefix = path.join(process.cwd(), "messages", "translations");
const defaultLanguage = "en";
const languages = ["en", "fr"];

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
            return null;
          }
        }
        return set;
      }
    }
    if (ast.format.type === "selectFormat") {
      return new Set().add(ast.id);
    }
  }
  return null;
}

function getValues(message) {
  const ast = intlparser.parse(message);
  return astGetValues(ast);
}

function getComponents(message) {
  const tags = new Set(
    tokenize(message)
      .filter((e) => e.type.startsWith("jsx"))
      .map((e) => e.id)
  );
  return tags;
}

exports.validate = (prefix = defaultPrefix) => {
  const invalidICUFormat = [];
  const invalidXML = [];
  const potentialErrors = [];

  const messageCache = new Map();

  for (const language of languages) {
    const messages = require(path.join(prefix, `${language}.json`));
    messageCache.set(language, parse(messages));
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
        values: new Set(),
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
  if (invalidICUFormat.length) {
    process.exitCode = 1;
    console.log(
      chalk.bold.underline("Invalid ICU Format in the following messages")
    );
    for (const errorObj of invalidICUFormat) {
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
    values,
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
        .map((e) => chalk.blue(e))
        .join(", ")} in default Message`
    );
  }
  if (values && values.size) {
    console.log(
      `      Missing values ${[...errorObj.values]
        .sort()
        .map((e) => chalk.magenta(e))
        .join(", ")} in default Message`
    );
  }
  console.log();
}

if (!module.parent) {
  exports.validate();
}
