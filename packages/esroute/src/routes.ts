import { NavOpts } from "./nav-opts";

export type Resolve<T = any> = (
  navOpts: NavOpts,
  next?: T
) => T | NavOpts | Promise<T | NavOpts>;

export interface Routes<T = any> {
  [k: string]: Routes<T> | Resolve<T>;
}
