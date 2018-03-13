// @flow
import React, { Fragment } from "react";

import { FormattedMessage, IntlProvider } from "react-intl";
import { setLocale } from "./function";
import { parse } from "./parse";

type TProps = {
  defaultMessage?: string,
  id?: string,
  values?: {},
  components?: {}
};

type LocalComponents = {};

// Matches (Before)<(Tagname)>(contents)</Tagname>(After)
// use \s\S for any char .* doesn't match \n
const regex = /^([^<]*?)<([A-Za-z0-9-:]+)>([\s\S]*?)<\/\2>([\s\S]*)$/;
const regexAutoClose = /^([^<]*?)<([A-Za-z0-9-:]+) ?\/>([\s\S]*)$/;

export class Translate extends React.Component<TProps> {
  parse(values: *, localComponents: LocalComponents) {
    return (
      <Fragment>
        {values.map((element, i) => {
          if (element.type === "string") {
            return <Fragment key={i}>{element.value}</Fragment>;
          }
          if (element.type === "jsx") {
            return React.cloneElement(
              localComponents[element.id],
              { key: i },
              this.parse(element.values, localComponents)
            );
          }
          if (element.type === "jsx-autoclose") {
            return <Fragment key={i}>{localComponents[element.id]}</Fragment>;
          }
          return null;
        })}
      </Fragment>
    );
  }

  renderMessages(messages: Array<*>, innerValues: Object) {
    const { components } = this.props;
    const localComponents = { ...components };
    let jsxElement = 0;
    const message = messages
      .map(token => {
        if (typeof token === "string") {
          return token;
        } else {
          const key = `JSXElement:${jsxElement++}`;
          localComponents[key] = token;
          return `<${key} />`;
        }
      })
      .join("");
    for (const [key, value] of Object.entries(innerValues)) {
      localComponents[`JSXValue:${key}`] = value;
    }
    const values = parse(message);
    return this.parse(values, localComponents);
  }

  render() {
    const { defaultMessage, id = defaultMessage, values } = this.props;

    const cleanValues = {};
    const innerValues = {};
    if (values != null) {
      for (const [key, value] of Object.entries(values)) {
        if (
          typeof value === "string" &&
          (regex.test(value) || regexAutoClose.test(value))
        ) {
          cleanValues[key] = `<JSXValue:${key} />`;
          innerValues[key] = value;
        } else {
          cleanValues[key] = value;
        }
      }
    }

    // console.log({ defaultMessage, id, cleanValues });

    try {
      return (
        <FormattedMessage {...{ id, defaultMessage, values: cleanValues }}>
          {(...messages) => this.renderMessages(messages, innerValues)}
        </FormattedMessage>
      );
    } catch (error) {
      return null;
    }
  }
}

export class Provider extends React.Component<*> {
  render() {
    const { children, locale, messages } = this.props;
    setLocale(locale, messages);
    return (
      <IntlProvider
        key={locale}
        locale={locale}
        defaultLocale="en"
        messages={messages}
      >
        {children}
      </IntlProvider>
    );
  }
}
