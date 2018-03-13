/* eslint-env jest */
import React from "react";
import renderer from "react-test-renderer";
import { Provider, translate, Translate } from "../macro";

const smallStrong = {
  small: <small />,
  strong: <strong />
};

function checkSnapshot(elt, { locale = "en", messages } = {}) {
  expect(
    renderer
      .create(
        <Provider locale={locale} messages={messages} defaultLocale="en">
          {elt}
        </Provider>
      )
      .toJSON()
  ).toMatchSnapshot();
}

describe("Translate", () => {
  it("Translates with JSX in values", () => {
    checkSnapshot(
      <Translate
        defaultMessage={`{nb, plural,
          one {<strong>singular</strong><small>jsx</small>}
          other {<strong>plural</strong><small>jsx</small>}
        }`}
        values={{ nb: 5 }}
        components={smallStrong}
      />
    );

    checkSnapshot(
      <Translate>
        <strong>bold</strong>
        <small>tiny</small>
      </Translate>
    );

    checkSnapshot(
      <Translate>
        <strong>bold</strong>
        <small>tiny</small>
      </Translate>,
      {
        locale: "fr",
        messages: {
          "<strong>bold</strong><small>tiny</small>":
            "<small>Tres petit</small><strong>gras</strong>"
        }
      }
    );
  });
});

describe("Translate", () => {
  it("Escapes JSX in values", () => {
    const strong = "<strong/>";
    checkSnapshot(<Translate components={smallStrong}>bob {strong}</Translate>);
    const details = "<details/>";
    checkSnapshot(
      <Translate components={smallStrong}>bob {details}</Translate>
    );

    checkSnapshot(<Translate components={smallStrong}>bob</Translate>);

    checkSnapshot(
      <Translate
        values={{ jsx: <strong /> }}
        defaultMessage="{jsx} in string"
      />
    );
  });
});

describe("translate", () => {
  it("gives the correct result", () => {
    expect(
      translate("test {value}", {
        values: { value: 4 }
      })
    ).toEqual("test 4");
  });
});
