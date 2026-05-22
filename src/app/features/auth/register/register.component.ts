import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isLoading = signal(false);

  registerForm: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    apellidos: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    dni: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(8)]],
    telefono: [''],
    direccion: [''],
    area: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirm = control.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;
    this.isLoading.set(true);
    const f = this.registerForm.value;
    const usuario = {
      nombreCompleto: `${f.nombre} ${f.apellidos}`,
      correo: f.correo,
      password: f.password,
      dni: f.dni,
      telefono: f.telefono,
      direccion: f.direccion,
      rol: 'ENCARGADO' as const,
      area: f.area,
      estado: true
    };
    this.authService.register(usuario).subscribe({
      next: () => { this.isLoading.set(false); this.router.navigate(['/auth/login']); },
      error: () => { this.isLoading.set(false); }
    });
  }
}
