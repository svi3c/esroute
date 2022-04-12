import { NavOpts } from "./nav-opts";

export type Resolve<T> = (
  navOpts: NavOpts
) => T | NavOpts | Promise<T | NavOpts>;

export type GuardResult = void | false | NavOpts;
export type Guard = (route: NavOpts) => GuardResult | Promise<GuardResult>;

export type RouteSpec<T> =
  | {
      [K in string]: K extends "/"
        ? Resolve<T>
        : K extends "?"
        ? Guard
        : RouteSpec<T>;
    }
  | Resolve<T>;

export const compileRoutes = <T>(spec: RouteSpec<T>): RouteSpec<T> => {
  if (typeof spec !== "object") return spec;
  const toSplit: string[] = [];
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

export const verifyRoutes = (spec: RouteSpec<any>, _path: string[] = []) => {
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
