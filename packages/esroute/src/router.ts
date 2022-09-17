import { NavMeta, NavOpts, PathOrHref } from "./nav-opts";
import { resolve, Resolved } from "./route-resolver";
import { Resolve, Routes } from "./routes";

export type OnResolveListener<T> = (resolved: Resolved<T>) => void;

export interface RouterConf<T = any> {
  /**
   * A fallback resolve funuction to use, if a route could not be found.
   * By default it redirects to the root path '/'.
   */
  notFound?: Resolve<T>;
  /**
   * Whether the click handler for anchor elements shall not be installed.
   * This might make sense, if you want to take more control over how anchor
   * clicks are handled.
   */
  noClick?: boolean;
  /**
   * Whether the router should delay initialization until `start()` is
   * called on the `Router` instance.
   */
  defer?: boolean;
  /**
   * A callback that is invoked whenever a route is resolved.
   */
  onResolve?: OnResolveListener<T>;
}

export class Router<T = any> {
  resolution!: Promise<Resolved<T>>;
  private _resolved?: Resolved<T>;
  private _notFound: Resolve<T>;
  private _noClick: boolean;
  private _listeners = new Set<OnResolveListener<T>>();

  constructor(
    public routes: Routes<T> = {},
    {
      notFound = ({ go }) => go([]),
      noClick = false,
      defer = false,
      onResolve,
    }: RouterConf<T> = {}
  ) {
    this._notFound = notFound;
    this._noClick = noClick;
    if (onResolve) this.onResolve(onResolve);
    if (!defer) this.init();
  }

  go(opts: NavOpts): Promise<void>;
  go(pathOrHref: PathOrHref, opts?: NavMeta): Promise<void>;
  async go(target: PathOrHref | NavOpts, opts?: NavMeta): Promise<void> {
    // Serialize all navigaton requests
    await this.resolution;
    const navigateOpts =
      target instanceof NavOpts ? target : new NavOpts(target, opts);
    const res = await this._applyResolution(this._resolve(navigateOpts));
    this._updateState(res.opts);
  }

  onResolve(listener: OnResolveListener<T>) {
    this._listeners.add(listener);
    if (this._resolved) listener(this._resolved);
    return () => this._listeners.delete(listener);
  }

  init() {
    window.addEventListener("popstate", this._popStateListener);
    if (!this._noClick)
      document.addEventListener("click", this._linkClickListener);
    this._popStateListener({ state: history.state });
  }

  dispose() {
    window.removeEventListener("popstate", this._popStateListener);
    document.removeEventListener("click", this._linkClickListener);
  }

  private _linkClickListener = (e: MouseEvent) => {
    const target = isAnchorElement(e.target)
      ? e.target
      : e.composedPath?.().find(isAnchorElement);
    if (target && target.origin === location.origin) {
      this.go(target.pathname, { replace: "replace" in target.dataset });
      e.preventDefault();
    }
  };

  private _popStateListener = async ({ state }: { state: any }) => {
    const { pathname, search } = window.location;

    const initialOpts = new NavOpts(`${pathname}${search}`, { state: state });
    const { opts } = await this._applyResolution(this._resolve(initialOpts));

    if (!opts.equals(initialOpts)) {
      this._updateState(
        new NavOpts(opts.path, {
          replace: true,
          search: opts.search,
          state: opts.state,
        })
      );
    }
  };

  private async _applyResolution(resolution: Promise<Resolved<T>>) {
    this.resolution = resolution;
    this._resolved = await resolution;
    this._listeners.forEach((l) => l(this._resolved!));
    return resolution;
  }

  private _updateState({ state, replace, href }: NavOpts) {
    const history = window.history;
    const updateState = history[replace ? "replaceState" : "pushState"];
    updateState.call(history, state, "", href);
  }

  private async _resolve(opts: NavOpts) {
    return resolve(this.routes, opts, this._notFound);
  }
}

const isAnchorElement = (
  target: EventTarget | null
): target is HTMLAnchorElement => target instanceof HTMLAnchorElement;
