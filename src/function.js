import IntlMessageFormat from "intl-messageformat";

let globalIntl = {
  messages: {},
  locale: "en",
};

export function translate(defaultMessage, options = {}, intl = globalIntl) {
  const { id = defaultMessage, values } = options;
  const { locale, messages } = intl;
  const message = messages[id] || defaultMessage;
  return new IntlMessageFormat(message, locale).format(values);
}

export function setLocale(newLocale, newMessages = {}) {
  globalIntl = { locale: newLocale, messages: newMessages };
}

export function formatDate(date, options, intl = globalIntl) {
  const { locale } = intl;
  return new global.Intl.DateTimeFormat(locale, options).format(date);
}
