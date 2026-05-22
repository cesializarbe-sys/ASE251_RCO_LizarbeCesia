import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center relative overflow-hidden">
      <!-- Background -->
      <div class="absolute inset-0 bg-gradient-to-br from-green-800 via-green-600 to-yellow-500"></div>
      <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>

      <!-- Login Card -->
      <div class="relative z-10 w-full max-w-md mx-4 animate-scale-in">
        <div class="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">

          <!-- Logo -->
          <div class="text-center mb-6">
            <div class="inline-flex items-center gap-2 mb-3">
              <div class="w-10 h-10 bg-[var(--color-arona-500)] rounded-xl flex items-center justify-center">
                <span class="material-icons-outlined text-white">eco</span>
              </div>
              <span class="text-2xl font-bold text-[var(--color-arona-500)]">Arona</span>
            </div>
            <p class="text-sm text-[var(--color-text-secondary)]">Bienvenido a Sociedad Agrícola Arona S.A</p>
            <p class="text-xs text-[var(--color-text-muted)]">Gestión Agrícola</p>
          </div>

          <!-- Form -->
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Correo electrónico</label>
              <div class="relative">
                <input type="email"
                       formControlName="correo"
                       placeholder="correo&#64;arona.com.pe"
                       class="w-full px-4 py-3 bg-[var(--color-arona-50)]/50 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 focus:border-[var(--color-arona-500)] transition-all placeholder-gray-400" />
                <span class="material-icons-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">mail</span>
              </div>
              @if (loginForm.get('correo')?.touched && loginForm.get('correo')?.hasError('required')) {
                <p class="text-xs text-red-500 mt-1">El correo es requerido</p>
              }
            </div>

            <!-- Password -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-sm font-medium text-[var(--color-text-primary)]">Contraseña</label>
                <a href="#" class="text-xs text-[var(--color-arona-500)] hover:underline font-medium">¿Olvidó su contraseña?</a>
              </div>
              <div class="relative">
                <input [type]="showPassword() ? 'text' : 'password'"
                       formControlName="password"
                       placeholder="••••••••"
                       class="w-full px-4 py-3 bg-[var(--color-arona-50)]/50 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 focus:border-[var(--color-arona-500)] transition-all placeholder-gray-400" />
                <button type="button"
                        (click)="showPassword.set(!showPassword())"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer">
                  <span class="material-icons-outlined text-xl">
                    {{ showPassword() ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
              @if (loginForm.get('password')?.touched && loginForm.get('password')?.hasError('required')) {
                <p class="text-xs text-red-500 mt-1">La contraseña es requerida</p>
              }
            </div>

            <!-- Remember -->
            <div class="flex items-center gap-2">
              <input type="checkbox" id="remember" class="w-4 h-4 rounded border-gray-300 text-[var(--color-arona-500)] focus:ring-[var(--color-arona-500)]" />
              <label for="remember" class="text-sm text-[var(--color-text-secondary)]">Recordar en este dispositivo</label>
            </div>

            <!-- Submit -->
            <button type="submit"
                    [disabled]="loginForm.invalid || isLoading()"
                    class="arona-btn-primary w-full justify-center py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed">
              @if (isLoading()) {
                <span class="animate-spin material-icons-outlined text-xl">refresh</span>
              } @else {
                Iniciar Sesión
                <span class="material-icons-outlined text-xl">arrow_forward</span>
              }
            </button>
          </form>

          <!-- Error Message -->
          @if (errorMessage()) {
            <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 animate-fade-in">
              {{ errorMessage() }}
            </div>
          }

          <!-- Footer Links -->
          <div class="text-center mt-6 space-y-3">
            <p class="text-sm text-[var(--color-text-secondary)]">
              ¿No tiene cuenta?
              <a routerLink="/auth/register" class="text-[var(--color-arona-500)] font-semibold hover:underline">Registrese aquí</a>
            </p>
            <div class="flex items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]">
              <span class="material-icons-outlined text-base">admin_panel_settings</span>
              <a routerLink="/auth/login-admin" class="hover:text-[var(--color-arona-500)] transition-colors">Acceso Administrador</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');

  loginForm: FormGroup = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.isLoading.set(true);
    this.errorMessage.set('');

    const { correo, password } = this.loginForm.value;
    this.authService.login({ correo, password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Credenciales inválidas. Intente nuevamente.');
      }
    });
  }
}
