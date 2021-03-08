import * as React from "react";

import { ErrorBoundary } from "react-error-boundary";
import { FormattedMessage, IntlProvider } from "react-intl";
import { setLocale } from "./function";
import { logError } from "./utils";

export function Translate({ defaultMessage, id = defaultMessage, values }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error }) => {
        logError(id, error);
        return null;
      }}
    >
      <FormattedMessage
        id={id}
        defaultMessage={defaultMessage}
        values={values}
      />
    </ErrorBoundary>
  );
}

export function Provider({ children, locale, messages, onError }) {
  setLocale(locale, messages, onError);
  return (
    <IntlProvider
      key={locale}
      locale={locale}
      defaultLocale="en"
      messages={messages}
      onError={onError}
    >
      {children}
    </IntlProvider>
  );
}
