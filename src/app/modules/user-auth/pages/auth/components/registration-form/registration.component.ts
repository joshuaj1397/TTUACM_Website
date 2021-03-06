import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { FormControl, Validators } from '@angular/forms';
import { UserStateService } from '@acm-shared/services/user-state.service';
import { AuthService } from '../../../../services/auth.service';
import { UserPost, User } from '../../../../models/Users.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent {
  studentClassification = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'PhD'];
  constructor(
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    public userStateService: UserStateService
  ) {}

  // During production, remove initial value
  // This is for debugging purposes only
  public SignUpForm = new UserPost(
    {
      firstName: new FormControl('', Validators.required),
      lastName: new FormControl('', Validators.required),
      email: new FormControl('', Validators.email),
      password: new FormControl('', [Validators.minLength(8), Validators.required]),
      confirmPassword: new FormControl('', Validators.required),
      classification: new FormControl('', Validators.required)
    },
    {
      updateOn: 'blur',
      validators: Validators.required
    }
  );

  /**
   * If this form is valid, send this form to the backend for storing in the database
   * We also do a little bit of clean up
   *
   * We will strip the user's creds of trailing and leading whitespaces
   * @param post The current state of the form
   */
  attemptRegister(post: UserPost) {
    const postUser: User = {
      firstName: post.firstName.trim(),
      lastName: post.lastName.trim(),
      email: post.email.trim(),
      classification: post.classification,
      password: post.password
    };

    this.authService.registerUser(postUser).subscribe(
      data => {
        this.snackBar.open(`Please check your email for confirmation`, `Close`, {
          duration: 2000
        });
        this.userStateService.setEmail(postUser.email);
        this.userStateService.setHEXToken(data['user'].confirmEmailToken);
        this.router.navigate(['auth/confirmation']);
      },
      (err: HttpErrorResponse) => {
        console.error(err);
        if (err.status === 401) {
          this.snackBar.open(`Email has already been taken`, `Close`, { duration: 2000 });
        } else {
          this.snackBar.open(`Internal Server Error. Please try again later`, `Close`, {
            duration: 2000
          });
        }
      }
    );
  }

  /**
   * Makes sure that the passwords match
   */
  checkPasswords(post: UserPost) {
    const password: string = post.password;
    const confirmPassword: string = post.confirmPassword;
    if (password !== confirmPassword) {
      setTimeout(() => {
        this.SignUpForm.controls['confirmPassword'].setErrors({ mismatch: true });
      });
    } else {
      setTimeout(() => {
        this.SignUpForm.controls['confirmPassword'].setErrors(null);
      });
    }
  }
}
