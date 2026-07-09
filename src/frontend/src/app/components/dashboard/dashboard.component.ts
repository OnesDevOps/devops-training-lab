import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CustomerService, Customer } from '../../services/customer.service';
import { LabService, LabResult } from '../../services/lab.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <h2>Dashboard</h2>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <span class="stat-value">{{ customers.length }}</span>
            <span class="stat-label">Customers</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🧪</div>
          <div class="stat-info">
            <span class="stat-value">{{ labResults.length }}</span>
            <span class="stat-label">Lab Results</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏳</div>
          <div class="stat-info">
            <span class="stat-value">{{ pendingCount }}</span>
            <span class="stat-label">Pending</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <span class="stat-value">{{ completedCount }}</span>
            <span class="stat-label">Completed</span>
          </div>
        </div>
      </div>

      <div class="sections-grid">
        <div class="section">
          <div class="section-header">
            <h3>Recent Customers</h3>
            <a routerLink="/customers" class="view-all">View All →</a>
          </div>
          <div class="list">
            @for (customer of customers.slice(0, 5); track customer.id) {
              <div class="list-item">
                <strong>{{ customer.name }}</strong>
                <span class="text-muted">{{ customer.email }}</span>
              </div>
            }
            @empty {
              <p class="empty-state">No customers yet. <a routerLink="/customers/new">Create one</a></p>
            }
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <h3>Recent Lab Results</h3>
            <a routerLink="/labs" class="view-all">View All →</a>
          </div>
          <div class="list">
            @for (lab of labResults.slice(0, 5); track lab.id) {
              <div class="list-item">
                <strong>{{ lab.title }}</strong>
                <span class="badge" [class]="'badge-' + lab.status">{{ lab.status }}</span>
              </div>
            }
            @empty {
              <p class="empty-state">No lab results yet. <a routerLink="/labs/new">Create one</a></p>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard h2 { margin: 0 0 1.5rem; color: #1a1a2e; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: #fff;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .stat-icon { font-size: 2rem; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.8rem; font-weight: 700; color: #1a1a2e; }
    .stat-label { font-size: 0.85rem; color: #888; }

    .sections-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .section {
      background: #fff;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section-header h3 { margin: 0; color: #1a1a2e; }
    .view-all { color: #0f3460; text-decoration: none; font-size: 0.9rem; }

    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .text-muted { color: #888; font-size: 0.9rem; }
    .empty-state { color: #888; text-align: center; padding: 2rem; }

    .badge {
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge-pending { background: #fff3cd; color: #856404; }
    .badge-in_progress { background: #cce5ff; color: #004085; }
    .badge-completed { background: #d4edda; color: #155724; }
    .badge-failed { background: #f8d7da; color: #721c24; }
  `],
})
export class DashboardComponent implements OnInit {
  customers: Customer[] = [];
  labResults: LabResult[] = [];

  get pendingCount(): number {
    return this.labResults.filter(l => l.status === 'pending').length;
  }

  get completedCount(): number {
    return this.labResults.filter(l => l.status === 'completed').length;
  }

  constructor(
    private customerService: CustomerService,
    private labService: LabService,
  ) {}

  ngOnInit(): void {
    this.customerService.getAll().subscribe(data => this.customers = data);
    this.labService.getAll().subscribe(data => this.labResults = data);
  }
}
