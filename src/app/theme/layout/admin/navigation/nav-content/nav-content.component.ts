import { Component, OnInit, inject, output, signal } from '@angular/core';
import { Location, LocationStrategy, CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Assurez-vous que ces chemins sont EXACTS
import { environment } from 'src/environments/environment';
import { NavigationItem } from '../navigation'; // Vérifiez ce fichier
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NavGroupComponent } from './nav-group/nav-group.component';
import { AdminService } from 'src/app/services/admin';
import { MenuItemDTO } from 'src/app/models/user.model';

@Component({
  selector: 'app-nav-content',
  standalone: true,
  imports: [SharedModule, NavGroupComponent, CommonModule, RouterModule],
  templateUrl: './nav-content.component.html',
  styleUrls: ['./nav-content.component.scss']
})
export class NavContentComponent implements OnInit {
  private location = inject(Location);
  private locationStrategy = inject(LocationStrategy);
  private adminService = inject(AdminService);

  // Propriétés version et responsive
  title = 'CWMS Navigation';
  currentApplicationVersion = environment.appVersion;
  windowWidth: number = window.innerWidth;
  NavMobCollapse = output<void>(); // Correction : ajout du type void pour l'output

  // Initialisation du signal pour éviter le vide au démarrage
  navigation = signal<NavigationItem[]>([
  {
    id: 'test-group',
    title: 'Test Affichage',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      { id: 't1', title: 'Menu de Secours', type: 'item', url: '/user-management', icon: 'feather icon-check-circle' }
    ]
  }
]);

  ngOnInit(): void {
    this.loadDynamicNavigation();

    if (this.windowWidth < 992) {
      setTimeout(() => {
        const navbar = document.querySelector('.pcoded-navbar');
        if (navbar) navbar.classList.add('menupos-static');
      }, 500);
    }
  }

  loadDynamicNavigation(): void {
  this.adminService.getAuthorizedMenus().subscribe({
    next: (menuDTOs: MenuItemDTO[]) => {
      if (!menuDTOs || menuDTOs.length === 0) return;

      // 1. Séparer menus principaux et sous-menus
      const parentMenus = menuDTOs.filter(m => !m.parentId);
      const subMenus = menuDTOs.filter(m => m.parentId);

      // 2. Construire les NavigationItems avec leurs enfants
      const children: NavigationItem[] = parentMenus.map((m): NavigationItem => {
        const children = subMenus.filter(sub => sub.parentId === m.menuItemId);

        if (children.length > 0) {
          // Menu avec sous-menus → type 'collapse'
          return {
            id: `menu-${m.menuItemId}`,
            title: m.label,
            type: 'collapse',
            icon: m.icon || 'feather icon-circle',
            children: children.map((sub): NavigationItem => ({
              id: `menu-${sub.menuItemId}`,
              title: sub.label,
              type: 'item',
              url: sub.link,
              icon: sub.icon || 'feather icon-circle',
              classes: 'nav-item'
            }))
          };
        }

        // Menu simple → type 'item'
        return {
          id: `menu-${m.menuItemId}`,
          title: m.label,
          type: 'item',
          url: m.link,
          icon: m.icon || 'feather icon-circle',
          classes: 'nav-item'
        };
      });

      const dynamicGroup: NavigationItem = {
        id: 'dynamic-group',
        title: '',
        type: 'group',
        icon: 'icon-navigation',
        children: children
      };

      this.navigation.set([dynamicGroup]);
    },
    error: (err) => console.error('Erreur API Sidebar:', err)
  });
}

  // Correction de l'erreur navMob dans le HTML
  navMob(): void {
    if (this.windowWidth < 992) {
      this.NavMobCollapse.emit();
    }
  }

  fireOutClick(): void {
    const current_url = this.location.path();
    const ele = document.querySelector(`a.nav-link[href='${current_url}']`);
    if (ele) {
      ele.parentElement?.classList.add('active');
    }
  }
}