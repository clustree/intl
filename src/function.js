// @flow
import IntlMessageFormat from "intl-messageformat";

type Options = {
  id?: string,
  values?: { [key: string]: string }
};

let globalIntl = {
  messages: {},
  locale: "en"
};

type tIntl = {
  messages: {},
  locale: string
};

export function translate(
  defaultMessage: string,
  options?: Options = {},
  intl?: tIntl = globalIntl
): string {
  const { id = defaultMessage, values } = options;
  const { locale, messages } = intl;
  const message = messages[id] || defaultMessage;
  return new IntlMessageFormat(message, locale).format(values);
}

type Locale = "en" | "fr";

type Messages = {};

export function setLocale(newLocale: Locale, newMessages?: Messages = {}) {
  globalIntl = { locale: newLocale, messages: newMessages };
}

type FormatDateOptions = {};

type FDIntl = {
  locale: string,
  messages?: Messages
};

export function formatDate(
  date: Date,
  options: FormatDateOptions,
  intl?: FDIntl = globalIntl
) {
  const { locale } = intl;
  return new global.Intl.DateTimeFormat(locale, options).format(date);
}
