# esroute

A small efficient framework-agnostic client-side routing library, written in TypeScript.

It is currently under development and API might slightly change.

## Features

Those features may be the ones you are looking for.

- [🔓 Framework agnostic](#-framework-agnostic)
- [🕹 Simple configuration](#-simple-configuration)
- [✅ Typesafe value resolution](#-typesafe-value-resolution)
- [🏎 Fast startup and runtime](#-fast-startup-and-runtime)
- [🛡 Route guards](#-route-guards)

### 🔓 Framework agnostic

Esroute is written with no external dependencies, so it does not require you to use a library.

### 🕹 Simple configuration

A configuration can look as simple as this:

```ts
import { Router } from "esroute";

const router = new Router({
  "/": ({ go }) => go("/foo"),
  foo: () => load("routes/foo.html"),
  nested: {
    "/": () => load("routes/nested/index.html"),
    "*": ({ params: [param] }) => {
      console.log(param);
      return load("routes/nested/dynamic.html");
    },
  },
});

router.onResolve(({ value }) => render(value));
```

You can of course compose the configuration as you like, which allows you to easily modularize you route configuration:

```ts
const router = new Router({
  "/": ({ go }) => go("/mod1"),
  mod1: mod1Routes,
  composed: {
    ...mod2Routes,
    ...mod3Routes,
  },
});
```

### ✅ Typesafe value resolution

A `Resolve<T> = (navOpts: NavOpts) => T | NavOpts | Promise<T | NavOpts>;` is a function type that derives a value from the navigation options. This value is of a certain type and the router can be restricted to allow only certain value types.

```ts
const router = new Router<string>({
  "/": () => "some nice value",
  async: loadString(),
  weird: () => 42, // TS Error
});
```

### 🏎 Fast startup and runtime

esroute comes with no dependencies and is quite small. The route spec object that is passed into the router instance is not processed and is very concise.

The route resolution is done by traversing the route spec tree and this algorithm is based on simple string comparisons (no regex matching).

### 🛡 Route guards

Route guards provide a way to check whether the current route should be routed to. If the given route resolution should not be applied, you can redirect to another route.

A guard can be applied to any route and it is called for the route it was applied to and it's sub-routes.

```ts
const router = new Router({
  members: {
    ...protectedRoutes,
    "?": ({ go }) => isLoggedIn || go(["login"]),
  },
  login: () => renderLogin(),
});
```

## Configuration

The `Router` constructor takes two arguments: A `RouteSpec` and a `RouterConf` object.

### The `RouteSpec`

`RouteSpec` is a recursive type:

```ts
type RouteSpec<T> =
  | {
      [K in string]: K extends "/"
        ? Resolve<T>
        : K extends "?"
        ? Guard
        : RouteSpec<T>;
    }
  | Resolve<T>;
```

Example:

```ts
{
  "/": resolveIndex,
  "?": ({ go }) => isLoggedIn || go(["login"]),
  x: resolveX,
  nested: {
    "/": resolveNestedIndex,
    y: resolveY,
    level2: {
      z: resolveZ,
      "?": ({ go }) => isAdmin || go([]),
    },
  },
}
```

### The `RouterConf`

`RouterConf` provides some router specific configuration:

```ts
interface RouterConf<T> {
  notFound?: Resolve<T>;
  noClick?: boolean;
}
```

`RouterConf.notFound` can be used to provide a custom handler
when a route cannot be resolved. By default the resolution is
redirected to the `/` route.

`RouterConf.noClick` can be used to disable the default click behavior for anchor elements.
