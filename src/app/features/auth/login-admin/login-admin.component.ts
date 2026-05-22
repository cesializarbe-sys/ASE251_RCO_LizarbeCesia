import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-admin.component.html'
})
export class LoginAdminComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');

  loginForm: FormGroup = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.isLoading.set(true);
    this.errorMessage.set('');
    const { correo, password } = this.loginForm.value;
    this.authService.loginAdmin({ correo, password }).subscribe({
      next: () => { this.isLoading.set(false); this.router.navigate(['/dashboard']); },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Credenciales inválidas o sin permisos de administrador.');
      }
    });
  }
}
