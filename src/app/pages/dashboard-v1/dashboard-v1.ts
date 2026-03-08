import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { AdminService } from 'src/app/services/admin';
import { AuthService } from 'src/app/services/auth';
import { UserDTO, Role, Site } from 'src/app/models/user.model';
import { DashboardCard } from '../admin/dashboard-card-management/dashboard-card-management';


const STORAGE_KEY = 'cwms_dashboard_cards';

@Component({
  selector: 'app-dashboard-v1',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './dashboard-v1.html',
  styleUrl: './dashboard-v1.scss',
})
export class DashboardV1 implements OnInit {
  private router       = inject(Router);
  private adminService = inject(AdminService);
  private authService  = inject(AuthService);

  private allUsers = signal<UserDTO[]>([]);
  private allRoles = signal<Role[]>([]);
  private allSites = signal<Site[]>([]);

  visibleCards = signal<(DashboardCard & { resolvedValue: string; resolvedSubValue: string })[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    const userRoles = this.authService.currentUserValue?.authorities ?? [];
    let usersLoaded = false;
    let rolesLoaded = false;

    const tryBuild = () => {
      if (usersLoaded && rolesLoaded) {
        this.buildVisibleCards(userRoles);
        this.isLoading.set(false);
      }
    };

    this.adminService.getUsers().subscribe({
      next: (u) => { this.allUsers.set(u); usersLoaded = true; tryBuild(); },
      error: ()  => { usersLoaded = true; tryBuild(); }
    });

    this.adminService.getRoles().subscribe({
      next: (r) => { this.allRoles.set(r); rolesLoaded = true; tryBuild(); },
      error: ()  => { rolesLoaded = true; tryBuild(); }
    });

    this.adminService.getSites().subscribe({
      next: (s) => this.allSites.set(s),
      error: ()  => {}
    });
  }

  private buildVisibleCards(userRoles: string[]): void {
    let allCards: DashboardCard[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      allCards = stored ? JSON.parse(stored) : this.defaultCards();
    } catch {
      allCards = this.defaultCards();
    }

    const filtered = allCards.filter(card =>
      card.roles.some(r => userRoles.includes(r))
    );

    this.visibleCards.set(filtered.map(card => ({
      ...card,
      resolvedValue:    this.resolveValue(card.dataEndpoint, card.customValue),
      resolvedSubValue: this.resolveSubValue(card.subEndpoint, card.customSubValue)
    })));
  }

  private resolveValue(endpoint: string, custom?: string): string {
    switch (endpoint) {
      case 'users':  return this.allUsers().length.toString();
      case 'roles':  return this.allRoles().length.toString();
      case 'sites':  return this.allSites().length.toString();
      case 'custom': return custom ?? '—';
      default:       return '—';
    }
  }

  private resolveSubValue(endpoint: string, custom?: string): string {
    switch (endpoint) {
      case 'activeUsers': return this.allUsers().filter(u => u.isActive === 1).length.toString();
      case 'custom':      return custom ?? '';
      default:            return '';
    }
  }

  navigateTo(card: DashboardCard): void {
    if (card.navigateTo) this.router.navigate([card.navigateTo]);
  }

  private defaultCards(): DashboardCard[] {
    return [
      {
        id: '1', title: 'Total Users',
        icon: 'icon-users', iconBg: '#eef2ff', iconColor: '#4f6ef7',
        dataEndpoint: 'users', subLabel: 'Utilisateurs actifs',
        subEndpoint: 'activeUsers', navigateTo: '/user-management',
        roles: ['ROLE_ADMIN']
      },
      {
        id: '2', title: 'Total Rôles',
        icon: 'icon-shield', iconBg: '#fef3f2', iconColor: '#f04438',
        dataEndpoint: 'roles', subLabel: 'Rôles définis',
        subEndpoint: 'none', roles: ['ROLE_ADMIN']
      },
      {
        id: '3', title: 'Articles en stock',
        icon: 'icon-package', iconBg: '#fefce8', iconColor: '#ca8a04',
        dataEndpoint: 'custom', subLabel: 'Articles en stock',
        subEndpoint: 'none', roles: ['ROLE_ADMIN', 'ROLE_MAGASINIER']
      },
      {
        id: '4', title: 'Expéditions',
        icon: 'icon-truck', iconBg: '#f0fdf4', iconColor: '#16a34a',
        dataEndpoint: 'custom', subLabel: 'Expéditions en cours',
        subEndpoint: 'none', roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE_MAGASIN']
      }
    ];
  }
}