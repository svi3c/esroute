import { NavOpts } from "./nav-opts";

describe("NavOpts", () => {
  it("should take a path as first argument", () => {
    const path = ["foo", "bar"];
    const opts = new NavOpts(path);

    expect(opts.path).toBe(path);
    expectProps(opts, {
      pathString: "/foo/bar",
      href: "/foo/bar",
      search: {},
      searchString: "",
    });
  });

  it("should take a href as first argument", () => {
    const href = "/foo/bar?a=b";
    const opts = new NavOpts(href);

    expectProps(opts, {
      path: ["foo", "bar"],
      pathString: "/foo/bar",
      href,
      search: { a: "b" },
      searchString: "a=b",
    });
  });

  it("should take a object as search option which has higher prio than the search part of the href", () => {
    const href = "/foo/bar?a=b";
    const opts = new NavOpts(href, { search: { a: "c" } });

    expectProps(opts, {
      href: "/foo/bar?a=c",
      search: { a: "c" },
      searchString: "a=c",
    });
  });

  it("should take a string as search option which has higher prio than the search part of the href", () => {
    const href = "/foo/bar?a=b";
    const opts = new NavOpts(href, { search: "?a=c" });

    expectProps(opts, {
      href: "/foo/bar?a=c",
      search: { a: "c" },
      searchString: "a=c",
    });
  });

  it("should not set state and replace from the opts, if not specified", () => {
    const href = "/foo/bar?a=b";
    const opts = new NavOpts(href, {});

    expect("state" in opts).toBeFalsy();
    expect("replace" in opts).toBeFalsy();
  });

  it("should take state and replace from the opts", () => {
    const href = "/foo/bar?a=b";
    const opts = new NavOpts(href, { state: "abc", replace: true });

    expect(opts.state).toEqual("abc");
    expect(opts.replace).toEqual(true);
  });

  describe("go", () => {
    it("should create a new NavigateOpts instance with a new path", () => {
      const opts1 = new NavOpts(["a", "b"]);
      const opts2 = opts1.go("/a");

      expect(opts1).not.toBe(opts2);
      expect(opts2.path).toEqual(["a"]);
    });

    it("should only take over the replace option", () => {
      const opts1 = new NavOpts(["a", "b"], {
        replace: true,
        search: { a: "b" },
        state: {},
      });
      const opts2 = opts1.go("/a");

      expect(opts2.replace).toBe(true);
      expect(opts2.search).toEqual({});
      expect(opts2.state).toBeUndefined();
    });

    it("should set new options", () => {
      const opts1 = new NavOpts(["a", "b"], {
        replace: true,
      });
      const opts2 = opts1.go("/a", {
        replace: true,
        search: { a: "b" },
        state: 123,
      });

      expect(opts2.replace).toBe(true);
      expect(opts2.search).toEqual({ a: "b" });
      expect(opts2.state).toEqual(123);
    });
  });

  const expectProps = (
    opts: NavOpts,
    exp: Partial<{
      path: string[];
      pathString: string;
      href: string;
      search: {};
      searchString: string;
    }>
  ) => {
    if ("path" in exp) expect(opts.path).toEqual(exp.path);
    if ("pathString" in exp) expect(opts.pathString).toEqual(exp.pathString);
    if ("href" in exp) expect(opts.href).toEqual(exp.href);
    if ("search" in exp) expect(opts.search).toEqual(exp.search);
    if ("searchString" in exp)
      expect(opts.searchString).toEqual(exp.searchString);
  };
});
