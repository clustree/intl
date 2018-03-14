# `@clustree/intl`
Translation utilities for React and Javascript.

This repo wraps [FormatJS](https://formatjs.io) and [React Intl](https://github.com/yahoo/react-intl) primitives

## Installing
`yarn add @clustree/intl` or `npm add @clustree/intl`
You'll also need `babel-plugin-macros` to use the macro.

## Using `@clustree/intl`

### With react
This project exports `Translate` and `Provider` components.

> import { Provider, Translate } from '@clustree/intl';

Provider has the same API as Provider from 'react-intl' but it leverages setLocale to make translate work as well.

Translate has the same API as `FormattedMessage` from 'react-intl', but it handles inline React Components.

```js
<Translate defaultMessage="<Link>HomePage</Link>" components={{Link: <Link to="/">}} />
```

### With plain javascript
In plain javascript, we use the `setLocale` and `translate` helper functions.

> setLocale(locale, messages)

> translate(defaultMessage, { id?, values })

### Advanced Usage
A babel macro https://github.com/kentcdodds/babel-plugin-macros allows us to extract messages for translation and allows us to have a more explicit api for `Translate`.

Thus we can write:
```js
<Translate><Link to="/">HomePage</Link></Translate>
```
which is equivalent to the Definition above


## Caveats
Changing locales will unmount the subtree beneath `Provider`. This allows us to use `translate` in components without worrying about locale updates in deep subtrees.