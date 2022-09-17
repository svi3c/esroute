import { NavOpts } from "./nav-opts";
import { Resolve, Routes } from "./routes";

export interface Resolved<T> {
  value: T;
  opts: NavOpts;
}

export type RouteResolver<T> = (
  routes: Routes<T>,
  opts: NavOpts,
  notFound: Resolve<T>
) => Promise<Resolved<T>>;

const MAX_REDIRECTS = 10;

export const resolve = async <T>(
  routes: Routes<T>,
  opts: NavOpts,
  notFound: Resolve<T>
): Promise<Resolved<T>> => {
  let value: NavOpts | T = opts;
  const navPath = new Array<NavOpts>();
  while (value instanceof NavOpts && navPath.length <= MAX_REDIRECTS) {
    opts = value;
    const collision = navPath.find((o) => o.equals(opts));
    if (collision)
      throw new Error(
        `Detected redirect loop: ${[...navPath, collision].join(" -> ")}`
      );
    navPath.push(opts);
    const resolves = getRouteResolves(routes, opts) ?? [notFound];
    for (const resolve of resolves) {
      value = await resolve(opts, value instanceof NavOpts ? undefined : value);
      if (value instanceof NavOpts) break;
    }
  }

  if (navPath.length > MAX_REDIRECTS)
    throw new Error(`Exceeded max redirects: ${navPath.join(" -> ")}`);

  return { value: value as T, opts };
};

const getRouteResolves = <T>(
  routes: Routes<T>,
  opts: NavOpts
): Resolve<T>[] | null => {
  const resolves: Resolve<T>[] = [];
  let route: Routes<T> | Resolve<T> = routes;
  for (const part of opts.path) {
    if (typeof route === "function") return null;
    if ("" in route) resolves.unshift(route[""] as Resolve<T>);
    const child: Routes<T> | Resolve<T> | null = getRouteChild(
      route,
      opts,
      part
    );
    if (child === null) return null;
    route = child;
  }
  if (typeof route === "function") resolves.unshift(route);
  else if ("" in route) resolves.unshift(route[""] as Resolve<T>);
  else return null;
  return resolves;
};

const getRouteChild = <T>(
  route: Routes<T>,
  opts: NavOpts,
  part: string
): Routes<T> | Resolve<T> | null => {
  if (part in route) return route[part];
  else if ("*" in route) {
    opts.params.push(part);
    return route["*"];
  }
  return null;
};
