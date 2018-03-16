const { handleFunction } = require("./function");
const { handleJSX } = require("./jsx");
const { writeFileSync } = require("./writeFileSync");
const { MESSAGES } = require("./helpers");
const { createMacro } = require("babel-plugin-macros");
const { default: template } = require("@babel/template");
const p = require("path");

module.exports = createMacro(macro, { configName: "@clustree/intl" });

function macro({ references, state, config, babel }) {
  const { file } = state;
  const { types: t } = babel;

  pre(file);

  let imports = {};

  Object.keys(references).map((ref, i) => {
    for (const referencePath of references[ref] || []) {
      imports[ref] = {
        name: `${ref.toUpperCase()}_${i}`,
        value: t.identifier(referencePath.node.name)
      };
      break;
    }
  });

  for (const referencePath of references.translate || []) {
    handleFunction(referencePath, state);
  }

  for (const referencePath of references.Translate || []) {
    handleJSX(referencePath, state, babel);
  }

  post(file, config, imports);
}

function pre(file) {
  if (!file.has(MESSAGES)) {
    file.set(MESSAGES, new Map());
  }
}

function post(file, config, imports) {
  addImports(file, imports);

  const { basename, filename } = file.opts;

  const messages = file.get(MESSAGES);
  const descriptors = [...messages.values()];
  if (config && config.messagesDir && descriptors.length > 0) {
    // Make sure the relative path is "absolute" before
    // joining it with the `messagesDir`.
    const relativePath = p.join(p.sep, p.relative(process.cwd(), filename));

    const messagesFilename = p.join(
      config.messagesDir,
      p.dirname(relativePath),
      `${basename}.json`
    );

    const messagesFile = JSON.stringify(descriptors, null, 2);

    writeFileSync(messagesFilename, messagesFile);
  }
}

function addImports(file, imports) {
  const IMPORT_STRING = Object.entries(imports)
    .map(([key, { name }]) => `${key} as ${name}`)
    .join(", ");
  const IMPORT_VALUES = Object.entries(imports).reduce(
    (acc, [, { name, value }]) => {
      acc[name] = value;
      return acc;
    },
    {}
  );
  file.path.node.body.unshift(
    template(`import { ${IMPORT_STRING} } from '@clustree/intl';`)(
      IMPORT_VALUES
    )
  );
}
