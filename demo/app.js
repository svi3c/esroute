import { Router } from "/dist/router.js";

const router = new Router(
  {
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
    "/x/y/*/*": ({ params: [param1, param2] }) => {
      console.log({ param1, param2 });
      return load("routes/foo.html");
    },
  },
  {
    notFound: ({ href, go }) => {
      console.warn("Route not found", href);
      return go([]);
    },
  }
);

router.onResolve(({ value }) => render(value));

const load = (path) => fetch(path).then((res) => res.text());

const render = (content) => (document.body.innerHTML = content);
