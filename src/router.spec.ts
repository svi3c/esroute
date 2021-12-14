import { NavOpts } from "./nav-opts";
import { Resolved, RouteResolver } from "./route-resolver";
import { Router } from "./router";

const mock = <T>(obj: Partial<jest.Mocked<T>>) => obj as jest.Mocked<T>;

describe("Router", () => {
  const history = mock<History>({
    pushState: jest.fn(),
    replaceState: jest.fn(),
  });
  const location = {} as Location;
  const window = {
    history,
    location,
    addEventListener: jest.fn(),
    document: { addEventListener: jest.fn() },
  };
  const mockResolver = {
    resolve: jest.fn(),
  } as Partial<jest.Mocked<RouteResolver>> as jest.Mocked<RouteResolver>;
  const notFound = () => 404;
  let router: Router<any>;
  let initialResolved: Resolved<any>;

  beforeEach(() => {
    jest.resetAllMocks();
    initialResolved = {
      value: "initial",
      opts: new NavOpts("/initial"),
    };
    mockResolver.resolve.mockResolvedValueOnce(initialResolved);
    router = new Router<any>(
      {},
      {
        notFound,
        resolver: mockResolver,
        window: window as any,
      }
    );
  });

  it("should subscribe to popstate and anchor click events", () => {
    expect(window.addEventListener).toHaveBeenCalledWith(
      "popstate",
      expect.any(Function)
    );
    expect(window.document.addEventListener).toHaveBeenCalledWith(
      "click",
      expect.any(Function)
    );
  });

  describe("go()", () => {
    it("should navigate to route, if route matches", async () => {
      const opts = new NavOpts("/foo");
      mockResolver.resolve.mockResolvedValue({ value: 42, opts });

      await router.go("/foo");

      expect(mockResolver.resolve).toHaveBeenCalledWith({}, opts, notFound);
      expect(history.pushState).toHaveBeenCalledWith(undefined, "", "/foo");
    });

    it("should replace the state, if replace flag is set", async () => {
      const opts = new NavOpts("/foo", { replace: true });
      mockResolver.resolve.mockResolvedValue({ value: 42, opts });

      await router.go("/foo");

      expect(history.replaceState).toHaveBeenCalledWith(undefined, "", "/foo");
    });
  });

  describe("onResolve()", () => {
    it("should initially call listener, if there is already a current resolution", async () => {
      const onResolve = jest.fn();

      router.onResolve(onResolve);

      expect(onResolve).toHaveBeenNthCalledWith(1, initialResolved);
    });

    it("should call the listener when a navigation has finished", async () => {
      const onResolve = jest.fn();
      const resolved = { value: "changed", opts: new NavOpts("/abc") };
      mockResolver.resolve.mockResolvedValueOnce(resolved);
      router.onResolve(onResolve);

      await router.go("/abc");

      expect(onResolve).toHaveBeenNthCalledWith(2, resolved);
    });

    it("should return an unsubscribe callback", async () => {
      const onResolve = jest.fn();
      const resolved = { value: "changed", opts: new NavOpts("/abc") };
      mockResolver.resolve.mockResolvedValueOnce(resolved);
      const unsubscribe = router.onResolve(onResolve);

      unsubscribe();

      await router.go("/abc");
      expect(onResolve).not.toHaveBeenCalledWith(resolved);
    });
  });
});
