# esroute

A small efficient framework-agnostic client-side routing library, written in TypeScript.

It is currently under development and API might slightly change.

## Features

Those features may be the ones you are looking for.

- [🌈 Framework agnostic](#-framework-agnostic)
- [🕹 Simple configuration](#-simple-configuration)
- [✅ Typesafe value resolution](#-typesafe-value-resolution)
- [🏎 Fast startup and runtime](#-fast-startup-and-runtime)
- [🦄 Virtual routes](#-virtual-routes)

### 🌈 Framework agnostic

Esroute is written with no external dependencies, so it does not require you to use a library.

### 🕹 Simple configuration

A configuration can look as simple as this:

```ts
import { createRouter } from "esroute";

const router = createRouter({
  "": ({ go }, next) => next ?? go("/foo"),
  foo: () => load("routes/foo.html"),
  nested: {
    "": load("routes/nested/index.html"),
    "*": ({ params: [param] }) => load("routes/nested/dynamic.html", param),
  },
});

router.onResolve(({ value }) => render(value));
```

You can compose the configuration as you like, which allows you to easily modularize you route configuration:

```ts
const router = createRouter({
  "": ({ go }) => go("/mod1"),
  mod1: mod1Routes,
  merged: {
    ...mod2Routes,
    ...mod3Routes,
  },
});
```

### ✅ Typesafe value resolution

The router can be restricted to allow only certain resolution types.

```ts
const router = createRouter<string>({
  "": () => "some nice value",
  async: loadString(),
  weird: () => 42, // TS Error
});
```

### 🏎 Fast startup and runtime

esroute comes with no dependencies and is quite small.

The route resolution is done by traversing the route spec tree and this algorithm is based on simple string comparisons (no regex matching).

### 🦄 Virtual routes

When route resolution is done, all virtual routes (`""`) on the path to the leaf are collected and then rendered from leaf to root.

This allows creating various szenarios. Here are some examples:

#### Route guards

```ts
const router = createRouter({
  members: {
    "": ({ go }, next) => loggedIn ? next : go("/login")
    ...memberRoutes
  }
});
```

In the example above, a logged in user will see the profile and a logged-out user will see the login page instead.

#### Composed rendering

```ts
const router = createRouter({
  foo: {
    "": ({}, next) => (next ? `foo${next}` : "foo"),
    bar: () => `bar`,
  },
});
```

In this case the route `/foo` will resolve to `"foo"` and the route `/foo/bar` will resolve to `foobar`. With this pattern you can implement index routes and frames.

#### Anonymous grouping of routes

In some cases you might want to attach rendering af a common frame or a guard to a set of routes without placing them on a separate named parent route. This is where virtual routes come into play:

```ts
const router = createRouter({
  "": {
    "": ({ go }, value) => (loggedIn ? value ?? renderIndex() : go("/login")),
    ...memberRoutes,
  },
  login: () => renderLogin(),
});
```

In this sczenario we have the `memberRoutes` next to the `/login` route.

## Router configuration

The `Router` constructor takes two arguments: A `Routes` and a `RouterConf` object.

### The `Routes`

Example:

```ts
const routes: Routes = {
  "": ({ go }, value) => (isLoggedIn || value) ?? go(["login"]),
  x: resolveX,
  nested: {
    "": resolveNestedIndex,
    y: resolveY,
    level2: {
      z: resolveZ,
    },
    "*": {
      foo: ({ params: [myParam] }) => resolveFoo(myParam),
    },
  },
};
```

### The `RouterConf`

`RouterConf` provides some router-specific configuration:

```ts
interface RouterConf<T> {
  notFound?: Resolve<T>;
  noClick?: boolean;
  defer?: boolean;
  onResolve?: (resolved: Resolved<T>) => void;
}
```

`RouterConf.notFound`
A fallback resolve funuction to use, if a route could not be found.
By default it redirects to the root path '/'.

`RouterConf.noClick`
Whether the click handler for anchor elements shall not be installed. This might make sense, if you want to take more control over how anchor clicks are handled.

`RouterConf.defer`
Whether the router should delay initialization until `start()` is called on the `Router` instance.

This can be used to prevent circular dependencies in your application. You can modify the `routes` property on the router instance before calling `start()`.

`RouterConf.onResolve`
A callback that is invoked whenever a route is resolved.
