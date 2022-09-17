export type PathOrHref = string | string[];

export interface NavMeta {
  search?: string | Record<string, string>;
  state?: any;
  replace?: boolean;
}

export class NavOpts<T = any> {
  readonly state: any;
  readonly params: string[] = [];
  readonly replace?: boolean;
  private _path?: string[];
  private _pathString?: string;
  private _search?: Record<string, string>;
  private _href?: string;
  private _searchString?: string;

  constructor(
    pathOrHref: PathOrHref,
    { replace, search, state }: NavMeta = {}
  ) {
    if (typeof pathOrHref === "string") {
      if (!pathOrHref.startsWith("/")) pathOrHref = `/${pathOrHref}`;
      if (!search) this._href = pathOrHref;
      const [pathString, searchString] = pathOrHref.split("?");
      this._pathString = pathString;
      search ??= searchString;
    } else this._path = pathOrHref;
    if (typeof search === "string")
      this._searchString = search.replace(/^\?/, "");
    else this._search = search ?? {};
    if (state !== undefined) this.state = state;
    if (replace !== undefined) this.replace = replace;
  }

  get path() {
    return (this._path ??= this.pathString.split("/").filter(Boolean));
  }

  get pathString() {
    return (this._pathString ??= `/${this._path!.join("/")}`);
  }

  get search() {
    if (this._search) return this._search;
    this._search = {} as Record<string, string>;
    for (const part of this._searchString!.split("&")) {
      if (part) {
        const [key, value] = part.split("=");
        this._search[key] = value ? decodeURIComponent(value) : "";
      }
    }
    return this._search;
  }

  get searchString() {
    if (this._searchString) return this._searchString;
    return (this._searchString = Object.keys(this._search!)
      .map((key) => {
        const value = this._search![key];
        return `${key}${value ? `=${encodeURIComponent(value)}` : ""}`;
      })
      .join("&"));
  }

  get href() {
    return (this._href ??= `${this.pathString}${
      this.searchString ? `?${this.searchString}` : ""
    }`);
  }

  get go() {
    return (path: PathOrHref, opts: NavMeta = {}) =>
      new NavOpts(path, {
        search: opts.search,
        state: opts.state,
        replace: opts.replace ?? this.replace,
      });
  }

  equals(o: NavOpts) {
    return (
      this.href === o.href &&
      this.replace === o.replace &&
      this.state === o.state &&
      this.params.every((p, idx) => p === o.params[idx])
    );
  }

  toString() {
    return this.href;
  }
}
