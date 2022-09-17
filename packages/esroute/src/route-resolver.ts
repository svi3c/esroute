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
    navPath.push(opts);
    const resolves = getResolves(routes, opts) ?? [notFound];
    for (const resolve of resolves) {
      value = await resolve(opts, value instanceof NavOpts ? undefined : value);
      if (value instanceof NavOpts) break;
    }
  }

  if (navPath.length > MAX_REDIRECTS)
    throw new Error(
      `More than ${MAX_REDIRECTS} redirects: ${navPath
        .map((n) => n.href)
        .join(" -> ")}`
    );

  return { value: value as T, opts };
};

const getResolves = (root: Routes, opts: NavOpts): Resolve[] | null => {
  const resolves: Resolve[] = [];
  let routes: Routes | Resolve | null = root;
  for (const part of opts.path) {
    if (!routes) return null;
    if (typeof routes === "function") return null;
    routes = getChildren(routes, opts, part, resolves);
  }
  if (typeof routes === "function") {
    resolves.unshift(routes);
    return resolves;
  }
  if (routes && typeof routes[""] === "function") {
    resolves.unshift(routes[""]);
    return resolves;
  }
  return null;
};

const getChildren = (
  routes: Routes,
  opts: NavOpts,
  part: string,
  resolves: Resolve[]
): Routes | Resolve | null => {
  if (part in routes) {
    if (typeof routes[""] === "function")
      resolves.unshift(routes[""] as Resolve);
    return routes[part];
  }
  if ("*" in routes) {
    opts.params.push(part);
    return routes["*"];
  }
  const virtual = routes[""];
  if (!virtual || typeof virtual === "function") return null;
  return getChildren(virtual, opts, part, resolves);
};
