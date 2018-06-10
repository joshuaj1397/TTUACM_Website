import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {

  }

  // Checks to see if the user is logged in. If not, it will redirect to Login
  canActivate() {
    if (this.authService.loggedIn()) {
      return true;
    } else {
      this.snackBar.open(`Unauthorized`, 'Close', { duration: 4000 });
      this.router.navigate(['/login']);
    }
  }
}
