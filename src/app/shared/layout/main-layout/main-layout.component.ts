import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/header/header.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, CommonModule],
  template: `
    <div class="flex min-h-screen bg-[var(--color-surface)]">
      <!-- Sidebar -->
      <app-sidebar #sidebar />

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-h-screen transition-all duration-300"
           [class.ml-64]="!sidebar.collapsed()"
           [class.ml-20]="sidebar.collapsed()">
        <!-- Header -->
        <app-header />

        <!-- Page Content -->
        <main class="flex-1 p-6 overflow-y-auto">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class MainLayoutComponent {}
