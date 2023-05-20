# `eslint-config-custom`

This is the base `.eslintrc.js`s from which all other packages can extend.

## Getting started

We first need to add `eslint-config-custom` as a dependency.

```json
// apps/electron-app/package.json

{
  ...
  "dependencies": {
    ...
    "eslint-config-custom": "*"
  }
}
```

We can then import the config like this:

```js
// apps/electron-app/.eslintrc.js

module.exports = {
  root: true,
  extends: ["custom"],
};
```

By adding `custom` to our `extends` array, we're telling ESLint to look for a package called `eslint-config-custom` - and it finds our workspace.
