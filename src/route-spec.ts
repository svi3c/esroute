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

export const compileRoutes = (spec: RouteSpec<any>): void => {
  if (typeof spec !== "object") return;
  const toSplit: string[] = [];
  for (const key in spec) {
    if (key.length === 1 || key.indexOf("/") < 0) compileRoutes(spec[key]);
    else toSplit.push(key);
  }
  for (const key of toSplit) {
    const path = key.split("/");
    let last: string | undefined;
    while (!(last = path.pop()));
    let sub: any = spec;
    for (const p of path) {
      if (!p) continue;
      else if (typeof sub[p] !== "object") sub = sub[p] = { "/": sub[p] };
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
};
