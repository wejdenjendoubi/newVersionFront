import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin';
import { UserDTO, Role, Site } from '../../../models/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss',
})
export class UserManagement implements OnInit {
  private adminService = inject(AdminService);

  // --- Données ---
  users        = signal<UserDTO[]>([]);
  roles        = signal<Role[]>([]);
  sites        = signal<Site[]>([]);

  // --- État UI ---
  isLoading    = signal(false);
  isPageLoading = signal(true);
  showModal    = signal(false);
  isEditMode   = signal(false);
  searchTerm   = signal('');

  // --- Delete modal ---
  showDeleteModal = signal(false);
  deleteForce     = signal(false);
  userToDelete    = signal<UserDTO | null>(null);

  // --- Formulaire ---
  newUser = signal<UserDTO>(this.initUser());

  // --- Recherche filtrée ---
  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.users().filter(u =>
      u.firstName?.toLowerCase().includes(term) ||
      u.lastName?.toLowerCase().includes(term)  ||
      u.roleName?.toLowerCase().includes(term)  ||
      u.siteName?.toLowerCase().includes(term)  ||
      u.email?.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isPageLoading.set(true);
    this.refreshUsers();

    this.adminService.getRoles().subscribe({
      next: (res) => this.roles.set(res),
      error: (err) => console.error('Erreur rôles:', err)
    });

    this.adminService.getSites().subscribe({
      next: (res) => this.sites.set(res),
      error: (err) => console.error('Erreur sites:', err)
    });
  }

  refreshUsers(): void {
    this.adminService.getUsers().subscribe({
      next:  (res) => { this.users.set(res); this.isPageLoading.set(false); },
      error: ()    => this.isPageLoading.set(false)
    });
  }

  initUser(): UserDTO {
    return {
      userName: '', email: '', firstName: '',
      lastName: '', roleName: '', siteName: '',
      isActive: 1, authorities: []
    };
  }

  // ── Validations ──────────────────────────────────────────────

  isEmailValid(email: string): boolean {
    if (!email) return false;
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  }

  isNameValid(name: string): boolean {
    if (!name) return false;
    return /^[a-zA-ZàâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ\s\-]+$/.test(name);
  }

  // ── Modal création / édition ─────────────────────────────────

  openModal(user?: UserDTO): void {
    if (user) {
      this.isEditMode.set(true);
      this.newUser.set({ ...user });
    } else {
      this.isEditMode.set(false);
      this.newUser.set(this.initUser());
    }
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.newUser.set(this.initUser());
    this.isLoading.set(false);
  }

  saveUser(): void {
    const user = this.newUser();

    if (!this.isEmailValid(user.email)) {
      alert('Veuillez saisir une adresse e-mail au format valide.');
      return;
    }
    if (!this.isNameValid(user.firstName) || !this.isNameValid(user.lastName)) {
      alert('Le nom et le prénom ne doivent contenir que des lettres.');
      return;
    }
    if (!user.userName || !user.roleName) {
      alert("Le nom d'utilisateur et le rôle sont obligatoires.");
      return;
    }

    const idToUse = user.id ?? (user as any).userId ?? (user as any).Id;
    if (this.isEditMode() && !idToUse) {
      alert("Erreur : Impossible d'identifier l'utilisateur à modifier.");
      return;
    }

    this.isLoading.set(true);

    const obs = this.isEditMode()
      ? this.adminService.updateUser(idToUse, user)
      : this.adminService.createUser(user);

    obs.subscribe({
      next: () => { this.refreshUsers(); this.closeModal(); },
      error: (err) => {
        this.isLoading.set(false);
        if (err.error?.message) {
          alert(err.error.message);
        } else if (err.status === 400) {
          // ✅ Message spécifique email doublon retourné par le backend
          alert(err.error?.message ?? 'Données invalides. Vérifiez les informations saisies.');
        } else if (err.status === 403) {
          alert("Erreur 403 : Vous n'avez pas les permissions nécessaires.");
        } else {
          alert(`Une erreur est survenue (Code: ${err.status})`);
        }
      }
    });
  }

  // ── Modal suppression ────────────────────────────────────────

  openDeleteModal(user: UserDTO): void {
    this.userToDelete.set(user);
    this.deleteForce.set(false);
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.userToDelete.set(null);
    this.deleteForce.set(false);
  }

  confirmDelete(): void {
    const user = this.userToDelete();
    if (!user) return;

    const id = user.id ?? (user as any).userId ?? (user as any).Id;
    if (!id) return;

    const delete$ = this.deleteForce()
      ? this.adminService.forceDeleteUser(id)
      : this.adminService.deleteUser(id);

    delete$.subscribe({
      next: () => {
        this.cancelDelete();
        this.refreshUsers();
      },
      error: (err) => console.error('Erreur suppression:', err)
    });
  }

  updateSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }
}