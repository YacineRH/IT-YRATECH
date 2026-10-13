import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Link, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Contenu } from './pages/Contenu';
import { Domaines } from './pages/Domaines';
import { Entrainement } from './pages/Entrainement';
import { Progression } from './pages/Progression';
import { Recherche } from './pages/Recherche';
import { Veille } from './pages/Veille';
import './styles/app.css';

function Introuvable() {
  return (
    <div className="panneau etat-vide">
      <p>Cette page n'existe pas.</p>
      <Link to="/">Revenir à la veille du jour</Link>
    </div>
  );
}

const routeur = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Veille /> },
      { path: '/domaines', element: <Domaines /> },
      { path: '/domaines/:slug', element: <Domaines /> },
      { path: '/contenus/:id', element: <Contenu /> },
      { path: '/entrainement', element: <Entrainement /> },
      { path: '/recherche', element: <Recherche /> },
      { path: '/progression', element: <Progression /> },
      { path: '*', element: <Introuvable /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={routeur} />
  </StrictMode>,
);
