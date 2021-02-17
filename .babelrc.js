const test = process.env.NODE_ENV === "test";

module.exports = {
  presets: ["@babel/env", "@babel/react"],
  plugins: [
    "@babel/proposal-object-rest-spread",
    "@babel/proposal-class-properties",
    test ? "macros" : null
  ].filter(Boolean)
};
