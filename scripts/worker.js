/* eslint-disable func-names */

const babel = require("babel-core");
const rimraf = require("rimraf");
const glob = require("glob");

exports.transform = function(filename, options = {}) {
  return new Promise((r, e) => {
    return babel.transformFile(filename, options, error => {
      if (error) {
        e(error);
      } else {
        r();
      }
    });
  });
};

exports.rimraf = function(pattern, options = {}) {
  return new Promise((r, e) =>
    rimraf(pattern, options, error => {
      if (error) {
        e(error);
      } else {
        r();
      }
    })
  );
};

exports.glob = function(pattern, options = {}) {
  return new Promise((r, e) =>
    glob(pattern, options, (err, files) => {
      if (err) {
        e(err);
      } else {
        r(files);
      }
    })
  );
};
