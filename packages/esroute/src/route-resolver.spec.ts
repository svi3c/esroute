import { NavOpts } from "./nav-opts";
import { defaultRouteResolver } from "./route-resolver";

describe("Resolver", () => {
  const resolver = defaultRouteResolver();

  it("should resolve a route with resolve fn", async () => {
    const navOpts = new NavOpts("/foo/bar");

    const { value, opts } = await resolver(
      { foo: { bar: () => "foobar" } },
      navOpts,
      null
    );

    expect(value).toEqual("foobar");
    expect(opts).toBe(navOpts);
  });

  it("should resolve a route with resolve fn on '/'", async () => {
    const navOpts = new NavOpts("/foo/bar");

    const { value, opts } = await resolver(
      { foo: { bar: { "/": () => ({ foo: "bar" }) } } },
      navOpts,
      null
    );

    expect(value).toEqual({ foo: "bar" });
    expect(opts).toBe(navOpts);
  });

  it("should resolve a redirect via calling 'go()'", async () => {
    const navOpts = new NavOpts("/foo");

    const { value, opts } = await resolver(
      { foo: ({ go }) => go("/bar"), bar: () => ({ foo: "bar" }) },
      navOpts,
      null
    );

    expect(value).toEqual({ foo: "bar" });
    expect(opts).toEqual(expect.objectContaining(new NavOpts("/bar")));
  });

  it("should fail on a redirect loop", async () => {
    const navOpts = new NavOpts("/foo");

    await expect(
      resolver(
        { foo: ({ go }) => go("/bar"), bar: ({ go }) => go("/foo") },
        navOpts,
        null
      )
    ).rejects.toEqual(
      new Error("Detected redirect loop: /foo -> /bar -> /foo")
    );
  });

  it("should fail on too many redirects", async () => {
    const navOpts = new NavOpts("/foo", { state: 1 });

    await expect(
      resolver(
        { foo: ({ go, state }) => go("/foo", { state: state + 1 }) },
        navOpts,
        null
      )
    ).rejects.toEqual(
      new Error(`Exceeded max redirects: ${"/foo -> ".repeat(10)}/foo`)
    );
  });
});
