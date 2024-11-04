import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  HostListener,
  ElementRef,
  Renderer2,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { trigger, transition, style, animate } from '@angular/animations';
import { SharedService } from '../services/shared.service';
import { LoaderService } from '../services/loader.service';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { COLOR_PALETTE } from 'src/assets/color-constants';
import { GeolocationService } from '../services/geolocation.service';
import { ToastrService } from 'ngx-toastr';
import { CarouselComponent } from 'ngx-bootstrap/carousel';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
  animations: [
    trigger('slideAnimation', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate('50ms ease-out', style({ transform: 'translateX(0%)' })),
      ]),
      transition(':leave', [
        animate('50ms ease-in', style({ transform: 'translateX(100%)' })),
      ]),
    ]),
  ],
})
export class LandingComponent implements OnInit, OnDestroy, AfterViewInit {
  emailControl: FormControl = new FormControl('');
  constructor(
    private modalService: BsModalService,
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private sharedService: SharedService,
    private loaderService: LoaderService,
    private router: Router,
    private geolocationService: GeolocationService,
    private toastr: ToastrService
  ) {}
  activeSlideIndex = 0;
  lifestyleCategories: any[] = [];
  showSeeAll = true;
  filteredCategories:any[] = []
  banner: any;
  isLoading = false;
  trending: any;
  pairs: any[] = [];
  displayedTrending: any[] = [];
  displayLimit: number = 5;
  s3Url = 'https://poornasatya.s3.amazonaws.com/';
  colors = COLOR_PALETTE;
  location: { latitude: number; longitude: number; address?: string } | null =
    null;
  @ViewChild('carousel', { static: false }) carousel!: CarouselComponent;

  searchQuery: FormControl = new FormControl('');
  showAutosuggestions: boolean = false;
  groupedSearchResults: any = [];
  loading: boolean = false;

  ngOnInit(): void {
    this.hideIndicators();
    this.setSlidesPerView(window.innerWidth);
    window.addEventListener('resize', this.onResize.bind(this));
    this.getBannerData();
    this.getTrending();
    this.getLifestyleCategories();
    this.searchQuery.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => {
        if (searchTerm.trim().length == 3 || searchTerm.trim().length > 3) {
          this.fetchAutosuggestions(searchTerm.trim());
        }
      });
    this.fetchPopularComparisons();
    this.geolocationService.getLocation().subscribe(
      (location) => {
        this.location = location; // Store the location with resolved address
        console.log('Location:', location); // Output the resolved location
      },
      (error) => {
        console.error('Error fetching location:', error);
      }
    );
  }

  ngAfterViewInit(): void {
    // Simulate a slide movement to initialize the carousel
    setTimeout(() => {
      this.nextSlide();
    }, 1000);
  }

  onSearchInput(): void {
    const searchTerm = this.searchQuery.value.trim();

    if (searchTerm) {
      if (searchTerm?.length == 3 || searchTerm?.length > 3) {
        this.showAutosuggestions = true; // Show autosuggestions if there's a valid search term
      }
    } else {
      this.showAutosuggestions = false; // Hide autosuggestions if search term is empty
    }
  }

  getKeys(object: { [key: string]: any[] }): string[] {
    return Object.keys(object);
  }

  clearSearch(): void {
    this.searchQuery.setValue('');
    this.showAutosuggestions = false;
    this.groupedSearchResults = [];
  }

  seeAllCategories():void{
    this.filteredCategories = this.lifestyleCategories;
    this.showSeeAll = false;
    console.log('the catef', this.filteredCategories)
  }

  fetchAutosuggestions(searchTerm: string): void {
    this.loading = true; // Start the spinner

    this.sharedService.searchProducts(searchTerm).subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data) {
          const distinctProductKey: any[] = [];
          const distinctProduct: any[] = [];

          response.data.data.forEach((value: any) => {
            if (!distinctProductKey.includes(value?.search_key)) {
              distinctProductKey.push(value?.search_key);
              distinctProduct.push(value);
            }
          });

          this.groupedSearchResults = distinctProduct; // Update autosuggestions
        }
      },
      error: (error) => {
        console.error('Error fetching autosuggestions:', error);
      },
      complete: () => {
        this.loading = false; // Stop the spinner
      },
    });
  }

  onSearchEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      const searchTerm = this.searchQuery.value.trim();
      if (searchTerm) {
        this.navigateToProductPage(searchTerm);
        this.showAutosuggestions = false; // Hide autosuggestions
      }
    }
  }

  // Handles click event on an autosuggestion
  selectSuggestion(product: any): void {
    this.searchQuery.setValue(product.search_key, { emitEvent: false }); // Set search value
    this.showAutosuggestions = false; // Hide autosuggestions
    this.navigateToProductPage(product.search_key, product?.product_id);
  }

  // Navigates to the product page with the search term
  navigateToProductPage(searchTerm: string, productId?: any): void {
    this.router.navigate(['/productsData'], {
      queryParams: { search: searchTerm, productId: productId },
    });
  }

  private hideIndicators(): void {
    const screenWidth = window.innerWidth;
    const carouselElement = this.elementRef.nativeElement;
    const indicators = carouselElement.querySelectorAll('.carousel-indicators');
    if (screenWidth < 768) {
      indicators.forEach((indicator: any) => {
        this.renderer.setStyle(indicator, 'display', 'none');
      });
    } else {
      indicators.forEach((indicator: any) => {
        this.renderer.setStyle(indicator, 'display', 'block');
      });
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.setSlidesPerView(event.target.innerWidth);
  }

  slidesPerView!: number;

  private setSlidesPerView(width: number): void {
    if (width < 768) {
      this.slidesPerView = 1;
    } else {
      this.slidesPerView = 3;
    }
    this.cdr.detectChanges();
  }

  prevSlide() {
    this.carousel.previousSlide();
  }

  nextSlide() {
    this.carousel.nextSlide();
  }

  getBannerData() {
    this.loaderService.showLoader();
    this.sharedService.getBanner().subscribe({
      next: (res) => {
        this.sharedService.setLoadingState(true);
        if (res.status == 200 && res.data) {
          this.banner = res.data[0];
          this.loaderService.hideLoader();
        } else {
          console.error('Error fetching banner details:', res.message);
          this.loaderService.hideLoader();
        }
      },
      error: (error) => {
        this.sharedService.setLoadingState(false);
        console.error('Error fetching banner details:', error);
        this.loaderService.hideLoader();
      },
      complete: () => {
        this.sharedService.setLoadingState(false);
        this.loaderService.hideLoader();
      },
    });
  }

  getTrending() {
    this.sharedService.getTrendingProducts().subscribe({
      next: (res) => {
        this.sharedService.setLoadingState(true);
        if (res.status === 200 && res.data) {
          this.trending = res.data;
          this.setDisplayLimit(this.displayLimit); // Limit the displayed items
        } else {
          console.error('Error fetching trending details:', res.message);
        }
      },
      error: (error) => {
        this.sharedService.setLoadingState(false);
        console.error('Error fetching trending details:', error);
      },
      complete: () => {
        this.sharedService.setLoadingState(false);
      },
    });
  }

  fetchPopularComparisons(): void {
    this.sharedService.getPopularComparison().subscribe({
      next: (res) => {
        if (res.status === 200 && res.data) {
          this.pairs = res.data.map((item: any, index: number) => {
            console.log('items', item);
            return {
              product1_id: item.product_id_1,
              product2_id: item.product_id_2,
              image1: `${this.s3Url}${item.product1_image}`, // Image for the first product
              image2: `${this.s3Url}${item.product2_image}`, // Image for the second product
              footer1: item.product1_product_name, // Footer text for the first product
              footer2: item.product2_product_name, // Footer text for the second product
              color: this.generateRandomColor(index), // Get a color from the palette
            };
          });
        } else {
          console.error(
            'Error fetching Popular Comparison details:',
            res.message
          );
        }
      },
      error: (error) => {
        console.error('Error fetching Popular Comparison details:', error);
      },
    });
  }

  generateRandomColor(index: number): string {
    return COLOR_PALETTE[index % COLOR_PALETTE.length]; // Ensure index is within bounds
  }

  setDisplayLimit(limit: number) {
    // Set the number of items to display based on the limit
    this.displayedTrending = this.trending.slice(0, limit);
  }

  getLifestyleCategories() {
    this.sharedService.getLifestyleFilters().subscribe({
      next: (res) => {
        if (res.status === 200 && res.data) {
          this.lifestyleCategories = res.data;
          this.filteredCategories = this.lifestyleCategories.slice(0,3);
        } else {
          console.error('Error fetching lifestyle categories:', res.message);
        }
      },
      error: (error) => {
        console.error('Error fetching lifestyle categories:', error);
      },
    });
  }

  navigateToLifestyle(lifestyleId: number): void {
    this.router.navigate(['/productsData'], { queryParams: { lifestyleId } });
  }

  onProductClick(productId: number): void {
    const userId = sessionStorage.getItem('userId');
    console.log(productId);
    if (userId) {
      this.router.navigate(['/productDetails', productId]); // Navigate to product details
    } else {
      this.toastr.warning('Please log in to view product details.'); // Show warning if not logged in
    }
  }

  navigateToComparePage(productId1: any, productId2: any): void {
    const userId = sessionStorage.getItem('userId');
    const productIds: any = [];
    productIds.push(productId1);
    productIds.push(productId2);

    const url = `/product-comparison/${userId}?productIds=${JSON.stringify(
      productIds
    )}`;
    this.router.navigateByUrl(url);
  }

  subsloading: boolean = false;
  onSubscribe(): void {
    const email = this.emailControl.value;

    if (!email || !this.validateEmail(email)) {
      this.toastr.error('Please enter a valid email address.');
      return;
    }

    this.subsloading = true;

    this.sharedService.subscribeEmail(email).subscribe({
      next: (response: any) => {
        this.subsloading = false;
        if (response.status === 200) {
          this.toastr.success('Successfully subscribed.');
          this.emailControl.setValue(''); // Clear the input field
        } else {
          this.toastr.error(
            response.message || 'Failed to subscribe. Please try again.'
          );
        }
      },
      error: (error) => {
        this.subsloading = false;
        console.error('Error subscribing:', error);
        this.toastr.error(
          error.error?.message || 'Failed to subscribe. Please try again.'
        );
      },
    });
  }

  validateEmail(email: string): boolean {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.hideIndicators.bind(this));
  }
}
