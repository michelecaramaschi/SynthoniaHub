import { ChecklistStatus, Frequency } from '@prisma/client';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: Date;
}

export interface DailyChecklist {
  id: string;
  date: Date;
  createdById: string;
  items: ChecklistItem[];
  status: ChecklistStatus;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormulaCheck {
  id: string;
  name: string;
  description?: string;
  checkItems: ChecklistItem[];
  frequency: Frequency;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistCompletion {
  id: string;
  formulaCheckId: string;
  completedById: string;
  completedItems: Array<{
    itemId: string;
    completed: boolean;
    completedAt: Date;
  }>;
  notes?: string;
  passedValidation: boolean;
  completedAt: Date;
  createdAt: Date;
}
