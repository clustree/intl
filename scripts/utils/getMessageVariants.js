function getMessageVariants(ast) {
  const { type } = ast;
  if (type === "messageFormatPattern") {
    return ast.elements.map(getMessageVariants);
  }
  if (type === "messageTextElement") {
    return ast.value;
  }
  if (type === "argumentElement") {
    if (ast.format === null) {
      return `{${ast.id}}`;
    }
    if (ast.format.type === "numberFormat") {
      return `{${ast.id}, number}`;
    }
    if (ast.format.type === "pluralFormat") {
      if (!ast.format.ordinal) {
        return {
          type: "plural",
          id: ast.id,
          values: ast.format.options.map(option => {
            return {
              selector: option.selector,
              value: getMessageVariants(option.value)
            };
          })
        };
      }
    }
    if (ast.format.type === "selectFormat") {
      return {
        type: "select",
        id: ast.id,
        values: ast.format.options.map(option => {
          return {
            selector: option.selector,
            value: getMessageVariants(option.value)
          };
        })
      };
    }
  }
  return null;
}

exports.getMessageVariants = getMessageVariants;

// TODO: simplify
function flatten(ast) {
  if (Array.isArray(ast)) {
    const res = ast.reduce(
      (acc, token) => {
        if (typeof token === "string") {
          return acc.map(e => ({
            ...e,
            value: e.value + token
          }));
        } else {
          let retVal = [];
          const pluralId = token.id;
          for (const pluralValue of token.values) {
            const { selector } = pluralValue;
            for (const inner of flatten(pluralValue.value)) {
              retVal = retVal.concat(
                acc.map(e => ({
                  plurals: [
                    ...e.plurals,
                    { pluralId, selector },
                    ...inner.plurals
                  ],
                  value: e.value + inner.value
                }))
              );
            }
          }
          return retVal;
        }
      },
      [{ value: "", plurals: [] }]
    );
    return res;
  }
  return ast;
}

exports.flatten = flatten;
