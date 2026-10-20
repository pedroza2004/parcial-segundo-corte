import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'pokemon/:query',
    loadComponent: () => import('./detail/detail.page').then((m) => m.DetailPage),
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];
