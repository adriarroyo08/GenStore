import { env } from '../../config/env.js';
import type { ShippingCarrier } from '../shippingService.js';
import type { Order, Address } from '../../types/index.js';

const STATUS_MAP: Record<string, string> = {
  '0': 'preparando',
  '1': 'recogido',
  '2': 'en_transito',
  '3': 'en_reparto',
  '4': 'entregado',
  '5': 'incidencia',
};

function mapStatus(code: string): string {
  return STATUS_MAP[code] ?? 'en_transito';
}

export class MrwCarrier implements ShippingCarrier {
  private baseUrl: string;
  private auth: string;
  private franchiseCode: string;

  constructor() {
    if (!env.MRW_USER || !env.MRW_PASSWORD || !env.MRW_FRANCHISE_CODE) {
      throw new Error('MRW credentials not configured');
    }
    this.baseUrl = env.MRW_API_URL ?? 'https://sagec-test.mrw.es/MRWEnvio.asmx';
    this.auth = 'Basic ' + Buffer.from(`${env.MRW_USER}:${env.MRW_PASSWORD}`).toString('base64');
    this.franchiseCode = env.MRW_FRANCHISE_CODE;
  }

  async createShipment(order: Order, address: Address): Promise<{ trackingNumber: string; labelUrl?: string }> {
    const response = await fetch(`${this.baseUrl}/TransmEnvio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.auth,
      },
      body: JSON.stringify({
        franquiciaAbonado: this.franchiseCode,
        referencia: order.numero_pedido,
        destinatario: {
          nombre: address.nombre,
          direccion: address.calle,
          codigoPostal: address.codigo_postal,
          poblacion: address.ciudad,
          provincia: address.provincia,
          pais: address.pais,
        },
        bultos: 1,
        peso: '1',
        observaciones: order.notas ?? '',
      }),
    });

    const data = await response.json() as { numeroEnvio?: string; mensaje?: string };

    if (!data.numeroEnvio) {
      throw new Error(`MRW createShipment failed: ${data.mensaje ?? 'Unknown error'}`);
    }

    return { trackingNumber: data.numeroEnvio };
  }

  async getTracking(trackingNumber: string): Promise<Array<{
    estado: string;
    descripcion: string | null;
    ubicacion: string | null;
    occurred_at: string;
  }>> {
    const response = await fetch(`${this.baseUrl}/GetSeguimientoEnvio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.auth,
      },
      body: JSON.stringify({
        numeroEnvio: trackingNumber,
      }),
    });

    const data = await response.json() as {
      seguimiento?: Array<{
        codigoEstado: string;
        descripcionEstado: string;
        ubicacion: string;
        fecha: string;
      }>;
    };

    return (data.seguimiento ?? []).map((e) => ({
      estado: mapStatus(e.codigoEstado),
      descripcion: e.descripcionEstado || null,
      ubicacion: e.ubicacion || null,
      occurred_at: e.fecha,
    }));
  }

  async getLabel(trackingNumber: string): Promise<Buffer> {
    const response = await fetch(`${this.baseUrl}/GetEtiquetaEnvio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.auth,
      },
      body: JSON.stringify({
        numeroEnvio: trackingNumber,
      }),
    });

    const data = await response.json() as { etiqueta?: string };

    if (!data.etiqueta) throw new Error('MRW: no label returned');

    return Buffer.from(data.etiqueta, 'base64');
  }
}
