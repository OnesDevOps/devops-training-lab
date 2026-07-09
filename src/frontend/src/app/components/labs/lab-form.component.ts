import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LabService, CreateLabRequest } from '../../services/lab.service';

@Component({
  selector: 'app-lab-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>New Lab Result</h2>
      </div>

      <form (ngSubmit)="onSubmit()" class="form-card">
        <div class="form-group">
          <label for="title">Title *</label>
          <input id="title" type="text" [(ngModel)]="labRequest.title" name="title" required
                 placeholder="Lab result title" class="form-input" />
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" [(ngModel)]="labRequest.description" name="description"
                    placeholder="Describe the lab test..." rows="4" class="form-input"></textarea>
        </div>

        <div class="form-group">
          <label for="customerId">Customer ID (optional)</label>
          <input id="customerId" type="number" [(ngModel)]="labRequest.customerId" name="customerId"
                 placeholder="Link to a customer" class="form-input" />
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Create</button>
          <a routerLink="/labs" class="btn btn-cancel">Cancel</a>
        </div>

        @if (errorMessage) {
          <div class="error-message">{{ errorMessage }}</div>
        }
      </form>
    </div>
  `,
  styles: [`
    .form-card {
      background: #fff; border-radius: 12px; padding: 2rem;
      max-width: 600px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .form-group { margin-bottom: 1.25rem; }
    .form-group label { display: block; margin-bottom: 0.4rem; font-weight: 500; color: #333; }
    .form-input {
      width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ddd;
      border-radius: 8px; font-size: 0.95rem; font-family: inherit;
    }
    .form-input:focus { outline: none; border-color: #0f3460; box-shadow: 0 0 0 2px rgba(15,52,96,0.1); }
    .form-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
    .btn { padding: 0.6rem 1.2rem; border-radius: 8px; font-size: 0.95rem; cursor: pointer; border: none; text-decoration: none; }
    .btn-primary { background: #0f3460; color: #fff; }
    .btn-cancel { background: #e8ecf1; color: #333; }
    .error-message { margin-top: 1rem; padding: 0.75rem; background: #f8d7da; color: #721c24; border-radius: 8px; }
    .page-header h2 { margin: 0 0 1.5rem; }
  `],
})
export class LabFormComponent {
  labRequest: CreateLabRequest = { title: '' };
  errorMessage = '';

  constructor(
    private labService: LabService,
    private router: Router,
  ) {}

  onSubmit(): void {
    this.errorMessage = '';
    this.labService.create(this.labRequest).subscribe({
      next: () => this.router.navigate(['/labs']),
      error: (err) => this.errorMessage = err.error?.error || 'An error occurred',
    });
  }
}
