const MESSAGES = Symbol("ClustreeIntlMessages");
exports.MESSAGES = MESSAGES;

const { MacroError } = require("babel-plugin-macros");

function buildMacroError(errorMessage, path) {
  const errorMsg = `[@clustree/intl] ${errorMessage}`;
  if (path != null) {
    const error = path.buildCodeFrameError(errorMsg);
    error.name = "MacroError";
    return error;
  }
  return new MacroError(errorMsg);
}

exports.buildMacroError = buildMacroError;

function evaluatePath(path) {
  const evaluated = path.evaluate();
  if (evaluated.confident) {
    return evaluated.value;
  }

  throw buildMacroError(
    "Messages must be statically evaluate-able for extraction.",
    path
  );
}

exports.getMessageDescriptorKey = function getMessageDescriptorKey(path) {
  if (path.isIdentifier() || path.isJSXIdentifier()) {
    return path.node.name;
  }
  throw buildMacroError("Unable to extract descriptorKey", path);
};

exports.getMessageDescriptorValue = function getMessageDescriptorValue(path) {
  if (path.isJSXExpressionContainer()) {
    path = path.get("expression");
  }

  // Always trim the Message Descriptor values.
  const descriptorValue = evaluatePath(path);

  if (typeof descriptorValue === "string") {
    return descriptorValue.trim();
  }
  return descriptorValue;
};

exports.storeMessage = function storeMessage(descriptor, path, state) {
  const { description, defaultMessage, id = defaultMessage } = descriptor;
  const { file } = state;

  if (!defaultMessage) {
    throw buildMacroError(
      "Message Descriptors require a `defaultMessage`.",
      path
    );
  }

  const messages = file.get(MESSAGES);
  if (messages.has(id)) {
    const existing = messages.get(id);
    if (
      description !== existing.description ||
      defaultMessage !== existing.defaultMessage
    ) {
      throw buildMacroError(
        `Duplicate message id: "${id}", ` +
          "but the `description` and/or `defaultMessage` are different.",
        path
      );
    }
  }

  messages.set(id, { id, description, defaultMessage });
};
