import { beforeEach, describe, expect, it, vi } from "vitest";
import { NavOpts } from "./nav-opts";
import { createRouter, Router } from "./router";

vi.spyOn(history, "replaceState");
vi.spyOn(history, "pushState");

Object.assign(global, { history, location, document, window });

describe("Router", () => {
  const onResolve = vi.fn();
  let router: Router<any>;
  beforeEach(() => {
    router = createRouter({
      routes: { "": ({}, next) => next ?? "index", foo: () => "foo" },
    });
  });

  describe("init()", () => {
    it("should subscribe to popstate and anchor click events", async () => {
      router.onResolve(onResolve);
      router.init();
      location.href = "/foo";

      window.dispatchEvent(new PopStateEvent("popstate"));
      await router.resolution;

      expect(onResolve).toHaveBeenCalledWith({
        value: "foo",
        opts: expect.any(NavOpts),
      });
    });

    it("should subscribe to popstate and anchor click events", async () => {
      router.onResolve(onResolve);
      router.init();
      const anchor = document.createElement("a");
      document.body.appendChild(anchor);
      // @ts-ignore
      anchor.origin = "//";
      anchor.pathname = "/foo";

      anchor.click();
      await router.resolution;

      expect(onResolve).toHaveBeenCalledWith({
        value: "foo",
        opts: expect.any(NavOpts),
      });
    });
  });

  describe("go()", () => {
    it("should navigate to route and push state", async () => {
      await router.go("/foo");

      expect(history.pushState).toHaveBeenCalledWith(undefined, "", "/foo");
    });

    it("should replace the state, if replace flag is set", async () => {
      await router.go("/foo", { replace: true });

      expect(history.replaceState).toHaveBeenCalledWith(undefined, "", "/foo");
    });
  });

  describe("onResolve()", () => {
    it("should initially call listener, if there is already a current resolution", async () => {
      await router.go("/foo");

      router.onResolve(onResolve);

      expect(onResolve).toHaveBeenNthCalledWith(1, {
        value: "foo",
        opts: expect.objectContaining(new NavOpts("foo")),
      });
    });

    it("should call the listener when a navigation has finished", async () => {
      await router.go("/foo");
      router.onResolve(onResolve);

      await router.go("/foo");

      expect(onResolve).toHaveBeenNthCalledWith(2, {
        value: "foo",
        opts: expect.objectContaining(new NavOpts("foo")),
      });
    });

    it("should return an unsubscribe callback", async () => {
      const unsubscribe = router.onResolve(onResolve);

      unsubscribe();

      await router.go("/foo");
      expect(onResolve).not.toHaveBeenCalledWith({
        value: "foo",
        opts: expect.objectContaining(new NavOpts("foo")),
      });
    });
  });
});
