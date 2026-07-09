import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerService, Customer } from '../../services/customer.service';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>👥 Customers</h2>
        <a routerLink="/customers/new" class="btn btn-primary">+ New Customer</a>
      </div>

      <div class="search-bar">
        <input
          type="text"
          placeholder="Search by name..."
          [(ngModel)]="searchTerm"
          (input)="onSearch()"
          class="search-input"
        />
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (customer of customers; track customer.id) {
              <tr>
                <td>{{ customer.id }}</td>
                <td><strong>{{ customer.name }}</strong></td>
                <td>{{ customer.email }}</td>
                <td>{{ customer.phone || '—' }}</td>
                <td>{{ customer.createdAt | date:'medium' }}</td>
                <td class="actions">
                  <a [routerLink]="['/customers', customer.id]" class="btn btn-sm">Edit</a>
                  <button (click)="deleteCustomer(customer)" class="btn btn-sm btn-danger">Delete</button>
                </td>
              </tr>
            }
          </tbody>
        </table>

        @if (customers.length === 0) {
          <p class="empty-state">No customers found.</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; }

    .search-bar { margin-bottom: 1rem; }
    .search-input {
      width: 100%; max-width: 400px; padding: 0.6rem 1rem;
      border: 1px solid #ddd; border-radius: 8px; font-size: 0.95rem;
    }

    .table-container { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8f9fa; padding: 0.75rem 1rem; text-align: left; font-size: 0.85rem; color: #666; text-transform: uppercase; }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #f0f0f0; }
    .actions { display: flex; gap: 0.5rem; }

    .btn { padding: 0.4rem 0.8rem; border-radius: 6px; text-decoration: none; font-size: 0.85rem; cursor: pointer; border: none; }
    .btn-primary { background: #0f3460; color: #fff; }
    .btn-sm { background: #e8ecf1; color: #333; }
    .btn-danger { background: #e94560; color: #fff; }
    .empty-state { text-align: center; padding: 3rem; color: #888; }
  `],
})
export class CustomerListComponent implements OnInit {
  customers: Customer[] = [];
  searchTerm = '';

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.customerService.getAll(this.searchTerm || undefined).subscribe(
      data => this.customers = data,
    );
  }

  onSearch(): void {
    this.loadCustomers();
  }

  deleteCustomer(customer: Customer): void {
    if (confirm(`Delete customer "${customer.name}"?`)) {
      this.customerService.delete(customer.id!).subscribe(() => {
        this.customers = this.customers.filter(c => c.id !== customer.id);
      });
    }
  }
}
