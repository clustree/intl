import { createIntl, createIntlCache } from "react-intl";
import { logError } from "./utils";

const cache = createIntlCache();

let globalIntl = createIntl(
  {
    locale: "en",
    messages: {},
  },
  cache
);

export function translate(defaultMessage, options = {}, intl = globalIntl) {
  const { id = defaultMessage, values } = options;
  try {
    return intl.formatMessage({ id, defaultMessage }, values);
  } catch (error) {
    logError(id, error);
    return "";
  }
}

export function setLocale(newLocale, newMessages = {}, onError) {
  globalIntl = createIntl(
    { locale: newLocale, messages: newMessages, onError },
    cache
  );
}

export function formatDate(date, options, intl = globalIntl) {
  const { locale } = intl;
  return new global.Intl.DateTimeFormat(locale, options).format(date);
}
