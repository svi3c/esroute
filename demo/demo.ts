import { compileRoutes, defaultRouter, RouteSpec } from "../src";

const routeSpec: RouteSpec<string> = {
  "/": (x) => {
    console.log(x);
    return load("routes/root.html");
  },
  foo: () => load("routes/foo.html"),
  bar: () => load("routes/bar.html"),
  x: {
    "/": {},
    "*": ({ params: [param] }) => {
      console.log(param);
      return load("routes/foo.html");
    },
  },
  ...compileRoutes({
    "/x/y/*/*": ({ params: [param1, param2] }) => {
      console.log({ param1, param2 });
      return load("routes/foo.html");
    },
  }),
};
const router = defaultRouter<string>(routeSpec, {
  notFound: ({ href, go }) => {
    console.warn("Route not found", href);
    return go([]);
  },
});

router.onResolve(({ value }) => render(value));

const load = (path: string) => fetch(path).then((res) => res.text());

const render = (content: string) => (document.body.innerHTML = content);
