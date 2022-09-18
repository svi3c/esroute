# @esroute/lit

An integration of [esroute](https://www.npmjs.com/package/esroute) into [lit](https://www.npmjs.com/package/lit)

This library provides a `renderRoutes()` directive to render the routes that are resolved by the router.

You can use the `createRouter()` factory to create the router instance.

## Example

```ts
import { createRouter, renderRoutes } from "@esroute/lit";
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

const router = createRouter({
  "": () =>
    import("./routes/root").then(() => html`<esroute-root></esroute-root>`),
  foo: {
    "*": ({ params: [name] }) =>
      import("./routes/foo").then(
        () => html`<my-greeter greeting=${name}></my-greeter>`
      ),
  },
});

@customElement("my-demo")
export class Demo extends LitElement {
  render() {
    return html`${renderRoutes(router)}`;
  }
}
```
