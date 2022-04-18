import { noChange } from "lit";
import { AsyncDirective, directive } from "lit/async-directive.js";
import { PartInfo, PartType } from "lit/directive.js";
import { Router } from "./adapters";

class RenderRoutesDirective extends AsyncDirective {
  private _router?: Router;
  private _unsubscribe?: () => void;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.CHILD)
      throw new Error(
        "The `renderRoutes` directive must be used as a child directive."
      );
  }

  override render(router: Router) {
    if (this._router === router) return noChange;
    this._unsubscribe?.();
    this._router = router;
    if (this.isConnected) this._subscribe();
  }

  override disconnected() {
    this._unsubscribe!();
  }

  override reconnected() {
    this._subscribe();
  }

  private _subscribe() {
    this._unsubscribe = this._router!.onResolve(({ value }) =>
      this.setValue(value)
    );
  }
}

export const renderRoutes = directive(RenderRoutesDirective);
