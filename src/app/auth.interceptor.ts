import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpHeaders,
} from '@angular/common/http';
import { SharedService } from './services/shared.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private sharedService: SharedService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler) {
    const token = this.sharedService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    const modifiedRequest = request.clone({ headers });

    return next.handle(modifiedRequest);
  }
}
