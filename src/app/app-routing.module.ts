
import { NgModule} from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminComponent } from './theme/layout/admin/admin.component';
import { GuestComponent } from './theme/layout/guest/guest.component';
import { SignInComponent } from './pages/auth/signin/signin';
import { UserManagement } from './pages/admin/user-management/user-management';

// ATTENTION : Vérifiez bien si votre fichier s'appelle auth.guard ou auth-guard
import { AuthGuard } from './guards/auth-guard';
import { RolePermissions } from './pages/role-permissions/role-permissions';
import { MenuManagement } from './pages/menu-management/menu-management';
import { AuditListComponent } from './features/audit/audit-list/audit-list';


const routes: Routes = [
  {
    path: '',
    component: GuestComponent,
    children: [
      { path: 'login', component: SignInComponent },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  {
    path: '',
    component: AdminComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard-v1',
        loadComponent: () => import('./pages/dashboard-v1/dashboard-v1').then((c) => c.DashboardV1)
      },
      {
        path: 'user-management',
        component: UserManagement,
        canActivate: [AuthGuard]
      },
      {
      path: 'role-permissions',
      component: RolePermissions
    },
    {path: 'menu-management',
    component: MenuManagement
    },
    {
    path: 'audit',
    component: AuditListComponent,
    canActivate: [AuthGuard]
    },
    


    ]
  },
  { path: '**', redirectTo: 'login' }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
