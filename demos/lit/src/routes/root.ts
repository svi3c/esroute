import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("esroute-root")
export class Root extends LitElement {
  render() {
    return html`
      <p>Index route</p>
      <a href="foo">foo</a>
      <a href="/x/y/John/Doe">Greeting</a>
    `;
  }
}
