import { createRoutes, load } from "./routing";

export const aRoutes = createRoutes({
  "/": () => load("routes/foo.html"),
});
