export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  badge?: {
    title?: string;
    type?: string;
  };
  children?: NavigationItem[];
}

export const NavigationItems: NavigationItem[] = [
  {
    id: 'navigation',
    title: 'Mon Projet',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'dashboard-perso',
        title: 'Mon Dashboard CWMS',
        type: 'item',
        url: '/dashboard-v1',
        icon: 'feather icon-home',
        classes: 'nav-item'
      },
      {
        id: 'admin-management',
        title: 'Utilisateurs',
        type: 'item',
        url: '/user-management', // Doit correspondre exactement au "path" défini dans les routes
        icon: 'feather icon-users'
      },
      {
        id: 'audit-logs',
        title: 'Audit Logs',
        type: 'item',
        url: '/audit',
        icon: 'feather icon-clipboard',
        classes: 'nav-item'
      }

    ]
  },

];
