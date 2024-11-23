import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { SharedService } from '../services/shared.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
})
export class FooterComponent implements OnInit {
  product: any;
  s3url = 'https://poornasatya.s3.amazonaws.com/';
  isLoading = false;

  constructor(private sharedService: SharedService, private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isLoading = true;
      }
      if (event instanceof NavigationEnd) {
        this.isLoading = false;
        window.scrollTo(0, 0);
      }
    });
  }

  ngOnInit(): void {
    this.loadSocialMediaDetail();
  }

  loadSocialMediaDetail(): void {
    this.sharedService.getSocialMediaLink().subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.product = response.data;
        } else {
          console.error('Error fetching product details:', response.message);
        }
      },
      error: (error) => {
        console.error('Error fetching product details:', error);
      },
    });
  }

  navigateAndScroll(route: string): void {
    this.router.navigate([route]).then(() => {
      this.isLoading = false;
      window.scrollTo(0, 0);
    });
  }
}
