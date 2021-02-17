/* eslint-env jest */

const { transform } = require("@babel/core");

expect.addSnapshotSerializer({
  serialize(val) {
    return val;
  },

  test(val) {
    return typeof val === "string" && val.indexOf("\n") !== -1;
  },
});

const BABEL_OPTIONS = {
  babelrc: false,
  plugins: ["@babel/plugin-syntax-jsx", "babel-plugin-macros"],
  presets: [],
  filename: __filename,
};

describe("Translate", () => {
  it("compiles with allowDynamic", () => {
    expect(
      transform(
        `
        import {Translate} from '../macro';
        
        const a = (bob) => <Translate id={bob} defaultMessage={bob} allowDynamic />;
        `,
        BABEL_OPTIONS
      ).code
    ).toMatchInlineSnapshot(`
      import { Translate } from '@clustree/intl';

      const a = bob => <Translate id={bob} defaultMessage={bob} allowDynamic />;
    `);
  });

  it("compiles with nested JSX", () => {
    expect(
      transform(
        `
          import {Translate} from '../macro';
          const a = (bob) => <Translate id="str"><Fragment><p><a href=""/></p><p></p></Fragment></Translate>;
          `,
        BABEL_OPTIONS
      ).code
    ).toMatchInlineSnapshot(`
      import { Translate } from '@clustree/intl';

      const a = bob => <Translate id="str" defaultMessage="<Fragment><p><a/></p><p-1></p-1></Fragment>" values={{
        a: chunks => <a href="" />,
        p: chunks => <p>{chunks}</p>,
        "p-1": chunks => <p>{chunks}</p>,
        Fragment: chunks => <Fragment>{chunks}</Fragment>
      }} />;
    `);
  });

  it("compiles with fragment shorthand", () => {
    expect(
      transform(
        `
          import {Translate} from '../macro';
          const a = (bob) => <Translate id="str"><><p><a href=""/></p><p></p></></Translate>;
          `,
        BABEL_OPTIONS
      ).code
    ).toMatchInlineSnapshot(`
      import { Translate } from '@clustree/intl';

      const a = bob => <Translate id="str" defaultMessage="<Fragment><p><a/></p><p-1></p-1></Fragment>" values={{
        a: chunks => <a href="" />,
        p: chunks => <p>{chunks}</p>,
        "p-1": chunks => <p>{chunks}</p>,
        Fragment: chunks => <>{chunks}</>
      }} />;
    `);
  });
});

describe("translate", () => {
  it("compiles with allowDynamic", () => {
    expect(
      transform(
        `
import {translate} from '../macro';

const a = (bob) => translate(bob[0].name, {id: \`dynamic.\${bob}.value\`, allowDynamic: true});
const b = translate('bla');
    `,
        BABEL_OPTIONS
      ).code
    ).toMatchInlineSnapshot(`
      import { translate } from '@clustree/intl';

      const a = bob => translate(bob[0].name, {
        id: \`dynamic.\${bob}.value\`,
        allowDynamic: true
      });

      const b = translate('bla');
    `);
  });
});
