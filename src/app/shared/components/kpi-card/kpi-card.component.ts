import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="arona-card p-5 hover:shadow-lg transition-all duration-200 group cursor-default">
      <div class="flex items-start justify-between mb-1">
        <span class="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          {{ label }}
        </span>
        @if (trendValue) {
          <span class="flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full"
                [class]="trendUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'">
            <span class="material-icons-outlined text-sm">
              {{ trendUp ? 'trending_up' : 'trending_down' }}
            </span>
            {{ trendValue }}
          </span>
        }
      </div>
      <div class="flex items-baseline gap-2 mt-2">
        <span class="text-3xl font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-arona-500)] transition-colors">
          {{ value }}
        </span>
        @if (unit) {
          <span class="text-sm font-medium text-[var(--color-text-secondary)]">{{ unit }}</span>
        }
      </div>
      @if (subtitle) {
        <p class="text-xs mt-2 text-[var(--color-text-muted)]">{{ subtitle }}</p>
      }
    </div>
  `
})
export class KpiCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string | number;
  @Input() unit?: string;
  @Input() subtitle?: string;
  @Input() trendValue?: string;
  @Input() trendUp = true;
}
