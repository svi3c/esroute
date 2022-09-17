import { Router } from "esroute";
import { noChange } from "lit";
import { AsyncDirective, directive } from "lit/async-directive.js";
import { DirectiveResult } from "lit/directive.js";

class RenderRoutesDirective extends AsyncDirective {
  private _r?: Router;
  private _u?: () => void;

  override render(router: Router) {
    if (this._r === router) return noChange;
    this._u?.();
    this._r = router;
    if (this.isConnected) this._subscribe();
  }

  override disconnected() {
    this._u!();
  }

  override reconnected() {
    this._subscribe();
  }

  private _subscribe() {
    this._u = this._r!.onResolve(({ value }) => this.setValue(value));
  }
}

export const renderRoutes: (
  router: Router
) => DirectiveResult<typeof RenderRoutesDirective> = directive(
  RenderRoutesDirective
);
