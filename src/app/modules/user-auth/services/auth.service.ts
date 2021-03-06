import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { environment } from '@acm-environments/environment';
import { User } from '../models/Users.model';

@Injectable()
export class AuthService {
  private signUpEP: string = `${environment.host}/api/users/register`;
  private loginEP: string = `${environment.host}/api/users/login`;
  private forgotEP: string = `${environment.host}/api/users/forgot`;
  private resetEP: string = `${environment.host}/api/users/reset`;
  private confirmationEP: string = `${environment.host}/api/users/confirmation`;

  private resendEP: string = `${environment.host}/api/users/confirm`;
  constructor(private http: HttpClient) {}

  public registerUser(newUser: User) {
    const headers = new HttpHeaders();
    headers.append('Content-type', 'application/json');

    // Add the map part
    const post = this.http.post(this.signUpEP, newUser, { headers: headers });

    return post;
  }

  /**
   * This will attempt to login the user
   * @param existingUser A valid login attempt
   */
  public authenticateUser(existingUser): Observable<object> {
    const headers = new HttpHeaders();
    headers.append('Content-type', 'application/json');
    return this.http.post(this.loginEP, existingUser, { headers: headers });
  }

  /**
   * Sends to fogot login endpoint which accepts only an email in the body
   */
  public forgotUser(email): Observable<object> {
    const headers = new HttpHeaders();
    headers.append(`Content-type`, `application/json`);

    const post: Observable<object> = this.http.post(
      this.forgotEP,
      { email },
      {
        headers: headers
      }
    );

    return post;
  }

  /**
   * Hits the reset POST endpoint and changes the user's password
   * @param password The new password to be replaced
   * @param token The hex token that will be used for identification
   */
  public resetPassword(userPassword, token): Observable<object> {
    const headers = new HttpHeaders();
    headers.append(`Content-type`, `application/json`);

    return this.http.post(
      `${this.resetEP}/${token}`,
      { password: userPassword },
      { headers: headers }
    );
  }

  public sendConfirmation(email): Observable<object> {
    const headers = new HttpHeaders();
    headers.append(`Content-type`, `application/json`);

    const post: Observable<object> = this.http.post(
      this.confirmationEP,
      { email },
      {
        headers: headers
      }
    );

    return post;
  }

  public resendConfirmationEmail(email, token): Observable<object> {
    const headers = new HttpHeaders();
    headers.append(`Content-type`, `application/json`);

    return this.http.post(this.resendEP, { email: email, token: token }, { headers });
  }
}
