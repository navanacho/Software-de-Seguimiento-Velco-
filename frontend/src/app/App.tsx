import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { Salud } from '../features/salud/components/Salud.tsx';
import { TableroPage } from '../features/tablero/TableroPage.tsx';
import { DetalleOpPage } from '../features/ordenes/DetalleOpPage.tsx';
import { OrdenFormPage } from '../features/ordenes/OrdenFormPage.tsx';
import { ConfiguracionPage } from '../features/configuracion/ConfiguracionPage.tsx';

interface PropiedadesApp {
  rutaInicial?: string;
}

function EditarOrdenRoute() {
  const { id = '' } = useParams();
  return <OrdenFormPage ordenId={id} />;
}

function DetalleOrdenRoute() {
  const { id = '' } = useParams();
  return <DetalleOpPage ordenId={id} />;
}

export function App({ rutaInicial = '/' }: PropiedadesApp) {
  const [cliente] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={[rutaInicial]}>
        <Routes>
          <Route path="/" element={<TableroPage />} />
          <Route path="/salud" element={<Salud respuesta={{ estado: 'ok' }} />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
          <Route path="/ops/nueva" element={<OrdenFormPage />} />
          <Route path="/ops/:id/editar" element={<EditarOrdenRoute />} />
          <Route path="/ops/:id" element={<DetalleOrdenRoute />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}
