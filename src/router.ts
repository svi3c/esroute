import { NavMeta, NavOpts, PathOrHref } from "./nav-opts";
import { Resolve, Resolved, RouteResolver, RouteSpec } from "./route-resolver";

export type OnResolveListener<T> = (resolved: Resolved<T>) => void;

export class Router<T> {
  resolution!: Promise<Resolved<T>>;
  private _resolved?: Resolved<T>;
  private _window: Window;
  private _notFound: Resolve<T>;
  private _resolver = new RouteResolver();
  private _listeners = new Set<OnResolveListener<T>>();

  constructor(
    private routes: RouteSpec<T> = {},
    {
      window: win = window,
      notFound = ({ go }) => go("/"),
      resolver = new RouteResolver(),
    }: {
      notFound?: Resolve<T>;
      window?: Window;
      resolver?: RouteResolver;
    } = {}
  ) {
    this._window = win;
    this._notFound = notFound;
    this._resolver = resolver;
    this._initListeners();
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

  dispose() {
    this._window.removeEventListener("popstate", this._popStateListener);
    this._window.document.removeEventListener("click", this._linkClickListener);
  }

  private _initListeners() {
    this._window.addEventListener("popstate", this._popStateListener);
    this._window.document.addEventListener("click", this._linkClickListener);
    this._popStateListener({ state: this._window.history.state });
  }

  private _linkClickListener = (e: MouseEvent) => {
    const target = isAnchorElement(e.target)
      ? e.target
      : e.composedPath?.().find(isAnchorElement);
    if (target && target.origin === this._window.origin) {
      this.go(target.pathname, { replace: "replace" in target.dataset });
      e.preventDefault();
    }
  };

  private _popStateListener = async ({ state }: { state: any }) => {
    const { pathname, search } = this._window.location;
    const initialOpts = new NavOpts(`${pathname}${search}`, { state: state });
    const { opts } = await this._applyResolution(this._resolve(initialOpts));

    if (opts !== initialOpts) {
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
    const history = this._window.history;
    const updateState = history[replace ? "replaceState" : "pushState"];
    updateState.call(history, state, "", href);
  }

  private async _resolve(opts: NavOpts) {
    return this._resolver.resolve(this.routes, opts, this._notFound);
  }
}

const isAnchorElement = (
  target: EventTarget | null
): target is HTMLAnchorElement => target instanceof HTMLAnchorElement;
