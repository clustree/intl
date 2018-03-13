const path = require("path");
const fs = require("fs");
const { sync: mkdirpSync } = require("mkdirp");

exports.writeFileSync = function writeFileSync(messagesFilename, messagesFile) {
  mkdirpSync(path.dirname(messagesFilename));
  fs.writeFileSync(messagesFilename, messagesFile);
};
