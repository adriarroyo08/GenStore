import { env } from '../../config/env.js';
import type { ShippingCarrier } from '../shippingService.js';
import type { Order, Address } from '../../types/index.js';

// SEUR status mapping to our estados
const STATUS_MAP: Record<string, string> = {
  '0': 'preparando',
  '1': 'recogido',
  '2': 'en_transito',
  '3': 'en_reparto',
  '4': 'entregado',
  '5': 'incidencia',
};

function mapSeurStatus(code: string): string {
  return STATUS_MAP[code] ?? 'en_transito';
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export class SeurCarrier implements ShippingCarrier {
  private baseUrl: string;
  private user: string;
  private password: string;
  private contract: string;

  constructor() {
    if (!env.SEUR_USER || !env.SEUR_PASSWORD || !env.SEUR_CONTRACT) {
      throw new Error('SEUR credentials not configured');
    }
    this.baseUrl = env.SEUR_API_URL ?? 'https://ws.seur.com';
    this.user = env.SEUR_USER;
    this.password = env.SEUR_PASSWORD;
    this.contract = env.SEUR_CONTRACT;
  }

  async createShipment(order: Order, address: Address): Promise<{ trackingNumber: string; labelUrl?: string }> {
    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:imp="http://imp.ws.seur.com">
  <soapenv:Header/>
  <soapenv:Body>
    <imp:crearEnvio>
      <imp:in0>
        <imp:ccc>${this.contract}</imp:ccc>
        <imp:ci>${this.user}</imp:ci>
        <imp:nif></imp:nif>
        <imp:claveRetorno></imp:claveRetorno>
        <imp:refCliente>${escapeXml(order.numero_pedido)}</imp:refCliente>
        <imp:producto>2</imp:producto>
        <imp:servicio>31</imp:servicio>
        <imp:nombreDest>${escapeXml(address.nombre)}</imp:nombreDest>
        <imp:direccionDest>${escapeXml(address.calle)}</imp:direccionDest>
        <imp:cpDest>${escapeXml(address.codigo_postal)}</imp:cpDest>
        <imp:poblacionDest>${escapeXml(address.ciudad)}</imp:poblacionDest>
        <imp:provinciaDest>${escapeXml(address.provincia)}</imp:provinciaDest>
        <imp:paisDest>${escapeXml(address.pais)}</imp:paisDest>
        <imp:bultos>1</imp:bultos>
        <imp:kilos>1</imp:kilos>
        <imp:observaciones>${escapeXml(order.notas ?? '')}</imp:observaciones>
      </imp:in0>
    </imp:crearEnvio>
  </soapenv:Body>
</soapenv:Envelope>`;

    const response = await fetch(`${this.baseUrl}/webseur/services/WSCrearEnvio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'Authorization': 'Basic ' + Buffer.from(`${this.user}:${this.password}`).toString('base64'),
      },
      body: soapBody,
    });

    const xml = await response.text();

    // Parse tracking number from SOAP response
    const trackingMatch = xml.match(/<ECB>([^<]+)<\/ECB>/);
    if (!trackingMatch) {
      const errorMatch = xml.match(/<descripcion>([^<]+)<\/descripcion>/);
      throw new Error(`SEUR createShipment failed: ${errorMatch?.[1] ?? 'Unknown error'}`);
    }

    return { trackingNumber: trackingMatch[1] };
  }

  async getTracking(trackingNumber: string): Promise<Array<{
    estado: string;
    descripcion: string | null;
    ubicacion: string | null;
    occurred_at: string;
  }>> {
    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:imp="http://imp.ws.seur.com">
  <soapenv:Header/>
  <soapenv:Body>
    <imp:obtenerSeguimiento>
      <imp:in0>
        <imp:ecb>${trackingNumber}</imp:ecb>
      </imp:in0>
    </imp:obtenerSeguimiento>
  </soapenv:Body>
</soapenv:Envelope>`;

    const response = await fetch(`${this.baseUrl}/webseur/services/WSSeguimientoEnvio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'Authorization': 'Basic ' + Buffer.from(`${this.user}:${this.password}`).toString('base64'),
      },
      body: soapBody,
    });

    const xml = await response.text();

    // Parse events from SOAP response
    const events: Array<{
      estado: string;
      descripcion: string | null;
      ubicacion: string | null;
      occurred_at: string;
    }> = [];

    const eventRegex = /<evento>[\s\S]*?<codigoEstado>([^<]*)<\/codigoEstado>[\s\S]*?<descripcion>([^<]*)<\/descripcion>[\s\S]*?<ciudad>([^<]*)<\/ciudad>[\s\S]*?<fecha>([^<]*)<\/fecha>[\s\S]*?<\/evento>/g;

    let match;
    while ((match = eventRegex.exec(xml)) !== null) {
      events.push({
        estado: mapSeurStatus(match[1]),
        descripcion: match[2] || null,
        ubicacion: match[3] || null,
        occurred_at: match[4],
      });
    }

    return events;
  }

  async getLabel(trackingNumber: string): Promise<Buffer> {
    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:imp="http://imp.ws.seur.com">
  <soapenv:Header/>
  <soapenv:Body>
    <imp:obtenerEtiqueta>
      <imp:in0>
        <imp:ecb>${trackingNumber}</imp:ecb>
        <imp:formato>PDF</imp:formato>
      </imp:in0>
    </imp:obtenerEtiqueta>
  </soapenv:Body>
</soapenv:Envelope>`;

    const response = await fetch(`${this.baseUrl}/webseur/services/WSConsultaEnvio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'Authorization': 'Basic ' + Buffer.from(`${this.user}:${this.password}`).toString('base64'),
      },
      body: soapBody,
    });

    const xml = await response.text();
    const base64Match = xml.match(/<etiqueta>([^<]+)<\/etiqueta>/);

    if (!base64Match) throw new Error('SEUR: no label returned');

    return Buffer.from(base64Match[1], 'base64');
  }
}
