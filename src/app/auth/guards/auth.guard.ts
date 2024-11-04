import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  canActivate(): boolean {
    const isLoggedIn = this.authService.checkLoggedIn();
    if (!isLoggedIn) {
      this.toastr.warning('Please log in to access this page.'); // Show the toastr warning
      this.router.navigate(['/login']); // Redirect to the login page
      return false;
    }
    return true;
  }
}
