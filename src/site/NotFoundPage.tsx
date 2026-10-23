import { Link } from 'react-router-dom';
import { NotFound } from '../characters';
import './site.css';

export function NotFoundPage() {
  return (
    <div className="nimmi-site">
      <NotFound
        homeLink={
          <Link className="btn" to="/">
            Back to the ghee
          </Link>
        }
      />
    </div>
  );
}
