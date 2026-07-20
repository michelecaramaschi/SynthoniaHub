export const REQUEST_STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Ricevuta',
  PROCESSING: 'In lavorazione',
  COMPLETED: 'Completata',
  ARCHIVED: 'Archiviata',
};

export const REQUEST_TYPE_LABELS: Record<string, string> = {
  QUOTE: 'Preventivo',
  BOOKING: 'Prenotazione',
  SUPPORT: 'Supporto',
  OTHER: 'Altro',
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Bassa',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

export const STATUS_COLORS: Record<string, string> = {
  RECEIVED: 'bg-gray-100 text-gray-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-slate-100 text-slate-800',
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Amministratore',
  MANAGER: 'Manager',
  STAFF: 'Staff',
};

export const PAGE_SIZE = 10;
export const CACHE_DURATION = 60; // seconds
