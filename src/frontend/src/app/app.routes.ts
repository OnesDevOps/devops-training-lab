import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'customers',
    loadComponent: () =>
      import('./components/customers/customer-list.component').then(m => m.CustomerListComponent),
  },
  {
    path: 'customers/new',
    loadComponent: () =>
      import('./components/customers/customer-form.component').then(m => m.CustomerFormComponent),
  },
  {
    path: 'customers/:id',
    loadComponent: () =>
      import('./components/customers/customer-form.component').then(m => m.CustomerFormComponent),
  },
  {
    path: 'labs',
    loadComponent: () =>
      import('./components/labs/lab-list.component').then(m => m.LabListComponent),
  },
  {
    path: 'labs/new',
    loadComponent: () =>
      import('./components/labs/lab-form.component').then(m => m.LabFormComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
