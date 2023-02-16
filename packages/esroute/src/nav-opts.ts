export type PathOrHref = string | string[];

export interface NavMeta {
  /** The search query object. */
  search?: Record<string, string>;
  /** The state to push. */
  state?: any;
  /** Whethe the history state shall be replaced. */
  replace?: boolean;
  /** Whether the resolution was triggered by a popstate event. */
  pop?: boolean;
}

export class NavOpts implements NavMeta {
  readonly state?: any;
  readonly params: string[] = [];
  readonly replace?: boolean;
  readonly path: string[];
  readonly search?: Record<string, string>;
  readonly pop?: boolean;
  private _h?: string;

  constructor(
    pathOrHref: PathOrHref,
    { pop, replace, search, state }: NavMeta = {}
  ) {
    if (typeof pathOrHref === "string") {
      if (!pathOrHref.startsWith("/")) pathOrHref = `/${pathOrHref}`;
      if (!search) this._h = pathOrHref;
      const [pathString, searchString] = pathOrHref.split("?");
      this.path = pathString.split("/").filter(Boolean);
      this.search ??= Object.fromEntries(
        new URLSearchParams(searchString).entries()
      );
    } else this.path = pathOrHref;
    if (pop !== undefined) this.pop = pop;
    if (search !== undefined) this.search = search;
    if (state !== undefined) this.state = state;
    if (replace !== undefined) this.replace = replace;
    this.search ??= {};
  }

  get href() {
    if (!this._h) {
      const s = new URLSearchParams(this.search).toString();
      const p = `/${this.path!.join("/")}`;
      this._h = `${p}${s ? `?${s}` : ""}`;
    }
    return this._h;
  }

  get go() {
    return (path: PathOrHref, opts: NavMeta = {}) =>
      new NavOpts(path, {
        search: opts.search,
        state: opts.state,
        replace: opts.replace ?? this.replace,
      });
  }
}
