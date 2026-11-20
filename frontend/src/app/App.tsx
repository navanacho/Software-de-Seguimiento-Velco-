import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Salud } from '../features/salud/components/Salud.tsx';

interface PropiedadesApp {
  rutaInicial?: string;
}

export function App({ rutaInicial = '/' }: PropiedadesApp) {
  const [cliente] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={[rutaInicial]}>
        <Routes>
          <Route path="/" element={<Salud respuesta={{ estado: 'ok' }} />} />
          <Route path="/salud" element={<Salud respuesta={{ estado: 'ok' }} />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}
