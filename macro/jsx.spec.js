/* eslint-env jest */

const { transform } = require("@babel/core");

const codeJSX = `
import {Translate} from '../macro';

const a = (bob) => <Translate id={bob} defaultMessage={bob} allowDynamic />;
`;

it("WERKS", () => {
  expect(transform(codeJSX, { filename: __filename }).code)
    .toMatchInlineSnapshot(`
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

const codeFunction = `
import {translate} from '../macro';

const a = (bob) => translate(bob[0].name, {id: \`dynamic.\${bob}.value\`, allowDynamic: true});
const b = translate('bla');
`;

it("WERKS 2", () => {
  expect(transform(codeFunction, { filename: __filename }).code)
    .toMatchInlineSnapshot(`
"\\"use strict\\";

var _intl = require(\\"@clustree/intl\\");

var a = function a(bob) {
  return (0, _intl.translate)(bob[0].name, {
    id: \\"dynamic.\\".concat(bob, \\".value\\"),
    allowDynamic: true
  });
};

var b = (0, _intl.translate)('bla');"
`);
});
