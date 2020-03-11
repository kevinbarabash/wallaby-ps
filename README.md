# wallaby-ps

Example project trying to get PureScript and Wallaby working together.

## Instructions

```
yarn install
yarn watch
```

## Notes

Generated files will appear in output with one sub directory per module.
Each sub directory will include the following files:
- externs.json: dump of internal compiler state for module
- foreign.js: native JavaScript functions imported by index (optional)
- index.js: JavaScript code generated from PureScript code by purs compiler
- index.js.map: source map betwen PureScript module and index.js

TODO:
- [x] build files with source maps
- [ ] create post-processor for wallaby
