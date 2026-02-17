export type IssueStatus = 'pending' | 'seen' | 'progress' | 'completed';

export type IssueDepartment =
  | 'municipal'
  | 'panchayat'
  | 'town_panchayat'
  | 'corporation'
  | 'water'
  | 'energy'
  | 'pwd';

export type IssueCategory =
  | 'road_damage'
  | 'streetlight'
  | 'drainage'
  | 'garbage'
  | 'water_supply'
  | 'electricity'
  | 'public_property'
  | 'other';

export interface CivicIssue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  department: IssueDepartment;
  status: IssueStatus;
  location: string;
  latitude?: number;
  longitude?: number;
  imageUrl: string;
  solvedImageUrl?: string;
  userId: string;
  userName: string;
  citizenEmail?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  city: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  city: string;
  avatar?: string;
}

export const departmentLabels: Record<IssueDepartment, string> = {
  municipal: 'Municipality',
  panchayat: 'Panchayat',
  town_panchayat: 'Town Panchayat',
  corporation: 'Corporation',
  water: 'Water Department',
  energy: 'Energy Department',
  pwd: 'PWD',
};

export const categoryLabels: Record<IssueCategory, string> = {
  road_damage: 'Road Damage',
  streetlight: 'Street Light',
  drainage: 'Drainage',
  garbage: 'Garbage',
  water_supply: 'Water Supply',
  electricity: 'Electricity',
  public_property: 'Public Property',
  other: 'Other',
};

export const statusLabels: Record<IssueStatus, string> = {
  pending: 'Pending',
  seen: 'Seen',
  progress: 'In Progress',
  completed: 'Completed',
};
