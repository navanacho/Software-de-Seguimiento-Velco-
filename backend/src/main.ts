import { iniciarServidor } from './features/salud/http/app.ts';
import { leerConfiguracion } from './shared/configuracion.ts';

const configuracion = leerConfiguracion();
await iniciarServidor(configuracion);
