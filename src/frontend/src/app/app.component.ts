import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-layout">
      <!-- Sidebar Navigation -->
      <nav class="sidebar">
        <div class="sidebar-header">
          <h1>🔧 DevOps Lab</h1>
        </div>
        <ul class="nav-links">
          <li>
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
              📊 Dashboard
            </a>
          </li>
          <li>
            <a routerLink="/customers" routerLinkActive="active">
              👥 Customers
            </a>
          </li>
          <li>
            <a routerLink="/labs" routerLinkActive="active">
              🧪 Lab Results
            </a>
          </li>
        </ul>
        <div class="sidebar-footer">
          <small>DevOps Training Lab v1.0</small>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      font-family: 'Inter', sans-serif;
    }

    .sidebar {
      width: 240px;
      background: #1a1a2e;
      color: #eee;
      display: flex;
      flex-direction: column;
      padding: 0;
    }

    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid #333;
    }

    .sidebar-header h1 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .nav-links {
      list-style: none;
      padding: 0;
      margin: 1rem 0;
      flex: 1;
    }

    .nav-links a {
      display: block;
      padding: 0.75rem 1.5rem;
      color: #aaa;
      text-decoration: none;
      transition: all 0.2s;
      font-size: 0.95rem;
    }

    .nav-links a:hover {
      background: #16213e;
      color: #fff;
    }

    .nav-links a.active {
      background: #0f3460;
      color: #fff;
      border-left: 3px solid #e94560;
    }

    .sidebar-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #333;
      color: #666;
    }

    .main-content {
      flex: 1;
      background: #f5f7fa;
      padding: 2rem;
      overflow-y: auto;
    }
  `],
})
export class AppComponent {}
