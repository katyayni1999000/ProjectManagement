export type JournalMood = 'happy' | 'neutral' | 'sad' | 'stressed' | 'excited' | 'calm';

export interface JournalEntry {
  id: string;
  ownerId: string;
  title: string;
  body: string;
  mood: JournalMood;
  entryDate: Date;
  taskId?: string;
  createdAt: Date;
  updatedAt: Date;
}
