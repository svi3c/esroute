import { NavOpts } from "./nav-opts";
import { Resolved } from "./route-resolver";
import { Router } from "./router";

const mock = <T>(obj: Partial<jest.Mocked<T>>) => obj as jest.Mocked<T>;
const history = mock<History>({
  pushState: jest.fn(),
  replaceState: jest.fn(),
});
const location = {} as Location;
const document = mock<Document>({ addEventListener: jest.fn() });
const window = mock<Window>({
  history,
  location,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  document,
});

Object.assign(global, { history, location, document, window });

describe("Router", () => {
  const resolver = jest.fn();
  const notFound = () => 404;
  let router: Router<any>;
  let initialResolved: Resolved<any>;

  beforeEach(() => {
    jest.resetAllMocks();
    initialResolved = {
      value: "initial",
      opts: new NavOpts("/initial"),
    };
    resolver.mockResolvedValueOnce(initialResolved);
    router = new Router<any>({}, { notFound, resolver });
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
      resolver.mockResolvedValue({ value: 42, opts });

      await router.go("/foo");

      expect(resolver).toHaveBeenCalledWith({}, opts, notFound);
      expect(history.pushState).toHaveBeenCalledWith(undefined, "", "/foo");
    });

    it("should replace the state, if replace flag is set", async () => {
      const opts = new NavOpts("/foo", { replace: true });
      resolver.mockResolvedValue({ value: 42, opts });

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
      resolver.mockResolvedValueOnce(resolved);
      router.onResolve(onResolve);

      await router.go("/abc");

      expect(onResolve).toHaveBeenNthCalledWith(2, resolved);
    });

    it("should return an unsubscribe callback", async () => {
      const onResolve = jest.fn();
      const resolved = { value: "changed", opts: new NavOpts("/abc") };
      resolver.mockResolvedValueOnce(resolved);
      const unsubscribe = router.onResolve(onResolve);

      unsubscribe();

      await router.go("/abc");
      expect(onResolve).not.toHaveBeenCalledWith(resolved);
    });
  });
});
