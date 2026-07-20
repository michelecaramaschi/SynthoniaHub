import { Role } from '@prisma/client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: 'ACTIVE' | 'INACTIVE';
  whatsappPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user?: User;
  expires: string;
}
