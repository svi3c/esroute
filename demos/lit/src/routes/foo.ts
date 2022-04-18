import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("esroute-foo")
export class Foo extends LitElement {
  @property() greeting = "";
  render() {
    return html`
      <p>/foo</p>
      ${this.greeting && html`<p>Hello <b>${this.greeting}</b></p>`}
      <a href="/bar" data-replace>bar</a>
    `;
  }
}
