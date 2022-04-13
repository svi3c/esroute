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
import { defaultRouter } from "esroute";

const router = defaultRouter({
  "/": ({ go }) => go("/foo"),
  foo: () => load("routes/foo.html"),
  nested: load("routes/nested/index.html"),
  "nested/*": ({ params: [param] }) =>
    load("routes/nested/dynamic.html", param),
});

router.onResolve(({ value }) => render(value));
```

You can of course compose the configuration as you like, which allows you to easily modularize you route configuration:

```ts
const router = defaultRouter({
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

esroute comes with no dependencies and is quite small.

The route resolution is done by traversing the route spec tree and this algorithm is based on simple string comparisons (no regex matching).

You can decide to use the more concise, but non-optimizable version of creating a router like this:

```ts
import { defaultRouter } from "esroute";

const router = defaultRouter(myRouteSpec, myConfig);
```

Or you can use the more verbose, but more tweakable approach. This is equivalent to short form setup listed above:

```ts
import {
  Router,
  compileRoutes,
  defaultRouteResolver,
  verifyRoutes,
} from "esroute";

const router = new Router(verifyRoutes(compileRoutes(routeSpec)), {
  resolver: defaultRouteResolver(),
  ...myConfig,
});
```

When using the constructor, you can tweak performance even more:

- You can decide not to use nested route strings in the configuration
- You may run `verifyRoutes()` only at development time and let it tree-shake when bundling you app for production
- If you want to take control over the route resolution, you can exchange the `defaultRouteResolver`.

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
    "*": {
      "foo": ({ params: [myParam] }) => resolveFoo(myParam),
    }
  }
}
```

### Compilation

If you configure the routes like listed above, no compilation step is required.
For convenience, there is a `compileRoutes()` function that you can use to write
routes in a maybe more concise way. Of course this precompilation has a bit of performance and payload cost. So if you have a lot of routes, you might consider using the already optimized format above.

```ts
compileRoutes({
  "/users/*": {
    "/posts/*": ({ params: [userId, postId] }) => resolvePost(userId, postId),
    "/posts": ({ params: [userId] }) => resolvePostList(userId),
  },
});
```

You can also compile only part of the routes like this:

```ts
{
  users: {
    "*": {
      ...compileRoutes({
        "/posts/*": ({ params: [userId, postId] }) => resolvePost(userId, postId),
        "/posts": ({ params: [userId] }) => resolvePostList(userId),
      }),
    },
  },
}
```

### Verification

To ensure that your routes are setup correctly, it makes sense to verify your routes configuration.
For maximum performance and treeshakability, the route verification is not baked-in to the router. You can set it up such that it is only included at development time.

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

## API

### `Router.onResolve((res: Resolved<T>) => void): () => void`

A router instance holds a callback registry.

Your callback will be called initially with the currently resolved route and then every time a new route is resolved, but not yet placed on the history stack.

`onResolve()` returns a function that you can call to unsubscribe the passed-in callback again.

`Resolved<T>` looks like this:

```ts
interface Resolved<T> {
  value: T;
  opts: NavOpts;
}
```

So when the route is resolved, not only get passed the resolved value (for example a template or a DOM element), but also the `NavOpts` instance to gain access to path variables, search params or the state.
