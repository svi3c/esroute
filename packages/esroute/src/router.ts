import { NavMeta, NavOpts, PathOrHref } from "./nav-opts";
import { resolve, Resolved } from "./route-resolver";
import { Resolve, Routes } from "./routes";

export type OnResolveListener<T> = (resolved: Resolved<T>) => void;
export interface Router<T = any> {
  go(opts: NavOpts): Promise<void>;
  go(pathOrHref: PathOrHref, opts?: NavMeta): Promise<void>;
  onResolve(listener: OnResolveListener<T>): () => void;
  init(): void;
  dispose(): void;
  resolution?: Promise<Resolved<T>>;
}

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

export const createRouter = <T = any>(
  routes: Routes<T> = {},
  {
    notFound = ({ go }) => go([]),
    noClick = false,
    defer = false,
    onResolve,
  }: RouterConf<T> = {}
): Router<T> => {
  let _resolved: Resolved<T>;
  const _listeners = new Set<OnResolveListener<T>>(
    onResolve ? [onResolve] : []
  );
  let resolution: Promise<Resolved<T>>;
  const router: Router<T> = {
    get resolution() {
      return resolution;
    },
    init() {
      window.addEventListener("popstate", popStateListener);
      if (!noClick) document.addEventListener("click", linkClickListener);
      popStateListener({ state: history.state });
    },
    dispose() {
      window.removeEventListener("popstate", popStateListener);
      document.removeEventListener("click", linkClickListener);
    },
    async go(target: PathOrHref | NavOpts, opts?: NavMeta): Promise<void> {
      // Serialize all navigaton requests
      await this.resolution;
      const navOpts =
        target instanceof NavOpts ? target : new NavOpts(target, opts);
      const res = await applyResolution(resolve(routes, navOpts, notFound));
      updateState(res.opts);
    },
    onResolve(listener: OnResolveListener<T>) {
      _listeners.add(listener);
      if (_resolved) listener(_resolved);
      return () => _listeners.delete(listener);
    },
  };

  const linkClickListener = (e: MouseEvent) => {
    const target = isAnchorElement(e.target)
      ? e.target
      : e.composedPath?.().find(isAnchorElement);
    if (target && target.origin === location.origin) {
      router.go(target.pathname, { replace: "replace" in target.dataset });
      e.preventDefault();
    }
  };

  const popStateListener = async ({ state }: { state: any }) => {
    const { pathname, search } = window.location;

    const initialOpts = new NavOpts(`${pathname}${search}`, { state: state });
    const { opts } = await applyResolution(
      resolve(routes, initialOpts, notFound)
    );

    if (!opts.eq(initialOpts)) {
      updateState(
        new NavOpts(opts.path, {
          replace: true,
          search: opts.search,
          state: opts.state,
        })
      );
    }
  };

  const applyResolution = async (res: Promise<Resolved<T>>) => {
    resolution = res;
    _resolved = await res;
    _listeners.forEach((l) => l(_resolved!));
    return res;
  };

  const updateState = ({ state, replace, href }: NavOpts) => {
    const history = window.history;
    if (replace) history.replaceState(state, "", href);
    else history.pushState(state, "", href);
  };

  if (!defer) router.init();

  return router;
};

const isAnchorElement = (
  target: EventTarget | null
): target is HTMLAnchorElement => target instanceof HTMLAnchorElement;
