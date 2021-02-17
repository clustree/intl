import React from "react";

import { FormattedMessage, IntlProvider } from "react-intl";
import { setLocale } from "./function";

export function Translate({
  defaultMessage,
  id = defaultMessage,
  values,
  components,
}) {
  return (
    <FormattedMessage
      id={id}
      defaultMessage={defaultMessage}
      values={{ ...values, ...components }}
    />
  );
}

export function Provider({ children, locale, messages, ...props }) {
  setLocale(locale, messages);
  return (
    <IntlProvider
      key={locale}
      locale={locale}
      defaultLocale="en"
      messages={messages}
      {...props}
    >
      {children}
    </IntlProvider>
  );
}
