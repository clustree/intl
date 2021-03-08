const test = process.env.NODE_ENV === "test";

module.exports = test
  ? {
      presets: ["@babel/preset-env", "@babel/preset-react"],
      plugins: [
        "@babel/proposal-object-rest-spread",
        "@babel/proposal-class-properties",
        "macros",
      ],
    }
  : {};
