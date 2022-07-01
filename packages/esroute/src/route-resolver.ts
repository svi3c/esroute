import { NavOpts } from "./nav-opts";
import { Guard, Resolve, RouteSpec } from "./route-spec";

export interface Resolved<T> {
  value: T;
  opts: NavOpts;
}

export type RouteResolver<T> = (
  routes: RouteSpec<T>,
  opts: NavOpts,
  notFound: Resolve<T>
) => Promise<Resolved<T>>;

export const defaultRouteResolver =
  <T>(maxRedirects = 10): RouteResolver<T> =>
  async (
    routes: RouteSpec<T>,
    opts: NavOpts,
    notFound: Resolve<T>
  ): Promise<Resolved<T>> => {
    let value: NavOpts | T = opts;
    const navPath = new Array<NavOpts>();
    while (value instanceof NavOpts && navPath.length <= maxRedirects) {
      opts = value;
      const collision = navPath.find((o) => o.equals(opts));
      if (collision)
        throw new Error(
          `Detected redirect loop: ${[...navPath, collision].join(" -> ")}`
        );
      navPath.push(opts);
      const resolve = await getRouteResolve(routes, opts);
      value = await (resolve ?? notFound)(opts);
    }

    if (navPath.length > maxRedirects)
      throw new Error(`Exceeded max redirects: ${navPath.join(" -> ")}`);

    return { value: value as T, opts };
  };

const getRouteResolve = async <T>(
  routes: RouteSpec<T>,
  opts: NavOpts
): Promise<Resolve<T> | null> => {
  const route = await traverseRoutes(routes, opts);
  return (
    route &&
    (typeof route === "function" ? route : (route["/"] as Resolve<T>) ?? null)
  );
};

const traverseRoutes = async <T>(
  routes: RouteSpec<T>,
  opts: NavOpts
): Promise<RouteSpec<T> | null> => {
  let route: RouteSpec<T> = routes;
  for (const part of opts.path) {
    if (typeof route === "function") return null;
    const child: RouteSpec<T> | null = getRouteChild(route, opts, part);
    if (child === null) return null;
    const gr = await checkGuard(route, opts);
    if (gr) return gr;
    route = child;
  }
  if (typeof route === "function") return route;
  const gr = await checkGuard(route, opts);
  return gr || route;
};

const checkGuard = <T>(
  route: Exclude<RouteSpec<T>, Resolve<T>>,
  opts: NavOpts
): false | Promise<false | (() => NavOpts)> => {
  if (!("?" in route)) return false;
  return Promise.resolve((route["?"] as Guard)(opts)).then(
    (gr) => gr instanceof NavOpts && (() => gr)
  );
};

const getRouteChild = <T>(
  route: RouteSpec<T>,
  opts: NavOpts,
  part: string
): RouteSpec<T> | null => {
  if (part in route) return route[part as keyof RouteSpec<T>];
  else if ("*" in route) {
    opts.params.push(part);
    return route["*"];
  }
  return null;
};
