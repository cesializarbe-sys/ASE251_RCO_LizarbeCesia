import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './shared/layout/main-layout/main-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'auth/login',       loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'auth/login-admin', loadComponent: () => import('./features/auth/login-admin/login-admin.component').then(m => m.LoginAdminComponent) },
  { path: 'auth/register',    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard',    loadComponent: () => import('./features/dashboard/pages/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'produccion',   loadComponent: () => import('./features/produccion/produccion.component').then(m => m.ProduccionComponent) },
      { path: 'mis-campos',   loadComponent: () => import('./features/mis-campos/pages/mis-campos.component').then(m => m.MisCamposComponent) },
      { path: 'mis-datos',    loadComponent: () => import('./features/mis-datos/mis-datos.component').then(m => m.MisDatosComponent) },
      { path: 'cultivos',     loadComponent: () => import('./features/cultivos/cultivos.component').then(m => m.CultivosComponent) },
      { path: 'actividades',  loadComponent: () => import('./features/actividades/actividades.component').then(m => m.ActividadesComponent) },
      { path: 'enfermedades', loadComponent: () => import('./features/enfermedades/enfermedades.component').then(m => m.EnfermedadesComponent) },
      { path: 'calidad',      loadComponent: () => import('./features/calidad/calidad.component').then(m => m.CalidadComponent) },
      { path: 'panel-admin',  loadComponent: () => import('./features/panel-admin/panel-admin.component').then(m => m.PanelAdminComponent) },
      { path: 'configuracion', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'clientes-export', redirectTo: 'cultivos', pathMatch: 'full' },
    ]
  },
  { path: '**', redirectTo: 'auth/login' }
];
