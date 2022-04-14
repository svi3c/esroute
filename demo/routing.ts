import { routeBuilder } from "../src";

export const createRoutes = routeBuilder<string>();

export const load = (path: string) => fetch(path).then((res) => res.text());
