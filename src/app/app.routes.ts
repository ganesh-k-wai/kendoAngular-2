import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LeadMgtComponent } from './lead-mgt/lead-mgt.component';

export const routes: Routes = [
  { path: '', redirectTo: '/lead-management', pathMatch: 'full' },
  { path: 'dashboard', component: HomeComponent },
  { path: 'agent-management', component: HomeComponent },
  { path: 'calendar', component: HomeComponent },
  { path: 'ez-quote', component: HomeComponent },
  { path: 'lead-management', component: LeadMgtComponent },
  { path: 'activities', component: HomeComponent },
  { path: 'workflow', component: HomeComponent },
  { path: 'chats', component: HomeComponent },
];
