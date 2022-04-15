import { NavOpts } from "./nav-opts";

export type Resolve<T> = (
  navOpts: NavOpts
) => T | NavOpts | Promise<T | NavOpts>;

export type GuardResult = void | boolean | NavOpts;
export type Guard = (route: NavOpts) => GuardResult | Promise<GuardResult>;

export type RouteSpec<T, X extends {} = any> =
  | Resolve<T>
  | {
      [K in keyof X]: K extends "/"
        ? Resolve<T>
        : K extends "?"
        ? Guard
        : RouteSpec<T, X[K]>;
    };

export const routeBuilder =
  <T = any>() =>
  <X extends {} = any>(spec: RouteSpec<T, X>): RouteSpec<T> =>
    spec;

export const compileRoutes = <T, X extends {} = {}>(
  spec: RouteSpec<T, X>
): RouteSpec<T> => {
  if (typeof spec !== "object") return spec;
  const toSplit: Array<keyof X & string> = [];
  for (const key in spec) {
    if (key.length === 1 || !key.includes("/")) compileRoutes(spec[key]);
    else toSplit.push(key);
  }
  for (const key of toSplit) {
    const path = key.split("/");
    let last: string | undefined;
    while (!(last = path.pop()));
    let sub: any = spec;
    for (const p of path) {
      if (!p) continue;
      else if (p in sub && typeof sub[p] !== "object")
        sub = sub[p] = { "/": sub[p] };
      else if (!(p in sub)) sub = sub[p] = {};
      else sub = sub[p];
    }
    if (last in sub)
      if (typeof sub[last] === "object" && !("/" in sub[last]))
        sub[last] = { ...sub[last], "/": spec[key] };
      else throw new Error(`Route conflict. Cannot add: ${key} to ${spec}.`);
    else sub[last] = spec[key];
    compileRoutes(sub[last]);
    delete spec[key];
  }
  return spec;
};

export const verifyRoutes = <T, X extends {} = {}>(
  spec: RouteSpec<T, X>,
  _path: string[] = []
): RouteSpec<T> => {
  if (
    spec === null ||
    spec === undefined ||
    (typeof spec !== "object" && typeof spec !== "function")
  )
    throw new Error(
      `Found invalid route definition '/${_path.join("/")}': ${spec}`
    );
  if (typeof spec === "object")
    for (const key in spec) {
      if (key.length > 1 && key.includes("/"))
        throw new Error(
          `Route '${key}', found in /${_path.join("/")} is invalid.`
        );
      else verifyRoutes(spec[key]);
    }
  return spec;
};
