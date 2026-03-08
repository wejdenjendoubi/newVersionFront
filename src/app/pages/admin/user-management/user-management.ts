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

  // --- Signaux de données ---
  users = signal<UserDTO[]>([]);
  roles = signal<Role[]>([]);
  sites = signal<Site[]>([]);

  // --- État UI ---
  isLoading = signal(false);
  isPageLoading = signal(true);
  showModal = signal(false);
  isEditMode = signal(false);
  searchTerm = signal('');

  // --- Formulaire ---
  newUser = signal<UserDTO>(this.initUser());

  // --- Recherche filtrée ---
  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.users().filter(u =>
      u.firstName?.toLowerCase().includes(term) ||
      u.lastName?.toLowerCase().includes(term) ||
      u.roleName?.toLowerCase().includes(term) ||
      u.siteName?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData() {
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

  refreshUsers() {
    this.adminService.getUsers().subscribe({
      next: (res) => {
        this.users.set(res);
        this.isPageLoading.set(false);
      },
      error: () => this.isPageLoading.set(false)
    });
  }

  initUser(): UserDTO {
    return {
      userName: '',
      email: '',
      firstName: '',
      lastName: '',
      roleName: '',
      siteName: '',
      isActive: 1,
      authorities: []
    };
  }

  // --- Validations Locales ---
  isEmailValid(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  isNameValid(name: string): boolean {
    if (!name) return false;
    const nameRegex = /^[a-zA-ZàâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ\s\-]+$/;
    return nameRegex.test(name);
  }

  // --- Actions Modal ---
  openModal(user?: UserDTO) {
    if (user) {
      this.isEditMode.set(true);
      this.newUser.set({ ...user });
    } else {
      this.isEditMode.set(false);
      this.newUser.set(this.initUser());
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.newUser.set(this.initUser());
    this.isLoading.set(false);
  }

  // --- Sauvegarde avec gestion d'erreur d'existence email ---
  saveUser() {
    const user = this.newUser();

    // 1. Validations de format (Front-end)
    if (!this.isEmailValid(user.email)) {
      alert("Veuillez saisir une adresse e-mail au format valide.");
      return;
    }

    if (!this.isNameValid(user.firstName) || !this.isNameValid(user.lastName)) {
      alert("Le nom et le prénom ne doivent contenir que des lettres.");
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
      next: (res) => {
        this.refreshUsers();
        this.closeModal();
      },
      error: (err) => {
        this.isLoading.set(false);
        
        // --- LOGIQUE DE DÉTECTION D'ERREUR BACKEND ---
        // On vérifie si le backend a envoyé un message d'erreur spécifique (Email introuvable)
        if (err.error && err.error.message) {
          alert(err.error.message); // Affiche "L'adresse email est introuvable ou ne peut pas recevoir de messages."
        } else if (err.status === 403) {
          alert("Erreur 403 : Vous n'avez pas les permissions nécessaires.");
        } else if (err.status === 400) {
          alert("Données invalides. Veuillez vérifier les informations saisies.");
        } else {
          alert(`Une erreur est survenue lors de l'enregistrement (Code: ${err.status})`);
        }
      }
    });
  }

  confirmDelete(user: UserDTO) {
    const id = user.id ?? (user as any).userId ?? (user as any).Id;
    if (id && confirm(`Supprimer l'utilisateur ${user.firstName} ${user.lastName} ?`)) {
      this.adminService.deleteUser(id).subscribe({
        next: () => this.refreshUsers(),
        error: (err) => console.error('Erreur suppression:', err)
      });
    }
  }

  updateSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }
}