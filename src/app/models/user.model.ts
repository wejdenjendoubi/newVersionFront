export interface Role {
  roleId?: number;
  roleName: string;
  description?: string;
}

export interface Site {
  idSite?: number;
  siteName: string;
}

export interface UserDTO {
  Id?: number;
  id?: number;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
  siteName?: string;
  isActive?: number;
  authorities: string[];
}

// Nouvelle interface pour le menu
export interface MenuItemDTO {
  menuItemId: number;
  label: string;
  icon: string;
  link: string;
  parentId?: number | null;
  isTitle?: number;
  isLayout?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
