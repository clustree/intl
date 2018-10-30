/* eslint-env jest */

const { transform } = require("babel-core");

const code = `
import {Translate} from '../macro';

const a = (bob) => <Translate id={bob} defaultMessage={bob} allowDynamic />;
`;

it("WERKS", () => {
  expect(transform(code, { filename: __filename }).code).toMatchInlineSnapshot(`
"\\"use strict\\";

var _intl = require(\\"@clustree/intl\\");

var a = function a(bob) {
  return React.createElement(_intl.Translate, {
    id: bob,
    defaultMessage: bob,
    allowDynamic: true
  });
};"
`);
});
