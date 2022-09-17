import { defaultRouter, renderRoutes, Route } from "@esroute/lit";
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

const myRoutes: Route = {
  "": async () => {
    await import("./routes/root");
    return html`<esroute-root></esroute-root>`;
  },
  foo: async () => {
    await import("./routes/foo");
    return html`<esroute-foo></esroute-foo>`;
  },
  bar: async () => {
    await import("./routes/bar");
    return html`<esroute-bar></esroute-bar>`;
  },
  x: {
    y: {
      "*": {
        "*": async ({ params: [param1, param2] }) => {
          await import("./routes/foo");
          return html`<esroute-foo
            greeting=${`${param1} ${param2}`}
          ></esroute-foo>`;
        },
      },
    },
  },
};

const router = defaultRouter(
  {},
  {
    notFound: ({ href, go }) => {
      console.warn(`Route not found: '${href}' -> redirecting to '/'`);
      return go([]);
    },
  }
);

router.routes = myRoutes;

router.start();

@customElement("esroute-demo")
export class Demo extends LitElement {
  render() {
    return html`
      <h1>Esroute in lit demo</h1>
      <p>Routed content goes here:</p>
      <div>${renderRoutes(router)}</div>
    `;
  }
}
