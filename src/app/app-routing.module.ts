import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { CreateUserComponent } from './create-user/create-user.component';
import { DashboardManagerComponent } from './dashboard-manager/dashboard-manager.component';
import { authGuard } from './auth.guard';
import { DashboardExecComponent } from './dashboard-exec/dashboard-exec.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'createUser', component: CreateUserComponent },
  { path: 'dashboard-manager', component: DashboardManagerComponent, canActivate: [authGuard] },
  { path: 'dashboard-exec', component: DashboardExecComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
