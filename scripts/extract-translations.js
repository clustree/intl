#!/usr/bin/env node

/* eslint-disable no-console */
const { validate } = require("./validate-translations");
const {
  default: manageTranslations,
  readMessageFiles,
  createSingleMessagesFile,
  getDefaultMessages
} = require("react-intl-translations-manager");
const ora = require("ora");

const chalk = require("chalk");

const messagesDirectory = "messages/build";
const translationsDirectory = "messages/translations";
const { default: Worker } = require("jest-worker");

// No top level async await
(async () => {
  const worker = new Worker(require.resolve("./worker"));
  const spinner = ora();

  spinner.start("cleaning messages directory");
  await worker.rimraf(messagesDirectory);
  spinner.succeed();

  spinner.start("getting javascript files");
  const files = await worker.glob("src/**/*.js", {
    ignore: ["**/*.spec.js", "**/__tests__/**"]
  });
  spinner.succeed();

  spinner.start("extracting intl messages");
  const promises = files.map(file => worker.transform(file, { babelrc: true }));
  let done = 0;
  promises.forEach(p =>
    p.then(() => {
      done++;
      if (done % 10 === 0) {
        spinner.text = `extracting intl messages ${Math.floor(
          (done * 100) / files.length
        )}%`;
      }
    })
  );

  await Promise.all(promises);
  worker.end();
  spinner.succeed("extracting intl messages").stop();

  manageTranslations({
    messagesDirectory,
    translationsDirectory,
    singleMessagesFile: true,
    languages: ["fr"], // any language you need
    detectDuplicateIds: false,
    jsonOptions: {
      trailingNewline: true,
      space: 2
    }
  });

  // Output Default Messages
  const extractedMessages = readMessageFiles(messagesDirectory);
  const { messages, duplicateIds } = getDefaultMessages(extractedMessages);

  createSingleMessagesFile({
    messages,
    directory: translationsDirectory,
    fileName: "en.json"
  });

  const duplicateIdSet = new Set(duplicateIds.sort());
  if (duplicateIdSet.size) {
    console.log(chalk.underline.bold("Duplicate ids:"));
  }
  for (const duplicateId of duplicateIdSet) {
    const defaultMessages = getMessages(extractedMessages, duplicateId);
    if (defaultMessages.size > 1) {
      console.log(chalk.red(`  ${duplicateId}:`));
      for (const dM of defaultMessages) {
        console.log(`    ${dM}`);
      }
    }
  }

  validate();
})();

function joinLines(string) {
  return string
    .split("\n")
    .map(s => s.trim())
    .join(" ");
}

function getMessages(messages, duplicateId) {
  return new Set(
    []
      .concat(...messages.map(e => e.descriptors))
      .filter(e => e.id === duplicateId)
      .map(e => e.defaultMessage)
      .map(joinLines)
  );
}
