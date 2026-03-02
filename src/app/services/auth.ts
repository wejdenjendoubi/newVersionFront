import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

interface JwtPayload {
  sub: string;
  authorities?: string[];
  roles?: string[];
  exp?: number;
}

export interface UserDTO {
  userName: string;
  authorities: string[];
  token?: string;
}

interface LoginResponse {
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http               = inject(HttpClient);
  private readonly router             = inject(Router);
  private readonly currentUserSubject = new BehaviorSubject<UserDTO | null>(null);
  public  readonly currentUser$       = this.currentUserSubject.asObservable();
  private readonly API_URL            = 'http://localhost:8080/api/auth';

  constructor() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const user = this.decodeToken(token);
        this.currentUserSubject.next(user);
      } catch {
        this.clearStorage();
      }
    }
  }

  login(credentials: Record<string, string>): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/signin`, credentials).pipe(
      tap((response: LoginResponse) => {
        if (response?.token) {
          localStorage.setItem('token', response.token);
          const user = this.decodeToken(response.token);
          this.currentUserSubject.next(user);
        }
      }),
      catchError((error: HttpErrorResponse) => throwError(() => error))
    );
  }

  private decodeToken(token: string): UserDTO {
    try {
      const decoded      = jwtDecode<JwtPayload>(token);
      const rolesFromToken = decoded.authorities || decoded.roles || [];
      const rolesArray: string[] = Array.isArray(rolesFromToken)
        ? rolesFromToken
        : [rolesFromToken];

      // ✅ const au lieu de let — plus d'erreur lint
      const formattedRoles = rolesArray.map((role: string) => {
        const normalized = role.trim().toUpperCase().replace(/\s+/g, '_');
        return normalized.startsWith('ROLE_') ? normalized : `ROLE_${normalized}`;
      });

      return {
        userName:    decoded.sub || '',
        authorities: formattedRoles,
        token
      };

    } catch (error) {
      console.error('Erreur de décodage du token', error);
      return { userName: '', authorities: [], token: '' };
    }
  }

  public get currentUserValue(): UserDTO | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.currentUserValue;
    if (!user?.authorities) return false;
    const target = role.toUpperCase().trim();
    const targetWithPrefix = target.startsWith('ROLE_') ? target : `ROLE_${target}`;
    return user.authorities.includes(targetWithPrefix);
  }

  public clearStorage(): void {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  logout(): void {
    const token = localStorage.getItem('token');

    if (token) {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      this.http.post(`${this.API_URL}/logout`, {}, { headers }).pipe(
        catchError(() => throwError(() => null))
      ).subscribe({
        next:  () => console.log('✅ Logout loggué en base'),
        error: () => console.warn('⚠️ Backend logout inaccessible')
      });
    }

    this.clearStorage();
    this.router.navigate(['/login']);
  }
}
