import { RequestStatus, RequestType, Priority } from '@prisma/client';

export interface ClientRequest {
  id: string;
  whatsappMessageId: string;
  clientPhone: string;
  clientName: string;
  requestType: RequestType;
  status: RequestStatus;
  content: string;
  extractedData?: Record<string, any>;
  assignedUserId?: string;
  priority: Priority;
  estimatedValue?: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export interface RequestTimeline {
  id: string;
  requestId: string;
  eventType: 'RECEIVED' | 'VIEWED' | 'ASSIGNED' | 'STATUS_CHANGED' | 'COMMENTED' | 'CLOSED';
  details?: Record<string, any>;
  createdByUserId: string;
  createdAt: Date;
}
