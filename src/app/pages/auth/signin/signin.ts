import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Field, form, required } from '@angular/forms/signals';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { AuthService } from 'src/app/services/auth';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule, Field],
  templateUrl: './signin.html',
  styleUrls: ['./signin.scss']
})
export class SignInComponent {
  private cd = inject(ChangeDetectorRef);
  private router = inject(Router);
  private authService = inject(AuthService);

  submitted = signal(false);
  error = signal('');
  showPassword = signal(false);
  isLoading = signal(false);

  // Nouveau : Gestion des tentatives
  attemptsLeft = signal(3);
  isBlocked = signal(false);

  loginModal = signal({
    username: '',
    password: ''
  });

  loginForm = form(this.loginModal, (schemaPath) => {
    required(schemaPath.username, { message: 'Nom d\'utilisateur requis' });
    required(schemaPath.password, { message: 'Mot de passe requis' });
  });

  onSubmit(event: Event) {
    event.preventDefault();

    // Si déjà bloqué, on ne fait rien
    if (this.isBlocked()) {
      this.error.set('Compte temporairement bloqué suite à trop d\'échecs.');
      return;
    }

    this.submitted.set(true);
    this.error.set('');

    const data = this.loginModal();

    if (data.username.trim() !== '' && data.password.trim() !== '') {
      this.isLoading.set(true);

      this.authService.login(data).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.attemptsLeft.set(3); // Réinitialisation en cas de succès
          this.router.navigate(['/dashboard-v1']);
        },
        error: (backendError) => {
          this.isLoading.set(false);

          // Décrémenter les tentatives sur erreur 401
          if (backendError.status === 401) {
            this.attemptsLeft.update(v => v - 1);

            if (this.attemptsLeft() <= 0) {
              this.isBlocked.set(true);
              this.error.set('Accès bloqué : 3 tentatives échouées.');
            } else {
              this.error.set(`Identifiants incorrects. Il vous reste ${this.attemptsLeft()} tentative(s).`);
            }
          } else {
            this.error.set('Utilisateur non enregistré ou erreur serveur.');
          }

          this.cd.detectChanges();
        }
      });
    } else {
      this.error.set('Veuillez remplir correctement les champs.');
    }
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }
}
