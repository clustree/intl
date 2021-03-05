/* eslint-env jest */
import React from "react";
import renderer from "react-test-renderer";
import { Provider, translate, Translate } from "../macro";

const smallStrong = {
  small: (chunk) => <small>{chunk}</small>,
  strong: (chunk) => <strong>{chunk}</strong>,
};

function buildSnapshot(elt, { locale = "en", messages, onError } = {}) {
  return renderer
    .create(
      <>
        <Provider
          locale={locale}
          messages={messages}
          defaultLocale="en"
          onError={onError}
        >
          {elt}
        </Provider>
      </>
    )
    .toJSON();
}

describe("Translate", () => {
  it("Translates with JSX in values", () => {
    expect(
      buildSnapshot(
        <Translate
          defaultMessage={`{nb, plural,
          one {<strong>singular</strong><small>jsx</small>}
          other {<strong>plural</strong><small>jsx</small>}
        }`}
          values={{ nb: 5, ...smallStrong }}
        />
      )
    ).toMatchInlineSnapshot(`
      Array [
        <strong>
          plural
        </strong>,
        <small>
          jsx
        </small>,
      ]
    `);

    expect(
      buildSnapshot(
        <Translate>
          <strong>bold</strong>
          <small>tiny</small>
        </Translate>
      )
    ).toMatchInlineSnapshot(`
      Array [
        <strong>
          bold
        </strong>,
        <small>
          tiny
        </small>,
      ]
    `);

    expect(
      buildSnapshot(
        <Translate>
          <strong>bold</strong>
          <small>tiny</small>
        </Translate>,
        {
          locale: "fr",
          messages: {
            "<strong>bold</strong><small>tiny</small>":
              "<small>Tres petit</small><strong>gras</strong>",
          },
        }
      )
    ).toMatchInlineSnapshot(`
      Array [
        <small>
          Tres petit
        </small>,
        <strong>
          gras
        </strong>,
      ]
    `);

    expect(
      buildSnapshot(
        <>
          <Translate>
            a <br /> newline
          </Translate>
        </>,
        {
          locale: "fr",
          messages: {
            "a <br></br> newline": "un <br></br> retour a la ligne",
          },
          onError: console.error,
        }
      )
    ).toMatchInlineSnapshot(`
      Array [
        "un ",
        <br />,
        " retour a la ligne",
      ]
    `);
  });
});

describe("Translate", () => {
  it("Escapes JSX in values", () => {
    const strong = "<strong/>";
    expect(
      buildSnapshot(
        <Translate components={smallStrong}>bob {strong}</Translate>
      )
    ).toMatchInlineSnapshot(`"bob "`);
    const details = "<details/>";
    expect(
      buildSnapshot(
        <Translate components={smallStrong}>bob {details}</Translate>
      )
    ).toMatchInlineSnapshot(`"bob <details/>"`);

    expect(
      buildSnapshot(<Translate components={smallStrong}>bob</Translate>)
    ).toMatchInlineSnapshot(`"bob"`);

    expect(
      buildSnapshot(
        <Translate
          values={{ jsx: <strong /> }}
          defaultMessage="{jsx} in string"
        />
      )
    ).toMatchInlineSnapshot(`
      Array [
        <strong />,
        " in string",
      ]
    `);
  });
});

describe("Translate Error", () => {
  it.each([["<a></b>"], ["<a>"], ["</a>"], ["{a}}"]])(
    "renders defaultMessage `%s` on Error",
    (defaultMessage) => {
      const onError = jest.fn();
      expect(
        buildSnapshot(
          <Translate defaultMessage={defaultMessage} allowDynamic />,
          {
            onError,
          }
        )
      ).toBe(defaultMessage);
      expect(onError).toHaveBeenCalled();
      onError.mockClear();
    }
  );
});

describe("translate", () => {
  it("gives the correct result", () => {
    expect(
      translate("test {value}", {
        values: { value: 4 },
      })
    ).toEqual("test 4");
  });
});

describe("Dynamic translations", () => {
  it("Translates with dynamic key", () => {
    const name1 = "custom1";
    const name2 = "custom2";
    expect(
      buildSnapshot(
        <>
          <Translate defaultMessage={name1} id={`dynamic.${name1}`} />
          <Translate defaultMessage={name2} id={`dynamic.${name2}`} />
        </>,
        {
          locale: "fr",
          messages: {
            "dynamic.custom1": "custom1 name",
            "dynamic.custom2": "custom2 name",
          },
        }
      )
    ).toMatchInlineSnapshot(`
      Array [
        "custom1 name",
        "custom2 name",
      ]
    `);
  });
});
