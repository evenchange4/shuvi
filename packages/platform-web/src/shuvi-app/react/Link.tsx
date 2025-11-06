import * as React from 'react';
import {
  Link as LinkFromRouterReact,
  LinkProps,
  RouterContext
} from '@shuvi/router-react';
import {
  IRouter,
  PathRecord,
  getFilesOfRoute
} from '@shuvi/platform-shared/shared';
import useIntersection from './utils/useIntersection';
import { awaitPageLoadAndIdle } from '@shuvi/utils/idleCallback';

const ABSOLUTE_URL_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/;
const prefetched: { [cacheKey: string]: boolean } = {};

function hasSupportPrefetch() {
  try {
    const link: HTMLLinkElement = document.createElement('link');
    return link.relList.supports('prefetch');
  } catch (e) {
    return false;
  }
}

function prefetchViaDom(href: string, id: string, as: string): Promise<any> {
  return new Promise<void>((res, rej) => {
    const selector = `
        link[rel="prefetch"][href^="${href}"],
        link[rel="preload"][href^="${href}"],
        script[src^="${href}"]`;
    if (document.querySelector(selector)) {
      return res();
    }

    const link = document.createElement('link');

    // The order of property assignment here is intentional:
    if (as) link.as = as;
    link.rel = `prefetch`;
    link.onload = res as any;
    link.onerror = rej;
    link.dataset.id = id;

    // `href` should always be last:
    link.href = href;

    document.head.appendChild(link);
  });
}

async function prefetchFn(router: IRouter, to: PathRecord): Promise<void> {
  const files = getFilesOfRoute(router, to);

  if (process.env.NODE_ENV !== 'production') return;
  if (typeof window === 'undefined') return;

  const canPrefetch: boolean = hasSupportPrefetch();
  await Promise.all(
    canPrefetch
      ? files.js.map(async ({ url, id }) => {
          await awaitPageLoadAndIdle({ remainingTime: 49, timeout: 10 * 1000 });
          await prefetchViaDom(url, id, 'script');
        })
      : []
  );
}

const isAbsoluteUrl = (url: string) => {
  return ABSOLUTE_URL_REGEX.test(url);
};

/**
 * SimpleLinkWithHoverPrefetch
 *
 * Lightweight Link component that only prefetches on hover.
 * No IntersectionObserver, no memory overhead.
 * Used when prefetch={false} to avoid memory leaks while keeping hover prefetch.
 */
const SimpleLinkWithHoverPrefetch = React.forwardRef<
  HTMLAnchorElement,
  LinkWrapperProps
>(function SimpleLinkWithHoverPrefetch({ to, onMouseEnter, ...rest }, ref) {
  const isHrefValid = typeof to === 'string' && !isAbsoluteUrl(to);
  const { router } = React.useContext(RouterContext);

  const handleMouseEnter = React.useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (typeof onMouseEnter === 'function') {
        onMouseEnter(e);
      }
      if (isHrefValid && !prefetched[to]) {
        prefetchFn(router, to);
        prefetched[to] = true;
      }
    },
    [onMouseEnter, isHrefValid, to, router]
  );

  return (
    <LinkFromRouterReact
      to={to}
      ref={ref}
      onMouseEnter={handleMouseEnter}
      {...rest}
    />
  );
});

/**
 * FullLinkWithAutoPrefetch
 *
 * Full-featured Link component with automatic prefetch on viewport visibility.
 * Uses IntersectionObserver to detect when link enters viewport.
 * Includes hover prefetch as fallback.
 */
const FullLinkWithAutoPrefetch = React.forwardRef<
  HTMLAnchorElement,
  LinkWrapperProps
>(function FullLinkWithAutoPrefetch({ to, onMouseEnter, ...rest }, ref) {
  const isHrefValid = typeof to === 'string' && !isAbsoluteUrl(to);
  const { router } = React.useContext(RouterContext);
  const previousHref = React.useRef(to);
  const isMountedRef = React.useRef(true);
  const [setIntersectionRef, isVisible, resetVisible] = useIntersection({});

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const setRef = React.useCallback(
    async (el: HTMLAnchorElement | null) => {
      if (!el) return;

      /**
       * Lazy prefetching to avoid negative performance impact for the first page.
       */
      await awaitPageLoadAndIdle({ remainingTime: 49, timeout: 10 * 1000 });

      // Check if component is still mounted after async operation
      if (!isMountedRef.current) return;

      // Before the link getting observed, check if visible state need to be reset
      if (isHrefValid && previousHref.current !== to) {
        resetVisible();
        previousHref.current = to;
      }

      if (isHrefValid) setIntersectionRef(el);

      if (ref) {
        if (typeof ref === 'function') ref(el);
        else if (typeof ref === 'object') {
          ref.current = el;
        }
      }
    },
    [to, isHrefValid, resetVisible, setIntersectionRef, ref]
  );

  React.useEffect(() => {
    const shouldPrefetch = isHrefValid && isVisible;
    if (shouldPrefetch && !prefetched[to]) {
      prefetchFn(router, to);
      prefetched[to] = true;
    }
  }, [to, isVisible, isHrefValid, router]);

  const childProps: {
    ref?: any;
    onMouseEnter: React.MouseEventHandler<HTMLAnchorElement>;
  } = {
    ref: setRef,
    onMouseEnter: (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (typeof onMouseEnter === 'function') {
        onMouseEnter(e);
      }
      if (isHrefValid && !prefetched[to]) {
        prefetchFn(router, to);
        prefetched[to] = true;
      }
    }
  };

  return <LinkFromRouterReact to={to} {...rest} {...childProps} />;
});

/**
 * Link Component
 *
 * Main entry point that delegates to appropriate implementation:
 * - prefetch={false}: SimpleLinkWithHoverPrefetch (no IntersectionObserver)
 * - prefetch={true} or undefined: FullLinkWithAutoPrefetch (with IntersectionObserver)
 */
export const Link = React.forwardRef<HTMLAnchorElement, LinkWrapperProps>(
  function Link({ prefetch, ...props }, ref) {
    if (prefetch === false) {
      return <SimpleLinkWithHoverPrefetch ref={ref} {...props} />;
    }
    return <FullLinkWithAutoPrefetch ref={ref} {...props} />;
  }
);

interface LinkWrapperProps extends LinkProps {
  prefetch?: boolean;
  ref?: any;
}
