import { Route } from "esroute";
import { load } from "./routing";

export const aRoutes: Route<string> = {
  "/": () => load("routes/foo.html"),
};
