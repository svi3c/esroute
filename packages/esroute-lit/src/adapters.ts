import * as esroute from "esroute";

export { NavOpts } from "esroute";

export type Router = esroute.Router<any>;
export type Route = esroute.Route<any>;
export const createRouter =
  () => (routes: Route, conf: esroute.RouterConf<any>) =>
    new esroute.Router<any>(routes, conf);
export const defaultRouter: <X extends {} = any>(
  routeSpec: esroute.Route<any>,
  opts?: Partial<esroute.RouterConf<any>>
) => esroute.Router<any> = esroute.defaultRouter;
