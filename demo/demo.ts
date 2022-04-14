import { defaultRouter } from "../src";
import { aRoutes } from "./a";
import { createRoutes, load } from "./routing";

const myRoutes = createRoutes({
  "/": (x) => {
    console.log(x);
    return load("routes/root.html");
  },
  foo: () => load("routes/foo.html"),
  bar: () => load("routes/bar.html"),
  x: {
    "/": () => "abc",
    "*": ({ params: [param] }) => {
      console.log(param);
      return load("routes/foo.html");
    },
  },
  "/x/y/*/*": ({ params: [param1, param2] }) => {
    console.log({ param1, param2 });
    return load("routes/foo.html");
  },
  a: aRoutes,
});

const router = defaultRouter(myRoutes, {
  notFound: ({ href, go }) => {
    console.warn("Route not found", href);
    return go([]);
  },
});

router.onResolve(({ value }) => render(value));

const render = (content: string) => (document.body.innerHTML = content);
