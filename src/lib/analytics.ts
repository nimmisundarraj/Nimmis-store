import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Visitor analytics through PostHog, for the funnel home → products → order sheet → item added → WhatsApp.
 * Set REACT_APP_POSTHOG_KEY (and REACT_APP_POSTHOG_HOST for the EU cloud) in .env.local; without a key
 * nothing loads and every call is a no-op. posthog-js is imported on demand so the main bundle stays small,
 * and events sent before it arrives wait in a queue.
 */
const KEY = process.env.REACT_APP_POSTHOG_KEY;
const HOST = process.env.REACT_APP_POSTHOG_HOST || 'https://us.i.posthog.com';

/** Where a visitor came to /products from; links pass it as router state `{ from }`. */
export type ProductsSource = 'nav' | 'more-tile' | 'see-all' | 'dish-pill' | 'order-sheet';

type Props = Record<string, unknown>;
type PostHog = { capture: (event: string, props?: Props) => void };

let client: PostHog | null = null;
let loading = false;
const queue: [string, Props?][] = [];

function load() {
  if (loading || !KEY) return;
  loading = true;
  import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(KEY, {
        api_host: HOST,
        // Page views are sent by usePageViews, since the router changes pages without a reload.
        capture_pageview: false,
        capture_pageleave: true,
        person_profiles: 'identified_only',
      });
      client = posthog;
      queue.splice(0).forEach(([event, props]) => posthog.capture(event, props));
    })
    .catch(() => {
      // Blocked by an ad blocker or offline: the site works the same without analytics.
      queue.length = 0;
    });
}

export function track(event: string, props?: Props) {
  if (!KEY) return;
  if (client) client.capture(event, props);
  else {
    queue.push([event, props]);
    load();
  }
}

/** Sends a page view on every route change, with where a /products visit came from. Mount once inside the router. */
export function usePageViews() {
  const location = useLocation();
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;
    const from = (location.state as { from?: ProductsSource } | null)?.from;
    track('$pageview', {
      $current_url: window.location.href,
      ...(from && { from }),
    });
  }, [location]);

  // Every WhatsApp link that isn't the order sheet's send button (which reports its own details).
  useEffect(() => {
    if (!KEY) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href^="https://wa.me/"]');
      if (!a || a.hasAttribute('data-track-skip')) return;
      track('whatsapp_clicked', {
        page: window.location.pathname,
        label: a.textContent?.trim().slice(0, 60),
      });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
}
