export type TaskProfile = 'student' | 'professional' | 'entrepreneur';

export interface User {
  id: string;
  email: string;
  name: string;
  profile: TaskProfile;
  avatarUrl?: string;
  password?: string; // Stored securely in client database
}

export interface MicroTask {
  id: string;
  title: string;
  duration: number; // in minutes (e.g., 15, 20, 30)
  timeBlock: string; // e.g. "09:00 AM - 09:20 AM"
  description: string;
  completed: boolean;
}

export interface ProactiveAsset {
  id: string;
  title: string;
  type: 'email_draft' | 'outline' | 'research' | 'structure' | 'code' | 'talking_points';
  content: string; // Markdown text
  createdAt: string;
}

export interface Task {
  id: string;
  userId?: string; // Associated user
  title: string;
  description: string;
  dueDate: string; // ISO or YYYY-MM-DDTHH:MM
  estimatedEffort: number; // in hours
  impact: 'low' | 'medium' | 'high';
  profile: TaskProfile;
  status: 'pending' | 'in_progress' | 'completed';
  
  // AI Generated fields (proactively updated)
  priorityScore?: number; // 0-100
  priorityExplanation?: string;
  microTasks?: MicroTask[];
  proactiveAssets?: ProactiveAsset[];
}

export interface ChatMessage {
  id: string;
  userId?: string; // Associated user
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}
