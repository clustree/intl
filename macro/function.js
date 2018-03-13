const {
  getMessageDescriptorValue,
  getMessageDescriptorKey,
  storeMessage,
  buildMacroError
} = require("./helpers");

exports.handleFunction = function handleFunction(p, state) {
  let path = p.parentPath;
  if (path.type !== "CallExpression") {
    throw buildMacroError("`translate` not called as a function", path);
  }
  const args = path.get("arguments");
  const [message, options] = [args[0], args[1]];
  const defaultMessage = getMessageDescriptorValue(message);
  let id = defaultMessage;
  let description = null;
  if (options != null) {
    const optionsObj = options.get("properties").reduce((acc, prop) => {
      const key = getMessageDescriptorKey(prop.get("key"));
      if (!["id", "description"].includes(key)) {
        return acc;
      }
      const value = getMessageDescriptorValue(prop.get("value"));
      acc[key] = value;
      return acc;
    }, {});
    if (optionsObj.id) {
      id = optionsObj.id;
    }
    if (optionsObj.description) {
      description = optionsObj.description;
    }
  }

  // Evaluate the Message Descriptor values, then store it.
  const descriptor = {
    defaultMessage,
    id
  };
  if (description != null) {
    descriptor.description = description;
  }
  storeMessage(descriptor, path, state);
};
