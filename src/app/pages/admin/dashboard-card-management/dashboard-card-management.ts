import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/theme/shared/shared.module';

export interface DashboardCard {
  id: string;
  title: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  dataEndpoint: string;
  customValue?: string;
  subLabel: string;
  subEndpoint: string;
  customSubValue?: string;
  navigateTo?: string;
  roles: string[];
}

const STORAGE_KEY = 'cwms_dashboard_cards';

const AVAILABLE_ROLES = [
  'ROLE_ADMIN',
  'ROLE_RESPONSABLE_MAGASIN',
  'ROLE_VIEWER',
  'ROLE_MAGASINIER'
];

const COLOR_PRESETS = [
  { label: 'Bleu',   bg: '#eef2ff', color: '#4f6ef7' },
  { label: 'Rouge',  bg: '#fef3f2', color: '#f04438' },
  { label: 'Jaune',  bg: '#fefce8', color: '#ca8a04' },
  { label: 'Vert',   bg: '#f0fdf4', color: '#16a34a' },
  { label: 'Violet', bg: '#faf5ff', color: '#9333ea' },
  { label: 'Orange', bg: '#fff7ed', color: '#ea580c' },
];

const ENDPOINT_OPTIONS = [
  { label: 'Total Utilisateurs', value: 'users' },
  { label: 'Total Rôles',        value: 'roles' },
  { label: 'Total Sites',        value: 'sites' },
  { label: 'Valeur personnalisée', value: 'custom' },
];

const SUB_ENDPOINT_OPTIONS = [
  { label: 'Utilisateurs actifs',  value: 'activeUsers' },
  { label: 'Aucune sous-valeur',   value: 'none' },
  { label: 'Valeur personnalisée', value: 'custom' },
];

@Component({
  selector: 'app-dashboard-card-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  template: `
    <div class="row">
      <div class="col-sm-12">
        <app-card cardTitle="Gestion des Cartes Dashboard" [hidHeader]="false">

          <div class="d-flex justify-content-between align-items-center mb-4">
            <span class="text-muted small">{{ cards().length }} carte(s) configurée(s)</span>
            <button class="btn btn-primary btn-sm shadow-sm" (click)="openAddModal()">
              <i class="feather icon-plus me-1"></i> Nouvelle carte
            </button>
          </div>

          @if (cards().length === 0) {
            <div class="text-center py-5 text-muted">
              <i class="feather icon-layout" style="font-size:2.5rem;opacity:0.3"></i>
              <p class="mt-2 small">Aucune carte configurée.</p>
            </div>
          }

          <!-- Aperçu des cartes existantes -->
          <div class="row g-3">
            @for (card of cards(); track card.id) {
              <div class="col-md-6 col-xl-4">
                <div class="border rounded-3 p-3 bg-white d-flex align-items-center gap-3 position-relative">

                  <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                       [style.background]="card.iconBg"
                       style="width:44px;height:44px">
                    <i [class]="'feather ' + card.icon" [style.color]="card.iconColor" style="font-size:1.2rem"></i>
                  </div>

                  <div class="flex-grow-1 min-w-0">
                    <div class="fw-semibold text-dark small">{{ card.title }}</div>
                    <div class="text-muted" style="font-size:0.75rem">{{ card.subLabel }}</div>
                    <div class="d-flex flex-wrap gap-1 mt-1">
                      @for (role of card.roles; track role) {
                        <span class="badge bg-light text-secondary border" style="font-size:0.65rem">
                          {{ role.replace('ROLE_', '') }}
                        </span>
                      }
                    </div>
                  </div>

                  <div class="d-flex gap-1">
                    <button class="btn btn-sm btn-light" (click)="openEditModal(card)" title="Modifier">
                      <i class="feather icon-edit-2" style="font-size:0.8rem"></i>
                    </button>
                    <button class="btn btn-sm btn-light text-danger" (click)="deleteCard(card.id)" title="Supprimer">
                      <i class="feather icon-trash-2" style="font-size:0.8rem"></i>
                    </button>
                  </div>

                </div>
              </div>
            }
          </div>

        </app-card>
      </div>
    </div>

    @if (displayModal) {
      <div class="modal-backdrop fade show"></div>
      <div class="modal d-block" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow">
            <div class="modal-header border-bottom">
              <h5 class="modal-title fs-6 fw-semibold">
                {{ isEditMode ? 'Modifier la carte' : 'Nouvelle carte' }}
              </h5>
              <button type="button" class="btn-close" (click)="closeModal()"></button>
            </div>
            <div class="modal-body">
              <div class="row g-3">

                <div class="col-12">
                  <label class="form-label small fw-semibold">Titre <span class="text-danger">*</span></label>
                  <input type="text" [(ngModel)]="form.title" class="form-control form-control-sm"
                         placeholder="ex: Articles en stock">
                </div>

                <div class="col-6">
                  <label class="form-label small fw-semibold">Icône Feather</label>
                  <input type="text" [(ngModel)]="form.icon" class="form-control form-control-sm"
                         placeholder="ex: icon-package">
                </div>

                <div class="col-6">
                  <label class="form-label small fw-semibold">Couleur</label>
                  <div class="d-flex gap-2 flex-wrap mt-1">
                    @for (preset of colorPresets; track preset.label) {
                      <div class="color-dot"
                           [style.background]="preset.bg"
                           [style.border]="form.iconBg === preset.bg ? '2px solid ' + preset.color : '2px solid transparent'"
                           (click)="applyColor(preset)"
                           [title]="preset.label">
                        <i class="feather icon-box" [style.color]="preset.color" style="font-size:0.7rem"></i>
                      </div>
                    }
                  </div>
                </div>

                <div class="col-6">
                  <label class="form-label small fw-semibold">Donnée principale</label>
                  <select class="form-select form-select-sm" [(ngModel)]="form.dataEndpoint">
                    @for (e of endpoints; track e.value) {
                      <option [value]="e.value">{{ e.label }}</option>
                    }
                  </select>
                </div>

                <div class="col-6">
                  <label class="form-label small fw-semibold">Sous-label</label>
                  <input type="text" [(ngModel)]="form.subLabel" class="form-control form-control-sm"
                         placeholder="ex: Articles en stock">
                </div>

                @if (form.dataEndpoint === 'custom') {
                  <div class="col-6">
                    <label class="form-label small fw-semibold">Valeur fixe</label>
                    <input type="text" [(ngModel)]="form.customValue" class="form-control form-control-sm" placeholder="ex: 42">
                  </div>
                }

                <div class="col-6">
                  <label class="form-label small fw-semibold">Lien au clic</label>
                  <input type="text" [(ngModel)]="form.navigateTo" class="form-control form-control-sm"
                         placeholder="ex: /user-management">
                </div>

                <div class="col-12">
                  <label class="form-label small fw-semibold">Rôles autorisés <span class="text-danger">*</span></label>
                  <div class="d-flex flex-wrap gap-3 mt-1">
                    @for (role of availableRoles; track role) {
                      <div class="form-check mb-0">
                        <input class="form-check-input" type="checkbox"
                               [id]="'r_' + role"
                               [checked]="form.roles.includes(role)"
                               (change)="toggleRole(role)">
                        <label class="form-check-label small" [for]="'r_' + role">
                          {{ role.replace('ROLE_', '') }}
                        </label>
                      </div>
                    }
                  </div>
                </div>

                <!-- Aperçu mini -->
                <div class="col-12">
                  <div class="border rounded-3 p-3 d-flex align-items-center gap-3" style="background:#fafafa">
                    <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                         [style.background]="form.iconBg"
                         style="width:44px;height:44px">
                      <i [class]="'feather ' + (form.icon || 'icon-box')"
                         [style.color]="form.iconColor" style="font-size:1.2rem"></i>
                    </div>
                    <div>
                      <div class="fw-semibold text-dark small">{{ form.title || 'Titre de la carte' }}</div>
                      <div class="text-muted" style="font-size:0.75rem">{{ form.subLabel || 'Sous-label' }}</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            <div class="modal-footer border-top">
              <button class="btn btn-light btn-sm" (click)="closeModal()">Annuler</button>
              <button class="btn btn-primary btn-sm" (click)="submitCard()">
                <i class="feather icon-save me-1"></i> Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .color-dot {
      width: 28px; height: 28px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: transform 0.15s;
    }
    .color-dot:hover { transform: scale(1.15); }
  `]
})
export class DashboardCardManagement implements OnInit {
  cards = signal<DashboardCard[]>([]);
  displayModal = false;
  isEditMode = false;

  availableRoles = AVAILABLE_ROLES;
  colorPresets   = COLOR_PRESETS;
  endpoints      = ENDPOINT_OPTIONS;
  subEndpoints   = SUB_ENDPOINT_OPTIONS;

  form: DashboardCard = this.initForm();

  ngOnInit() { this.loadCards(); }

  loadCards() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      this.cards.set(stored ? JSON.parse(stored) : this.defaultCards());
    } catch { this.cards.set(this.defaultCards()); }
  }

  private save(cards: DashboardCard[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    this.cards.set(cards);
  }

  defaultCards(): DashboardCard[] {
    return [
      { id: crypto.randomUUID(), title: 'Total Users',     icon: 'icon-users',   iconBg: '#eef2ff', iconColor: '#4f6ef7', dataEndpoint: 'users',  subLabel: 'Utilisateurs actifs',  subEndpoint: 'activeUsers', navigateTo: '/user-management', roles: ['ROLE_ADMIN'] },
      { id: crypto.randomUUID(), title: 'Total Rôles',     icon: 'icon-shield',  iconBg: '#fef3f2', iconColor: '#f04438', dataEndpoint: 'roles',  subLabel: 'Rôles définis',         subEndpoint: 'none',        roles: ['ROLE_ADMIN'] },
      { id: crypto.randomUUID(), title: 'Articles en stock', icon: 'icon-package', iconBg: '#fefce8', iconColor: '#ca8a04', dataEndpoint: 'custom', subLabel: 'Articles en stock',    subEndpoint: 'none',        roles: ['ROLE_ADMIN', 'ROLE_MAGASINIER'] },
      { id: crypto.randomUUID(), title: 'Expéditions',     icon: 'icon-truck',   iconBg: '#f0fdf4', iconColor: '#16a34a', dataEndpoint: 'custom', subLabel: 'Expéditions en cours', subEndpoint: 'none',        roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE_MAGASIN'] },
    ];
  }

  initForm(): DashboardCard {
    return { id: '', title: '', icon: 'icon-box', iconBg: '#eef2ff', iconColor: '#4f6ef7', dataEndpoint: 'custom', subLabel: '', subEndpoint: 'none', navigateTo: '', roles: [] };
  }

  applyColor(preset: { bg: string; color: string; label: string }) {
    this.form.iconBg    = preset.bg;
    this.form.iconColor = preset.color;
  }

  toggleRole(role: string) {
    const idx = this.form.roles.indexOf(role);
    if (idx >= 0) this.form.roles.splice(idx, 1);
    else this.form.roles.push(role);
  }

  openAddModal()             { this.isEditMode = false; this.form = this.initForm(); this.displayModal = true; }
  openEditModal(c: DashboardCard) { this.isEditMode = true;  this.form = { ...c, roles: [...c.roles] }; this.displayModal = true; }
  closeModal()               { this.displayModal = false; }

  submitCard() {
    if (!this.form.title.trim())    { alert('Le titre est obligatoire.');          return; }
    if (!this.form.icon.trim())     { alert("L'icône est obligatoire.");            return; }
    if (!this.form.roles.length)    { alert('Sélectionnez au moins un rôle.');     return; }

    const list = this.cards();
    if (this.isEditMode) this.save(list.map(c => c.id === this.form.id ? { ...this.form } : c));
    else                 this.save([...list, { ...this.form, id: crypto.randomUUID() }]);
    this.closeModal();
  }

  deleteCard(id: string) {
    if (confirm('Supprimer cette carte ?')) this.save(this.cards().filter(c => c.id !== id));
  }
}