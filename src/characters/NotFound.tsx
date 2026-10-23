import { useState, type ReactNode } from 'react';
import { Character } from './Character';

type Props = {
  homeHref?: string;
  /** Rendered instead of a plain link, e.g. a react-router <Link>. */
  homeLink?: ReactNode;
};

/** The 404 page: the cow peering into an empty jar. */
export function NotFound({ homeHref = '/', homeLink }: Props) {
  const [tilt, setTilt] = useState(0);
  return (
    <main className="not-found">
      <div
        className="not-found__cow"
        style={{ transform: `rotate(${tilt}deg)` }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setTilt(((e.clientX - r.left) / r.width - 0.5) * 10);
        }}
        onPointerLeave={() => setTilt(0)}
      >
        <Character name="cow-404" alt="The Nimmi's cow peering into an empty jar" />
      </div>
      <div className="not-found__copy">
        <p className="eyebrow">Error 404</p>
        <h1>This jar is empty.</h1>
        <p>We looked everywhere, even under the lid. The page you wanted isn’t here.</p>
        {homeLink ?? (
          <a className="btn" href={homeHref}>
            Back to the ghee
          </a>
        )}
      </div>
    </main>
  );
}
