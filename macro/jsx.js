const {
  getMessageDescriptorValue,
  getMessageDescriptorKey,
  storeMessage,
  buildMacroError
} = require("./helpers");

exports.handleJSX = function handleJSX(p, state, babel) {
  // Ignore closing tag
  if (p.parentPath.type === "JSXClosingElement") {
    return;
  }
  let path = p.parentPath.parentPath;
  //  Path is now the JSXElement <Translate />
  if (path.type !== "JSXElement") {
    throw buildMacroError("`Translate` not called as JSX");
  }
  transformJSX(path, state, babel);
};

const mergeProps = (props, nextProps) => ({
  text: props.text + nextProps.text,
  values: Object.assign({}, props.values, nextProps.values),
  components: Object.assign({}, props.components, nextProps.components),
  formats: props.formats,
  elementIndex: nextProps.elementIndex
});

const initialProps = ({ formats } = {}) => ({
  text: "",
  values: {},
  components: {},
  formats: formats || {}
});

function transformJSX(path, state, babel) {
  const { types } = babel;
  processTranslate(path, types);
  extractDefs(path, state);
}

function processElement(node, props, types) {
  const item = node.openingElement.name;
  let name = item.name;
  const index = elementGenerator(name);
  if (index) {
    name = `${name}-${index}`;
  }
  const selfClosing = node.openingElement.selfClosing;

  props.text += !selfClosing ? `<${name}>` : `<${name}/>`;

  for (const child of node.children) {
    props = processChild(child, props, types);
  }

  if (!selfClosing) {
    props.text += `</${name}>`;
  }

  props.components = Object.assign({}, props.components, {
    [name]: types.objectProperty(
      types.isValidIdentifier(name)
        ? types.identifier(name)
        : types.stringLiteral(name),
      node
    )
  });
  return props;
}

const generatorFactory = () => {
  const data = new Map();
  return key => {
    const value = data.get(key) || 0;
    data.set(key, value + 1);
    return value;
  };
};

let elementGenerator;
let argumentGenerator;

function processChild(node, props, types) {
  let nextProps = initialProps({ formats: props.formats });
  if (types.isJSXExpressionContainer(node)) {
    const exp = node.expression;

    if (types.isStringLiteral(exp)) {
      nextProps.text += exp.value;
    } else if (types.isTemplateLiteral(exp)) {
      const parts = [];

      exp.quasis.forEach((item, index) => {
        parts.push(item);

        if (!item.tail) {
          parts.push(exp.expressions[index]);
        }
      });

      parts.forEach(item => {
        if (types.isTemplateElement(item)) {
          nextProps.text += item.value.raw;
        } else {
          const name = item.name;
          const key = item;
          nextProps.text += `{${name}}`;
          nextProps.values[name] = types.objectProperty(key, item);
        }
      });
    } else if (types.isJSXElement(exp)) {
      nextProps = processElement(exp, nextProps);
    } else {
      const name = types.isIdentifier(exp) ? exp.name : argumentGenerator();
      const key = types.isIdentifier(exp) ? exp : types.numericLiteral(name);
      nextProps.text += `{${name}}`;
      // FIXME: This is a workaround that helps Translate work with nested tags
      if (types.isIdentifier(exp)) {
        nextProps.values[name] = types.objectProperty(
          key,
          types.identifier(name)
        );
      } else {
        nextProps.values[name] = types.objectProperty(key, exp);
      }
    }
  } else if (types.isJSXElement(node)) {
    nextProps = processElement(node, nextProps, types);
  } else {
    nextProps.text += node.value;
  }

  return mergeProps(props, nextProps);
}

function processTranslate(path, types) {
  const children = path.node.children;
  if (children.length === 0) {
    return;
  }
  let props = initialProps();
  elementGenerator = generatorFactory();
  argumentGenerator = generatorFactory();
  for (const child of children) {
    props = processChild(child, props, types);
  }

  // replace whitespace before/after newline with single space
  const nlRe = /\s*(?:\r\n|\r|\n)+\s*/g;
  // remove whitespace before/after tag
  const nlTagRe = /(?:(>)(?:\r\n|\r|\n)+\s+|(?:\r\n|\r|\n)+\s+(?=<))/g;

  const text = props.text
    .replace(nlTagRe, "$1")
    .replace(nlRe, " ")
    .trim();

  const values = Object.values(props.values);
  const components = Object.values(props.components);

  const attributes = path.node.openingElement.attributes.slice();
  attributes.push(
    types.JSXAttribute(
      types.JSXIdentifier("defaultMessage"),
      types.StringLiteral(text)
    )
  );
  if (values.length) {
    attributes.push(
      types.JSXAttribute(
        types.JSXIdentifier("values"),
        types.JSXExpressionContainer(types.objectExpression(values))
      )
    );
  }
  if (components.length) {
    attributes.push(
      types.JSXAttribute(
        types.JSXIdentifier("components"),
        types.JSXExpressionContainer(types.objectExpression(components))
      )
    );
  }

  path.replaceWith(
    types.JSXElement(
      types.JSXOpeningElement(
        types.JSXIdentifier("Translate"),
        attributes,
        true
      ),
      null,
      []
    )
  );
}

const DESCRIPTOR_PROPS = new Set(["id", "description", "defaultMessage"]);

function createMessageDescriptor(propPaths) {
  return propPaths.reduce((hash, [keyPath, valuePath]) => {
    const key = getMessageDescriptorKey(keyPath);

    if (DESCRIPTOR_PROPS.has(key)) {
      hash[key] = valuePath;
    }

    return hash;
  }, {});
}

function extractDefs(path, state) {
  const attributes = path
    .get("openingElement")
    .get("attributes")
    .filter(attr => attr.isJSXAttribute());

  if (
    attributes.find(attribute => attribute.node.name.name === "allowDynamic")
  ) {
    // Ignore this Tag as it is dynamic
    return;
  }

  let descriptor = createMessageDescriptor(
    attributes.map(attr => [attr.get("name"), attr.get("value")])
  );

  // In order for a default message to be extracted when
  // declaring a JSX element, it must be done with standard
  // `key=value` attributes. But it's completely valid to write
  // `<Translate id={dynamicId} />`, because it will be
  // skipped here and extracted elsewhere. The descriptor will
  // be extracted only if a `defaultMessage` prop exists.
  if (descriptor.defaultMessage) {
    // Evaluate the Message Descriptor values in a JSX
    // context, then store it.
    descriptor = evaluateMessageDescriptor(descriptor);

    storeMessage(descriptor, path, state);

    // Remove description since it's not used at runtime.
    attributes.some(attr => {
      const ketPath = attr.get("name");
      if (getMessageDescriptorKey(ketPath) === "description") {
        attr.remove();
        return true;
      }
      return false;
    });
  } else {
    const error = path.buildCodeFrameError(
      "[Clustree Intl] No message defined in Translate."
    );
    error.name = "MacroError";
    throw error;
  }
}

function evaluateMessageDescriptor({ ...descriptor }) {
  Object.keys(descriptor).forEach(key => {
    const valuePath = descriptor[key];

    descriptor[key] = getMessageDescriptorValue(valuePath);
  });

  return descriptor;
}
