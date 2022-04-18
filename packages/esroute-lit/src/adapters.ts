import * as esroute from "esroute";

export type Router = esroute.Router<any, any>;
export type RouteSpec<X extends {} = any> = esroute.RouteSpec<any, X>;
export const createRouter =
  <X extends {} = any>() =>
  (routes: RouteSpec<X>, conf: esroute.RouterConf<any>) =>
    new esroute.Router<any>(routes, conf);
export const createRoutes: <X extends {} = any>(
  routes: RouteSpec<X>
) => RouteSpec<any> = esroute.routeBuilder<any>();
export const defaultRouter: <X extends {} = any>(
  routeSpec: esroute.RouteSpec<any, X>,
  opts?: Partial<esroute.RouterConf<any>>
) => esroute.Router<any> = esroute.defaultRouter;
export const compileRoutes = esroute.compileRoutes as <X extends {} = any>(
  spec: RouteSpec<X>
) => RouteSpec<any>;
export const verifyRoutes = esroute.verifyRoutes as <X extends {} = any>(
  spec: RouteSpec<X>
) => RouteSpec<any>;
