# @esroute/lit

Adapts the [esroute](https://www.npmjs.com/package/esroute) library to work seamlessly with lit.

This library provides a `renderRoutes()` directive to render the routes that are resolved by the router.

You can use the `createRouter()` or `defaultRouter()` factory to create the router instance.

## Example

```ts
import { defaultRouter, renderRoutes } from "@esroute/lit";
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

const router = defaultRouter({
  "/": () =>
    import("./routes/root").then(() => html`<esroute-root></esroute-root>`),
  "foo/*": ({ params: [name] }) =>
    import("./routes/foo").then(
      () => html`<esroute-foo greeting=${name}></esroute-foo>`
    ),
});

@customElement("esroute-demo")
export class Demo extends LitElement {
  render() {
    return html`${renderRoutes(router)}`;
  }
}
```
