import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario } from '../models/usuario.model';

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly TOKEN_KEY = 'arona_token';
  private readonly USER_KEY = 'arona_user';

  private _isAuthenticated = signal<boolean>(this.hasToken());
  private _currentUser = signal<Usuario | null>(this.getStoredUser());

  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();

  readonly userName = computed(() => this._currentUser()?.nombreCompleto ?? 'Usuario');
  readonly userRole = computed(() => this._currentUser()?.rol ?? 'ENCARGADO');
  readonly userInitials = computed(() => {
    const name = this._currentUser()?.nombreCompleto ?? '';
    const parts = name.split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  });

  constructor(private http: HttpClient, private router: Router) {}

  /**
   * Login para usuarios regulares.
   * Llama a POST /api/usuarios/login en el backend real.
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<Usuario>(`${this.apiUrl}/usuarios/login`, credentials).pipe(
      map(usuario => {
        // Generar un token simple basado en el usuario (temporal hasta implementar JWT en backend)
        const token = btoa(JSON.stringify({ id: usuario.idUsuario, correo: usuario.correo, ts: Date.now() }));
        const response: LoginResponse = { token, usuario };
        this.handleAuthSuccess(response);
        return response;
      }),
      catchError(error => {
        const message = error.error?.error || error.error?.message || 'Credenciales inválidas';
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * Login para administradores.
   * Usa el mismo endpoint pero verifica que el rol sea ADMINISTRADOR.
   */
  loginAdmin(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<Usuario>(`${this.apiUrl}/usuarios/login`, credentials).pipe(
      map(usuario => {
        if (usuario.rol !== 'ADMINISTRADOR') {
          throw new Error('Acceso denegado: se requiere rol de Administrador');
        }
        const token = btoa(JSON.stringify({ id: usuario.idUsuario, correo: usuario.correo, rol: 'ADMIN', ts: Date.now() }));
        const response: LoginResponse = { token, usuario };
        this.handleAuthSuccess(response);
        return response;
      }),
      catchError(error => {
        const message = error.error?.error || error.message || 'Credenciales inválidas o sin permisos de administrador';
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * Registro de nuevo usuario.
   */
  register(usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/usuarios`, usuario);
  }

  /**
   * Cerrar sesión.
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Obtener token almacenado.
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private handleAuthSuccess(response: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.usuario));
    this._isAuthenticated.set(true);
    this._currentUser.set(response.usuario);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): Usuario | null {
    const stored = localStorage.getItem(this.USER_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as Usuario;
      } catch {
        return null;
      }
    }
    return null;
  }
}
