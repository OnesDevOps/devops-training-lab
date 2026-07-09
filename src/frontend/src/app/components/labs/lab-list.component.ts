import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LabService, LabResult } from '../../services/lab.service';

@Component({
  selector: 'app-lab-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>🧪 Lab Results</h2>
        <a routerLink="/labs/new" class="btn btn-primary">+ New Lab Result</a>
      </div>

      <div class="cards-grid">
        @for (lab of labResults; track lab.id) {
          <div class="lab-card">
            <div class="card-header">
              <h3>{{ lab.title }}</h3>
              <span class="badge" [class]="'badge-' + lab.status">{{ lab.status }}</span>
            </div>
            <p class="card-desc">{{ lab.description || 'No description' }}</p>
            <div class="card-meta">
              <span>🕐 {{ lab.createdAt | date:'medium' }}</span>
              @if (lab.customerId) {
                <span>👤 Customer #{{ lab.customerId }}</span>
              }
            </div>
            <div class="card-actions">
              <button (click)="deleteLab(lab)" class="btn btn-sm btn-danger">Delete</button>
            </div>
          </div>
        }
      </div>

      @if (labResults.length === 0) {
        <p class="empty-state">No lab results yet. <a routerLink="/labs/new">Create your first one</a></p>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; }

    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1rem; }

    .lab-card {
      background: #fff; border-radius: 12px; padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: transform 0.2s;
    }
    .lab-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

    .card-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem; }
    .card-header h3 { margin: 0; font-size: 1.1rem; }
    .card-desc { color: #666; font-size: 0.9rem; margin: 0.5rem 0; }
    .card-meta { display: flex; gap: 1rem; font-size: 0.8rem; color: #888; margin-top: 0.75rem; }
    .card-actions { margin-top: 1rem; display: flex; gap: 0.5rem; }

    .badge { padding: 0.2rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }
    .badge-pending { background: #fff3cd; color: #856404; }
    .badge-in_progress { background: #cce5ff; color: #004085; }
    .badge-completed { background: #d4edda; color: #155724; }
    .badge-failed { background: #f8d7da; color: #721c24; }

    .btn { padding: 0.4rem 0.8rem; border-radius: 6px; text-decoration: none; font-size: 0.85rem; cursor: pointer; border: none; }
    .btn-primary { background: #0f3460; color: #fff; }
    .btn-sm { font-size: 0.8rem; }
    .btn-danger { background: #e94560; color: #fff; }
    .empty-state { text-align: center; padding: 3rem; color: #888; }
  `],
})
export class LabListComponent implements OnInit {
  labResults: LabResult[] = [];

  constructor(private labService: LabService) {}

  ngOnInit(): void {
    this.labService.getAll().subscribe(data => this.labResults = data);
  }

  deleteLab(lab: LabResult): void {
    if (confirm(`Delete lab result "${lab.title}"?`)) {
      this.labService.delete(lab.id!).subscribe(() => {
        this.labResults = this.labResults.filter(l => l.id !== lab.id);
      });
    }
  }
}
