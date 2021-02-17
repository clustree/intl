/* eslint-env jest */
import { parse, ParseError } from "./parse";

describe("parse", () => {
  it("parses valid translations", () => {
    expect(
      parse({
        simple: "value",
        number: "{value, number}",
        plural: "{value, plural, one{# three} two {# test}}",
        select: "{value, select, male {He} female {She} other {They}}",
        xml: "<a><b/></a>",
        pluralXml: "{value, plural, one {<a># </a>} other {<a># </a>}}",
        fragment: "<>A</> B",
        selectXml: "{value, select, male {<a># </a>} other {<a># </a>}}",
        nested:
          "<a>{value1, plural, one {{value2, select,left {one left} other {one right}}}other {{value2, select,right {one right} other {one left}}}}</a>",
      })
    ).toMatchInlineSnapshot(`
      Map {
        "simple" => Object {
          "message": "value",
        },
        "number" => Object {
          "message": "{value, number}",
        },
        "plural" => Object {
          "message": "{value, plural, one{# three} two {# test}}",
        },
        "select" => Object {
          "message": "{value, select, male {He} female {She} other {They}}",
        },
        "xml" => Object {
          "message": "<a><b/></a>",
        },
        "pluralXml" => Object {
          "message": "{value, plural, one {<a># </a>} other {<a># </a>}}",
        },
        "fragment" => Object {
          "message": "<>A</> B",
        },
        "selectXml" => Object {
          "message": "{value, select, male {<a># </a>} other {<a># </a>}}",
        },
        "nested" => Object {
          "message": "<a>{value1, plural, one {{value2, select,left {one left} other {one right}}}other {{value2, select,right {one right} other {one left}}}}</a>",
        },
      }
    `);
  });

  it("does not parse invalid ICU", () => {
    expect(() => parse({ key: "{invalidICU" })).toThrow(ParseError);
    try {
      parse({ key: "{invalidICU" });
    } catch (error) {
      expect(error.data).toMatchInlineSnapshot(`
        Object {
          "invalidICUFormat": Array [
            Object {
              "key": "key",
              "message": "{invalidICU",
            },
          ],
        }
      `);
    }
  });

  it("does not parse invalid XML", () => {
    expect(() => parse({ key: "<a>InvalidXML" })).toThrow(ParseError);
    try {
      parse({ key: "<a>InvalidXML" });
    } catch (error) {
      expect(error.data).toMatchInlineSnapshot(`
        Object {
          "invalidICUFormat": Array [
            Object {
              "key": "key",
              "message": "<a>InvalidXML",
            },
          ],
        }
      `);
    }
  });

  it("does not parse XML mixed in plural or select", () => {
    expect(() =>
      parse({ key: "<a>{value, plural, one {# </a>} other {# </a>}}" })
    ).toThrow(ParseError);
    try {
      parse({ key: "<a>{value, plural, one {# </a>} other {# </a>}}" });
    } catch (error) {
      expect(error.data).toMatchInlineSnapshot(`
        Object {
          "invalidICUFormat": Array [
            Object {
              "key": "key",
              "message": "<a>{value, plural, one {# </a>} other {# </a>}}",
            },
          ],
        }
      `);
    }
  });
});
