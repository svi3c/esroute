import { compileRoutes, verifyRoutes } from "./route-spec";

const resolve = () => "foo";

describe("compileRoutes()", () => {
  it("should remove trailing slashes", () => {
    const routes = {
      "/": resolve,
      "/foo": resolve,
    };

    expect(compileRoutes(routes)).toEqual({
      "/": resolve,
      foo: resolve,
    });
  });

  it("should nest routes with slashes", () => {
    const routes = {
      "/foo/bar": resolve,
    };

    expect(compileRoutes(routes)).toEqual({
      foo: {
        bar: resolve,
      },
    });
  });

  it("should tolerate unnecessary slashes", () => {
    const routes = {
      "///foo//bar//": resolve,
    };

    expect(compileRoutes(routes)).toEqual({
      foo: {
        bar: resolve,
      },
    });
  });

  it("should extend existing routes", () => {
    const routes = {
      "/foo/bar/baz": resolve,
      "/foo": resolve,
      foo: {
        bar: resolve,
      },
    };

    expect(compileRoutes(routes)).toEqual({
      foo: {
        "/": resolve,
        bar: {
          "/": resolve,
          baz: resolve,
        },
      },
    });
  });

  it("should perform", () => {
    const routes = {};
    for (let i = 0; i < 10000; i++)
      routes[
        `aaaaaaaaaa${i % 100}/${i > 100 ? `bbbbbbbbb${i % 300}` : ""}/${
          i > 300 ? `cccccccccc${i}` : ""
        }`
      ] = resolve;

    const start = Date.now();
    compileRoutes(routes);

    expect(Date.now() - start).toBeLessThan(100);
  });
});

describe("verifyRoutes()", () => {
  it("should pass with correct routes", () => {
    verifyRoutes({
      "/": resolve,
      "?": () => true,
      foo: {
        "some-nested": resolve,
      },
    });
  });

  it("should fail with leading slash", () => {
    expect(() =>
      verifyRoutes({
        "/x": resolve,
      })
    ).toThrow(/\/x/);
  });

  it("should fail with trailing slash", () => {
    expect(() =>
      verifyRoutes({
        "x/": resolve,
      })
    ).toThrow(/x\//);
  });

  it("should fail with intermediate slash", () => {
    expect(() =>
      verifyRoutes({
        "x/y": resolve,
      })
    ).toThrow(/x\/y/);
  });
});
