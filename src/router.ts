import { NavMeta, NavOpts, PathOrHref } from "./nav-opts";
import {
  defaultRouteResolver,
  Resolved,
  RouteResolver,
} from "./route-resolver";
import { compileRoutes, Resolve, RouteSpec, verifyRoutes } from "./route-spec";

export type OnResolveListener<T> = (resolved: Resolved<T>) => void;

export interface RouterConf<T> {
  /**
   * A fallback resolve funuction to use, if a route could not be found.
   * By default it redirects to the root path '/'.
   */
  notFound?: Resolve<T>;
  /**
   * Whether the click handler for anchor elements shall not be installed.
   * This might make sense, if you want to take more control over how anchor
   * clicks are handled.
   * By default we check whether the anchor element's origin property is equal
   * to the window.location.origin property. If so, the router will take over
   * navigation and event.preventDefault() is called.
   */
  noClick?: boolean;
  resolver: RouteResolver<T>;
}

export class Router<T> {
  resolution!: Promise<Resolved<T>>;
  private _resolved?: Resolved<T>;
  private _notFound: Resolve<T>;
  private _resolver: RouteResolver<T>;
  private _listeners = new Set<OnResolveListener<T>>();

  constructor(
    private routes: RouteSpec<T> = {},
    { notFound = ({ go }) => go([]), noClick = false, resolver }: RouterConf<T>
  ) {
    this._resolver = resolver;
    this._notFound = notFound;
    this._initListeners(noClick);
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
    window.removeEventListener("popstate", this._popStateListener);
    document.removeEventListener("click", this._linkClickListener);
  }

  private _initListeners(noClick: boolean) {
    window.addEventListener("popstate", this._popStateListener);
    if (!noClick) document.addEventListener("click", this._linkClickListener);
    this._popStateListener({ state: history.state });
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
    const history = window.history;
    const updateState = history[replace ? "replaceState" : "pushState"];
    updateState.call(history, state, "", href);
  }

  private async _resolve(opts: NavOpts) {
    return this._resolver(this.routes, opts, this._notFound);
  }
}

const isAnchorElement = (
  target: EventTarget | null
): target is HTMLAnchorElement => target instanceof HTMLAnchorElement;

export const defaultRouter = <T>(
  routeSpec: RouteSpec<T>,
  opts: Partial<RouterConf<T>> = {}
) =>
  new Router<T>(verifyRoutes(compileRoutes(routeSpec)), {
    resolver: defaultRouteResolver(),
    ...opts,
  });
