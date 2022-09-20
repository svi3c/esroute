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

const getResolves = (
  root: Routes,
  { path, params }: NavOpts
): Resolve[] | null => {
  const resolves: Resolve[] = [];
  let routes: Routes | Resolve | null = root;
  for (let i = 0; i < path.length; i++) {
    const part = path[i];
    if (!routes || typeof routes === "function") return null;
    const virtual: Routes | Resolve | void = routes[""];
    if (typeof virtual === "function") resolves.unshift(virtual);
    if (part in routes) routes = routes[part];
    else if ("*" in routes) {
      params.push(part);
      routes = routes["*"];
    } else if (typeof virtual === "object") {
      routes = virtual;
      i--;
    }
  }
  do
    if (typeof routes === "function") {
      resolves.unshift(routes);
      return resolves;
    }
  while ((routes = routes[""]));
  return null;
};
