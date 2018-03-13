// @flow
import IntlMessageFormat from "intl-messageformat";

type Options = {
  id?: string,
  values?: { [key: string]: string }
};

let messages = {};
let locale = "en";

export function translate(
  defaultMessage: string,
  options?: Options = {}
): string {
  const { id = defaultMessage, values } = options;
  const message = messages[id] || id;
  return new IntlMessageFormat(message, locale).format(values);
}

type Locale = "en" | "fr";

type Messages = {};

export function setLocale(newLocale: Locale, newMessages?: Messages = {}) {
  messages = newMessages;
  locale = newLocale;
}
