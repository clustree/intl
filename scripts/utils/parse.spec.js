/* eslint-env jest */
import { parse, ParseError } from "./parse";

// Adapted from https://github.com/dmnd/dedent
function dedent(strings, ...values) {
  // $FlowFixMe: Flow doesn't undestand .raw
  const raw = typeof strings === "string" ? [strings] : strings.raw;

  // first, perform interpolation
  let result = "";
  for (let i = 0; i < raw.length; i++) {
    result += raw[i]
      // join lines when there is a suppressed newline
      .replace(/\\\n[ \t]*/g, "")
      // handle escaped backticks
      .replace(/\\`/g, "`");

    if (i < values.length) {
      result += values[i];
    }
  }

  // now strip indentation
  const lines = result.split("\n");
  let mindent = null;
  lines.forEach((l, i) => {
    let m = l.match(/^\s*(?=\S)/);
    let indent = m == null ? null : m[0].length;
    if (indent != null && !(i === 0 && indent === 0)) {
      if (mindent == null) {
        // this is the first indented line
        mindent = indent;
      } else {
        mindent = Math.min(mindent, indent);
      }
    }
  });

  if (mindent !== null) {
    const m = mindent; // appease Flow
    result = lines.map(l => (l[0] === " " ? l.slice(m) : l)).join("\n");
  }
  return (
    result
      // handle escaped newlines at the end to ensure they don't get stripped too
      .replace(/\\n/g, "\n")
  );
}

describe("parse", () => {
  it.only("correctly parses", () => {
    expect(
      parse({
        simple: "value",
        number: "{value, number}",
        plural: "{value, plural, one{ # three} two {# test}}",
        select: "{value, select, male { He} female {She} other {They}}",
        xml: "<a><b/></a>",
        pluralXml: "<a>{value, plural, one { # </a>} other {# </a>}}",
        selectXml: "<a>{value, select, male { # </a>} other {# </a>}}",
        nested:
          "<a>{value1, plural, one {{value2, select,left {one left</a>} other {one right</a>}}}other {{value2, select,right {one right</a>} other {one left</a>}}}}"
      })
    ).toMatchInlineSnapshot(
      `
Map {
  "simple" => Object {
    "message": "value",
  },
  "number" => Object {
    "message": "{value, number}",
  },
  "plural" => Object {
    "message": "{value, plural, one{ # three} two {# test}}",
  },
  "select" => Object {
    "message": "{value, select, male { He} female {She} other {They}}",
  },
  "xml" => Object {
    "message": "<a><b/></a>",
  },
  "pluralXml" => Object {
    "message": "<a>{value, plural, one { # </a>} other {# </a>}}",
  },
  "selectXml" => Object {
    "message": "<a>{value, select, male { # </a>} other {# </a>}}",
  },
  "nested" => Object {
    "message": "<a>{value1, plural, one {{value2, select,left {one left</a>} other {one right</a>}}}other {{value2, select,right {one right</a>} other {one left</a>}}}}",
  },
}
`
    );
  });

  it("fails", () => {
    expect(() => parse({ key: "{invalidICU" })).toThrow(ParseError);
    try {
      parse({ key: "{invalidICU" });
    } catch (error) {
      expect(error.data).toMatchInlineSnapshot(
        dedent`
        Object {
          "invalidICUFormat": Array [
            Object {
              "key": "key",
              "message": "{invalidICU",
            },
          ],
          "invalidXML": Array [],
        }
        `
      );
    }

    expect(() => parse({ key: "<a>InvalidXML" })).toThrow(ParseError);
    try {
      parse({ key: "<a>InvalidXML" });
    } catch (error) {
      expect(error.data).toMatchInlineSnapshot(
        dedent`
        Object {
          "invalidICUFormat": Array [],
          "invalidXML": Array [
            Object {
              "key": "key",
              "message": "<a>InvalidXML",
              "variant": "<a>InvalidXML",
              "variantKey": "default",
            },
          ],
        }
        `
      );
    }
  });
});
