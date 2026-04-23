import { env } from '../../config/env.js';
import type { ShippingCarrier } from '../shippingService.js';
import type { Order, Address } from '../../types/index.js';

const STATUS_MAP: Record<string, string> = {
  '1': 'recogido',
  '2': 'en_transito',
  '3': 'en_reparto',
  '4': 'entregado',
  '5': 'incidencia',
};

function mapStatus(code: string): string {
  return STATUS_MAP[code] ?? 'en_transito';
}

export class CorreosExpressCarrier implements ShippingCarrier {
  private baseUrl = 'https://www.correosexpress.com/wpsc/apiRestGrabworking';
  private auth: string;
  private clientCode: string;

  constructor() {
    if (!env.CORREOS_EXPRESS_USER || !env.CORREOS_EXPRESS_PASSWORD || !env.CORREOS_EXPRESS_CLIENT_CODE) {
      throw new Error('Correos Express credentials not configured');
    }
    this.auth = 'Basic ' + Buffer.from(`${env.CORREOS_EXPRESS_USER}:${env.CORREOS_EXPRESS_PASSWORD}`).toString('base64');
    this.clientCode = env.CORREOS_EXPRESS_CLIENT_CODE;
  }

  async createShipment(order: Order, address: Address): Promise<{ trackingNumber: string; labelUrl?: string }> {
    const response = await fetch(`${this.baseUrl}/GrabEnvio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.auth,
      },
      body: JSON.stringify({
        solession: this.clientCode,
        codRte: this.clientCode,
        ref: order.numero_pedido,
        nomDes: address.nombre,
        dirDes: address.calle,
        pobDes: address.ciudad,
        cpDes: address.codigo_postal,
        paisDes: address.pais,
        numBultos: 1,
        kilos: '1',
        observaciones: order.notas ?? '',
      }),
    });

    const data = await response.json() as { codigoEnvio?: string; mensajeRetorno?: string };

    if (!data.codigoEnvio) {
      throw new Error(`Correos Express createShipment failed: ${data.mensajeRetorno ?? 'Unknown error'}`);
    }

    return { trackingNumber: data.codigoEnvio };
  }

  async getTracking(trackingNumber: string): Promise<Array<{
    estado: string;
    descripcion: string | null;
    ubicacion: string | null;
    occurred_at: string;
  }>> {
    const response = await fetch(`${this.baseUrl}/ListaEnvios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.auth,
      },
      body: JSON.stringify({
        codEnvio: trackingNumber,
      }),
    });

    const data = await response.json() as {
      estadoEnvios?: Array<{
        codEstado: string;
        desEstado: string;
        nomEstacion: string;
        fecEstado: string;
      }>;
    };

    return (data.estadoEnvios ?? []).map((e) => ({
      estado: mapStatus(e.codEstado),
      descripcion: e.desEstado || null,
      ubicacion: e.nomEstacion || null,
      occurred_at: e.fecEstado,
    }));
  }

  async getLabel(trackingNumber: string): Promise<Buffer> {
    const response = await fetch(`${this.baseUrl}/EtiquetaEnvio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.auth,
      },
      body: JSON.stringify({
        codEnvio: trackingNumber,
      }),
    });

    const data = await response.json() as { etiqueta?: string };

    if (!data.etiqueta) throw new Error('Correos Express: no label returned');

    return Buffer.from(data.etiqueta, 'base64');
  }
}
