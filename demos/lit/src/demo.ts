import { createRoutes, defaultRouter, Guard, renderRoutes } from "@esroute/lit";
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

const g: Guard = () => undefined;

const myRoutes = createRoutes({
  "/": async () => {
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
  "/x/y/*/*": async ({ params: [param1, param2] }) => {
    await import("./routes/foo");
    return html`<esroute-foo greeting=${`${param1} ${param2}`}></esroute-foo>`;
  },
  "?": g,
});

const router = defaultRouter(myRoutes, {
  notFound: ({ href, go }) => {
    console.warn(`Route not found: '${href}' -> redirecting to '/'`);
    return go([]);
  },
});

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
