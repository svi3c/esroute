import { describe, expect, it, vi } from "vitest";
import { NavOpts } from "./nav-opts";
import { resolve } from "./route-resolver";

describe("Resolver", () => {
  const mockNotFound = vi.fn();

  describe("resolution", () => {
    it("should resolve a route with resolve fn", async () => {
      const navOpts = new NavOpts("/foo/bar");

      const { value, opts } = await resolve(
        { foo: { bar: () => "foobar" } },
        navOpts,
        mockNotFound
      );

      expect(value).toEqual("foobar");
      expect(opts).toBe(navOpts);
    });

    it("should resolve a route with resolve fn on '/'", async () => {
      const navOpts = new NavOpts("/foo/bar");

      const { value, opts } = await resolve(
        { foo: { bar: { "": () => "bar" } } },
        navOpts,
        mockNotFound
      );

      expect(value).toEqual("bar");
      expect(opts).toBe(navOpts);
    });
  });

  describe("virtual routes", () => {
    it("should enable composite rendering", async () => {
      const navOpts = new NavOpts("/foo");

      const { value, opts } = await resolve(
        {
          "": ({}, next) => (next ? `${next}baz` : "index"),
          foo: () => "bar",
        },
        navOpts,
        mockNotFound
      );

      expect(value).toEqual("barbaz");
    });

    it("should be nestable", async () => {
      const navOpts = new NavOpts("/foo");

      const { value, opts } = await resolve(
        {
          "": {
            "": ({}, next) => (next ? `${next}baz` : "index"),
            foo: () => "bar",
          },
        },
        navOpts,
        mockNotFound
      );

      expect(value).toEqual("barbaz");
    });
  });

  describe("redirects", () => {
    it("should resolve a redirect via calling 'go()'", async () => {
      const navOpts = new NavOpts("/foo");

      const { value, opts } = await resolve(
        { foo: ({ go }) => go("/bar"), bar: () => "bar" },
        navOpts,
        mockNotFound
      );

      expect(value).toEqual("bar");
      expect(opts).toEqual(expect.objectContaining(new NavOpts("/bar")));
    });

    it("should fail on a redirect loop", async () => {
      const navOpts = new NavOpts("/foo");

      await expect(
        resolve(
          { foo: ({ go }) => go("/bar"), bar: ({ go }) => go("/foo") },
          navOpts,
          mockNotFound
        )
      ).rejects.toEqual(
        new Error("Detected redirect loop: /foo -> /bar -> /foo")
      );
    });

    it("should fail on too many redirects", async () => {
      const navOpts = new NavOpts("/foo", { state: 1 });

      await expect(
        resolve(
          { foo: ({ go, state }) => go("/foo", { state: state + 1 }) },
          navOpts,
          mockNotFound
        )
      ).rejects.toEqual(
        new Error(`Exceeded max redirects: ${"/foo -> ".repeat(10)}/foo`)
      );
    });
  });
});
