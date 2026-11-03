import { useQuery } from '@tanstack/react-query';
import { pedir } from '../api/cliente.js';

// Todas las rifas (historial) y la que está publicada, si hay una.
export function useRifas() {
  const q = useQuery({ queryKey: ['admin', 'rifas'], queryFn: () => pedir('/admin/rifas') });
  const rifas = q.data?.rifas ?? [];
  return { ...q, rifas, activa: rifas.find((r) => r.estado === 'activa') ?? null };
}

// Talonario de una rifa: los 100 números con comprador, pagos y saldo.
export function useTalonario(rifaId) {
  return useQuery({
    queryKey: ['admin', 'boletos', rifaId],
    queryFn: () => pedir(`/admin/rifas/${rifaId}/boletos`),
    enabled: Boolean(rifaId),
  });
}
