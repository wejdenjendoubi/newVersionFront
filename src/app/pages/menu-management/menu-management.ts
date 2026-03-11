import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { AdminService } from 'src/app/services/admin';
import { MenuItemDTO, ApiResponse } from 'src/app/models/user.model';

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  templateUrl: './menu-management.html'
})
export class MenuManagement implements OnInit {
  private adminService = inject(AdminService);

  menus = signal<MenuItemDTO[]>([]);
  displayModal = false;
  isEditMode = false;
  isSubMenu = false; // ← nouveau

  newMenu: MenuItemDTO = {
    menuItemId: 0,
    label: '',
    icon: '',
    link: '',
    isTitle: 0,
    isLayout: 0,
    parentId: null
  };

  ngOnInit() { this.loadMenus(); }

  loadMenus() {
    this.adminService.getAllMenuItems().subscribe({
      next: (res: ApiResponse<MenuItemDTO[]>) => this.menus.set(res.data || []),
      error: (err) => console.error("Erreur de chargement", err)
    });
  }

  openAddModal() {
    this.isEditMode = false;
    this.isSubMenu = false;
    this.resetForm();
    this.displayModal = true;
  }

  openEditModal(item: MenuItemDTO) {
    this.isEditMode = true;
    this.isSubMenu = item.parentId != null;
    this.newMenu = { ...item };
    this.displayModal = true;


  console.log('🔍 Edit item:', this.newMenu); // ← ajoutez ceci
  console.log('🔍 menuItemId:', this.newMenu.menuItemId);
  this.displayModal = true;
  }

  onSubMenuToggle() {
    if (!this.isSubMenu) {
      this.newMenu.parentId = null; // reset si on déselectionne sous-menu
    }
  }

  deleteMenu(id: number) {
    if (confirm('Supprimer cet élément ?')) {
      this.adminService.deleteMenuItem(id).subscribe({
        next: () => { this.loadMenus(); alert("Menu supprimé !"); },
        error: (err) => console.error("Erreur suppression", err)
      });
    }
  }

  submitMenu() {
    const payload = { ...this.newMenu };
    if (!this.isSubMenu) payload.parentId = null;

    console.log('🔍 Payload envoyé:', payload); // ← et ceci
  console.log('🔍 URL appelée:', `menu-items/${payload.menuItemId}`);

    const request = this.isEditMode
      ? this.adminService.updateMenuItem(payload.menuItemId, payload)
      : this.adminService.createMenuItem(payload);

    request.subscribe({
      next: () => {
        this.displayModal = false;
        this.loadMenus();
        this.resetForm();
        alert(this.isEditMode ? "Menu modifié !" : "Menu ajouté !");
      },
      error: (err) => console.error("Erreur lors de l'envoi", err)
    });
  }

  resetForm() {
    this.newMenu = { menuItemId: 0, label: '', icon: '', link: '', isTitle: 0, isLayout: 0, parentId: null };
    this.isSubMenu = false;
  }

  // Menus disponibles comme parents (exclure le menu en cours d'édition)
  get parentMenuOptions(): MenuItemDTO[] {
    return this.menus().filter(m => m.menuItemId !== this.newMenu.menuItemId && !m.parentId);
  }

  getParentLabel(parentId: number): string {
  const parent = this.menus().find(m => m.menuItemId === parentId);
  return parent ? parent.label : `#${parentId}`;
}
}