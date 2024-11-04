import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class GeolocationService {
  private locationSubject = new Subject<{
    latitude: number;
    longitude: number;
    address?: string;
  }>();

  private nominatimUrl = 'https://nominatim.openstreetmap.org/reverse'; // Nominatim endpoint

  constructor(private http: HttpClient) {}

  getLocation(): Observable<{
    latitude: number;
    longitude: number;
    address?: string;
  }> {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          // Make an HTTP request to the reverse geocoding API to get the address
          this.http
            .get<any>(
              `${this.nominatimUrl}?lat=${latitude}&lon=${longitude}&format=json&zoom=18`
            )
            .pipe(
              map((response) => {
                if (response && response.display_name) {
                  return {
                    latitude,
                    longitude,
                    address: response.display_name, // Address from Nominatim
                  };
                }
                return {
                  latitude,
                  longitude,
                };
              }),
              catchError((error) => {
                console.error('Error during reverse geocoding:', error);
                throw error;
              })
            )
            .subscribe(
              (location) => this.locationSubject.next(location), // Emit the location with address
              (error) => this.locationSubject.error(error)
            );
        },
        (error) => {
          console.error('Geolocation error:', error);
          this.locationSubject.error(error);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }

    return this.locationSubject.asObservable();
  }
}
