// Simple in-memory user profile/preferences for demo purposes.
export type Theme = 'light' | 'dark';
export type User = {
  id: string;
  username: string;
  email: string;
  bio: string;
  avatarUrl?: string;
  isPublic: boolean;
  emailNotifications: boolean;
  theme: Theme;
};

let user: User = {
  id: 'u1',
  username: 'packpal-user',
  email: 'user@example.com',
  bio: 'Traveler. Planner. Pack lighter, live fuller.',
  avatarUrl: '',
  isPublic: true,
  emailNotifications: true,
  theme: 'dark',
};

export function getUser(): User {
  return { ...user };
}

export function updateUser(partial: Partial<Omit<User, 'id'>>): User {
  user = { ...user, ...partial };
  return getUser();
}
