import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RadarPage } from './pages/RadarPage';
import { ThemesPage } from './pages/ThemesPage';
import { StreamsPage } from './pages/StreamsPage';
import { DecisionsPage } from './pages/DecisionsPage';
import { ContentPage } from './pages/ContentPage';
import { ExportPage } from './pages/ExportPage';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <RadarPage /> },
      { path: 'themes', element: <ThemesPage /> },
      { path: 'streams', element: <StreamsPage /> },
      { path: 'decisions', element: <DecisionsPage /> },
      { path: 'content', element: <ContentPage /> },
      { path: 'export', element: <ExportPage /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
