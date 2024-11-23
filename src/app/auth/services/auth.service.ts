import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
declare const gapi: any;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://18.213.149.124:3006/user/';
  private googleAuthInstance: any;
  private clientId = '1901241770307602'; // Your Instagram OAuth client ID
  private redirectUri = 'YOUR_REDIRECT_URI'; // The redirect URI after login
  private authorizationUrl = 'https://api.instagram.com/oauth/authorize'; // Instagram OAuth2 authorization endpoint
  private tokenUrl = 'https://api.instagram.com/oauth/access_token';

  private isLoggedIn = new BehaviorSubject<boolean>(
    !!localStorage.getItem('userId')
  );
  public isLoggedIn$ = this.isLoggedIn.asObservable();

  constructor(private http: HttpClient) {}

  checkLoggedIn(): boolean {
    return !!localStorage.getItem('userId'); // Return true if there's a userId in session storage
  }

  registerUser(mobileNumber: string): Observable<any> {
    const payload = { mobileNumber: mobileNumber };
    return this.http.post<any>(this.apiUrl + 'registration', payload);
  }

  verifyRegister(
    mobileNumber: string,
    email: string,
    otp: string
  ): Observable<any> {
    const payload = { mobileNumber: mobileNumber, email: email, otp: otp };
    return this.http.post<any>(this.apiUrl + 'register-verify-otp', payload);
  }

  sendOtp(mobileNumber?: string, email?: string): Observable<any> {
    const payload = { mobileNumber: mobileNumber, email: email };
    return this.http.post<any>(this.apiUrl + 'login-send-otp', payload);
  }

  verifyOtp(mobileNumber: string, otp: string): Observable<any> {
    const payload = { mobileNumber: mobileNumber, otp: otp };
    return this.http.post<any>(this.apiUrl + 'login', payload);
  }

  getCategories(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'product-category');
  }

  createProfile(profileData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'create-profile', profileData);
  }

  getProfile(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}profile-detail/${id}`);
  }

  getAuthorizationUrl(): string {
    return `${this.authorizationUrl}?client_id=${this.clientId}&response_type=code&redirect_uri=${this.redirectUri}`;
  }

  exchangeAuthorizationCode(authorizationCode: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    const body = new URLSearchParams();
    body.append('grant_type', 'authorization_code');
    body.append('code', authorizationCode);
    body.append('client_id', this.clientId);
    body.append('redirect_uri', this.redirectUri);

    return this.http.post(this.tokenUrl, body.toString(), { headers });
  }
}
