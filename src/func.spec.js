/* eslint-env jest */
import { setLocale, translate } from "../macro";

describe("translate", () => {
  it("gives the correct result", () => {
    expect(
      translate("test {value}", {
        values: { value: 4 }
      })
    ).toEqual("test 4");
  });

  it("works with an empty setLocale", () => {
    setLocale("fr");
    expect(
      translate("test {value}", {
        values: { value: 4 }
      })
    ).toEqual("test 4");
  });

  it("works with an full setLocale", () => {
    setLocale("fr", {
      "test {value}": "{value} de test",
      test2: "deuxieme test"
    });
    expect(
      translate("test {value}", {
        values: { value: 4 }
      })
    ).toEqual("4 de test");
    expect(translate("test2")).toEqual("deuxieme test");
  });

  it("works with an id", () => {
    setLocale("fr", { "id.4": "{value} de test" });
    expect(
      translate("test {value}", {
        values: { value: 4 },
        id: "id.4"
      })
    ).toEqual("4 de test");
  });
});
