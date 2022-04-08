import { NavOpts } from "./nav-opts";
import { Guard, Resolve, RouteSpec } from "./route-spec";

export interface Resolved<T> {
  value: T;
  opts: NavOpts;
}

export class RouteResolver {
  constructor(private maxRedirects = 10) {}

  async resolve<T>(
    routes: RouteSpec<T>,
    opts: NavOpts,
    notFound: Resolve<T>
  ): Promise<Resolved<T>> {
    let value: NavOpts | T = opts;
    const navPath = new Array<NavOpts>();
    while (value instanceof NavOpts && navPath.length <= this.maxRedirects) {
      opts = value;
      const collision = navPath.find((o) => o.equals(opts));
      if (collision)
        throw new Error(
          `Detected redirect loop: ${[...navPath, collision].join(" -> ")}`
        );
      navPath.push(opts);
      const resolve = await this._getRouteResolve(routes, opts);
      value = await (resolve ?? notFound)(opts);
    }

    if (navPath.length > this.maxRedirects)
      throw new Error(`Exceeded max redirects: ${navPath.join(" -> ")}`);

    return { value: value as T, opts };
  }

  private async _getRouteResolve<T>(
    routes: RouteSpec<T>,
    opts: NavOpts
  ): Promise<Resolve<T> | null> {
    const route = await this._traverseRoutes(routes, opts);
    return (
      route &&
      (typeof route === "function" ? route : (route["/"] as Resolve<T>) ?? null)
    );
  }

  private async _traverseRoutes<T>(
    routes: RouteSpec<T>,
    opts: NavOpts
  ): Promise<RouteSpec<T> | null> {
    let route: RouteSpec<T> | null = routes;
    for (const part of opts.path) {
      if (route === null || typeof route === "function") return null;
      const child: RouteSpec<T> | null = this._getRouteChild(route, opts, part);
      const guardResult = await (route["?"] as Guard)?.(opts);
      if (guardResult) return () => guardResult;
      route = child;
    }
    return route;
  }

  private _getRouteChild<T>(
    route: RouteSpec<T>,
    opts: NavOpts,
    part: string
  ): RouteSpec<T> | null {
    if (part in route) return route[part as keyof RouteSpec<T>];
    else if ("*" in route) {
      opts.params.push(part);
      return route["*"];
    }
    return null;
  }
}
