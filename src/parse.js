const regexOpen = /<([A-Za-z0-9-:]+)>/g;
const regexClose = /<\/([A-Za-z0-9-:]+)>/g;
const regexAutoClose = /<([A-Za-z0-9-:]+) ?\/>/g;

function last(arr) {
  return arr[arr.length - 1];
}

function test(input, regex, type) {
  // eslint-disable-next-line no-param-reassign
  regex.lastIndex = 0;
  const match = regex.exec(input);
  if (match == null) {
    return null;
  }
  const [value, id] = match;
  const start = match.index;
  const end = regex.lastIndex;
  return { value, type, start, end, id };
}

export function tokenize(input) {
  const matches = [
    test(input, regexOpen, "jsx-open"),
    test(input, regexClose, "jsx-close"),
    test(input, regexAutoClose, "jsx-autoclose"),
  ];
  const match = matches.reduce((acc, e) => {
    if (acc == null) {
      return e;
    }
    if (e == null) {
      return acc;
    }
    if (e.start < acc.start) {
      return e;
    }
    return acc;
  }, null);
  if (match == null) {
    return [{ type: "string", value: input }];
  }
  const { start, end, id, type, value } = match;
  return [
    { type: "string", value: input.slice(0, start) },
    { type, id, value },
    ...tokenize(input.slice(end)),
  ];
}

export class ParseError extends Error {}

export function parse(input) {
  const tokens = tokenize(input);
  const stack = [{ type: null, values: [] }];
  for (const token of tokens) {
    if (token.type === "jsx-open") {
      stack.push({ id: token.id, values: [], type: "jsx" });
    } else if (token.type === "jsx-close") {
      const plate = stack.pop();
      if (plate.id !== token.id) {
        throw new ParseError(`Unable to parse: ${input}`);
      }
      last(stack).values.push(plate);
    } else {
      last(stack).values.push(token);
    }
  }
  if (stack.length !== 1) {
    throw new ParseError(`Unable to parse: ${input}`);
  }
  return stack[0].values;
}
