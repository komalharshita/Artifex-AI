import { createRoot } from 'react-dom/client';
import PosterCreator from './pages/poster-creator';

const route = window.location.pathname.replace(/\/+$/, '') || '/';

if (route === '/create') {
  const mount = document.getElementById('creator-root');

  if (!mount) {
    throw new Error('Poster editor mount point is missing.');
  }

  createRoot(mount).render(<PosterCreator />);
}
