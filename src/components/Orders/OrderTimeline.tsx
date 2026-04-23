import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Package, Store, Truck, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import type { ShipmentEvent } from '../../hooks/useOrderDetail';

interface OrderTimelineProps {
  events: ShipmentEvent[];
  shipmentStatus: string;
}

const EVENT_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  preparando: { icon: Package, color: 'bg-blue-500' },
  recogido: { icon: Store, color: 'bg-blue-500' },
  en_transito: { icon: Truck, color: 'bg-indigo-500' },
  en_reparto: { icon: MapPin, color: 'bg-indigo-500' },
  entregado: { icon: CheckCircle, color: 'bg-green-500' },
  incidencia: { icon: AlertTriangle, color: 'bg-red-500' },
};

export function OrderTimeline({ events, shipmentStatus }: OrderTimelineProps) {
  const { language } = useLanguage();

  if (!events || events.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">
          {language === 'es' ? 'Seguimiento' : 'Tracking'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {language === 'es'
            ? 'La información de seguimiento estará disponible cuando se envíe el pedido.'
            : 'Tracking information will be available once the order ships.'}
        </p>
      </div>
    );
  }

  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
  );

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString(language === 'es' ? 'es-ES' : 'en-US', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h2 className="text-lg font-bold text-foreground mb-6">
        {language === 'es' ? 'Seguimiento en vivo' : 'Live tracking'}
      </h2>
      <div className="space-y-0">
        {sortedEvents.map((event, index) => {
          const cfg = EVENT_CONFIG[event.estado] || EVENT_CONFIG.preparando;
          const EventIcon = cfg.icon;
          const isFirst = index === 0;
          const isLast = index === sortedEvents.length - 1;

          return (
            <div key={index} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${cfg.color} ${isFirst ? 'ring-4 ring-offset-2 ring-offset-card ring-current/20' : ''}`}>
                  <EventIcon className="w-4 h-4" />
                </div>
                {!isLast && <div className="w-0.5 h-10 bg-border mt-1" />}
              </div>
              <div className={`pb-6 ${isFirst ? '' : 'opacity-70'}`}>
                <p className={`text-sm font-semibold ${isFirst ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {event.descripcion}
                </p>
                {event.ubicacion && (
                  <p className="text-xs text-muted-foreground mt-0.5">{event.ubicacion}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{formatDateTime(event.occurred_at)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
