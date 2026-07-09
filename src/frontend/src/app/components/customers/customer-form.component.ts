import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerService, Customer } from '../../services/customer.service';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>{{ isEditing ? 'Edit Customer' : 'New Customer' }}</h2>
      </div>

      <form (ngSubmit)="onSubmit()" class="form-card">
        <div class="form-group">
          <label for="name">Name *</label>
          <input id="name" type="text" [(ngModel)]="customer.name" name="name" required
                 placeholder="Enter customer name" class="form-input" />
        </div>

        <div class="form-group">
          <label for="email">Email *</label>
          <input id="email" type="email" [(ngModel)]="customer.email" name="email" required
                 placeholder="customer@example.com" class="form-input" />
        </div>

        <div class="form-group">
          <label for="phone">Phone</label>
          <input id="phone" type="text" [(ngModel)]="customer.phone" name="phone"
                 placeholder="+94 77 123 4567" class="form-input" />
        </div>

        <div class="form-group">
          <label for="address">Address</label>
          <textarea id="address" [(ngModel)]="customer.address" name="address"
                    placeholder="Enter address" rows="3" class="form-input"></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            {{ isEditing ? 'Update' : 'Create' }}
          </button>
          <a routerLink="/customers" class="btn btn-cancel">Cancel</a>
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
export class CustomerFormComponent implements OnInit {
  customer: Customer = { name: '', email: '' };
  isEditing = false;
  errorMessage = '';

  constructor(
    private customerService: CustomerService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.customerService.getById(+id).subscribe(
        data => this.customer = data,
        () => this.errorMessage = 'Customer not found',
      );
    }
  }

  onSubmit(): void {
    this.errorMessage = '';

    const action = this.isEditing
      ? this.customerService.update(this.customer.id!, this.customer)
      : this.customerService.create(this.customer);

    action.subscribe({
      next: () => this.router.navigate(['/customers']),
      error: (err) => this.errorMessage = err.error?.error || 'An error occurred',
    });
  }
}
