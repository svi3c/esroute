import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("esroute-bar")
export class Bar extends LitElement {
  render() {
    return html`
      <p>/bar</p>
      <a href="/not-found">not-found</a>
    `;
  }
}
