import {
  History,
  Path,
  State,
  Listener,
  RemoveListenerCallback,
  PathRecord
} from './history';

export type IParams = Record<string, string>;

export type IRouteComponentProps = Record<string, string>;

export interface IRouteRecord<Element = any> {
  caseSensitive?: boolean;
  children?: IRouteRecord<Element>[];
  component?: any; // For react will be React.Element
  redirect?: string;
  resolve?: NavigationGuardHookWithContext;
  props?: IRouteComponentProps;
  path: string;
}

export interface NavigationGuardHook<R extends IRouteRecord = any> {
  (
    to: IRoute<R>,
    from: IRoute<R>,
    next: (
      nextObject?: false | string | { path?: string; replace?: boolean } | Error
    ) => void
  ): void;
}

export interface NavigationGuardHookWithContext<R extends IRouteRecord = any> {
  (
    to: IRoute<R>,
    from: IRoute<R>,
    next: (
      nextObject?: false | string | { path?: string; replace?: boolean } | Error
    ) => void,
    context: NavigationHookContext
  ): void;
}

export interface NavigationResolvedHook<R extends IRouteRecord = any> {
  (to: IRoute<R>, from: IRoute<R>): void;
}

export interface NavigationHookContext {
  props?: Record<string, string>;
}

export interface IRouteMatch<T = IRouteRecord> {
  route: T;
  pathname: string;
  params: IParams;
}

export type IRouteBranch<T = IRouteRecord> = [string, T[], number[]];

export type IPathPattern =
  | string
  | { path: string; caseSensitive?: boolean; end?: boolean };

export interface IPathMatch {
  path: string;
  pathname: string;
  params: IParams;
}

export type IPartialRouteRecord<Element = any> = Partial<IRouteRecord<Element>>;

export interface IRoute<RouteRecord extends IRouteRecord = IRouteRecord>
  extends Path {
  params: IParams;
  state: State;
  matches: IRouteMatch<RouteRecord>[] | null;
  redirected?: boolean;
  // todo?
  // fullpath: string?
  // href: string?
}

export interface IRouter<RouteRecord extends IRouteRecord = IRouteRecord> {
  current: IRoute<RouteRecord>;
  action: History['action'];
  push(to: PathRecord, state?: any): void;
  replace(to: PathRecord, state?: any): void;
  go: History['go'];
  back: History['back'];
  block: History['block'];
  resolve: History['resolve'];
  forward(): void;
  ready: Promise<any>;

  listen: (listener: Listener) => RemoveListenerCallback;
  beforeEach: (listener: NavigationGuardHook) => RemoveListenerCallback;
  afterEach: (listener: NavigationResolvedHook) => RemoveListenerCallback;
}