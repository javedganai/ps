import { Component, OnInit } from '@angular/core';
import { SharedService } from '../services/shared.service';
import { LoaderService } from '../services/loader.service';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
})
export class AboutComponent implements OnInit {
  aboutSections: any[] = [];
  groupedAboutSections: { [key: number]: any[] } = {};
  s3Url = 'https://poornasatya.s3.amazonaws.com/';
  constructor(
    private sharedService: SharedService,
    private loaderService: LoaderService,
    private router: Router
  ) {}

  searchQuery: FormControl = new FormControl('');
  showAutosuggestions: boolean = false;
  groupedSearchResults: any = [];
  loading: boolean = false;

  ngOnInit(): void {
    this.fetchAboutUsDetails();
    this.getFounderDetails();
    this.searchQuery.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => {
        if (searchTerm.trim()) {
          this.fetchAutosuggestions(searchTerm.trim());
        }
      });
  }

  slides = [
    {
      title: 'Product 1',
      description: `Kushagr Madan, a student with DPS R.K. Puram, the visionary mind
      behind our portal, ignited the spark of this innovation and the
      Poorna Satya brand. His groundbreaking idea set the
      foundation for our journey towards a positive change
      in our society.`,
      imageUrl: '/assets/images/team1.png',
      name: 'Kushagr Madan',
      miniDescription: 'Founder',
    },
    {
      title: 'Product 2',
      description: `Dr. Pratichi Mishra, our healthcare expert, is committed to
      pioneering innovative solutions and awareness
      for the people of India.`,
      imageUrl: '/assets/images/team2.png',
      name: 'Dr. Pratichi Mishra',
      miniDescription: 'Program Owner',
    },
    {
      title: 'Product 3',
      description: `Accomplished Pharmaceutical Industry Promoter with interests in
      Indian and Overseas markets. Seed stage investor
       with healthcare and fintech startups.  `,
      imageUrl: '/assets/images/team3.png',
      name: 'Dev Datt Sharma',
      miniDescription: 'Promoter',
    },
    {
      title: 'Product 3',
      description: `An MBA and Masters in Psychology, she has extensive experience
      in modalities, including mental health dynamics and
      understanding of the human psyche. Investor in
      mental wellness based healthcare sector.`,
      imageUrl: '/assets/images/team4.png',
      name: 'Nidhi V Chawla',
      miniDescription: 'Promoter',
    },
  ];

  fetchAboutUsDetails(): void {
    this.loaderService.showLoader();
    this.sharedService.getAboutUsDetails().subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.aboutSections = response.data;
          this.loaderService.hideLoader();
        } else {
          this.loaderService.hideLoader();
          console.error('Error fetching About Us details:', response.message);
        }
      },
      error: (error: any) => {
        this.loaderService.hideLoader();
        console.error('Error fetching About Us details:', error);
      },
    });
  }

  getImageUrl(image: string): string {
    return `${this.s3Url}${image}`;
  }

  groupByPageAndKey(data: any[]): any {
    return data.reduce((acc: any, item: any) => {
      const pageId = item.page_id;
      if (!acc[pageId]) {
        acc[pageId] = {};
      }
      const key = item.key;
      if (!acc[pageId][key]) {
        acc[pageId][key] = [];
      }
      acc[pageId][key].push(item);
      return acc;
    }, {});
  }

  filteredKeys(pageId: any): string[] {
    return this.getAboutKey(pageId).filter((key) => {
      const section = this.aboutSections[pageId][key];
      return section && section.length > 0 && key != null;
    });
  }

  hasValidContent(pageId: number): boolean {
    const keys = this.getAboutKey(pageId);
    return keys.some((key) => this.aboutSections[pageId][key]?.length > 0);
  }

  fetchAutosuggestions(searchTerm: string): void {
    // Start the spinner
    if (searchTerm?.length == 3 || searchTerm?.length > 3) {
      this.loading = true;
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
  }

  getKeys(object: { [key: string]: any[] }): string[] {
    return Object.keys(object);
  }

  getAboutKey(pageId: number): string[] {
    return Object.keys(this.aboutSections[pageId]);
  }

  selectSuggestion(product: any): void {
    this.searchQuery.setValue(product.search_key, { emitEvent: false }); // Set search value
    this.showAutosuggestions = false; // Hide autosuggestions
    this.navigateToProductPage(product.search_key, product?.product_id);
  }

  // Navigates to the product page with the search term
  navigateToProductPage(searchTerm: string, productId: any): void {
    this.router.navigate(['/productsData'], {
      queryParams: { search: searchTerm, productId: productId },
    });
  }

  onSearchInput(): void {
    const searchTerm = this.searchQuery.value.trim();

    if (searchTerm) {
      if (searchTerm.length == 3 || searchTerm.length > 3) {
        this.showAutosuggestions = true; // Show autosuggestions if there's a valid search term
      }
    } else {
      this.showAutosuggestions = false; // Hide autosuggestions if search term is empty
    }
  }

  getPageIds(): number[] {
    return Object.keys(this.aboutSections).map((key) => parseInt(key, 10));
  }

  clearSearch(): void {
    this.searchQuery.setValue('');
    this.showAutosuggestions = false;
    this.groupedSearchResults = [];
    //this.loadProducts();
  }

  getFounderDetails(): void {
    this.sharedService.getFounderDetails().subscribe({
      next: (response) => {
        if (response.status === 200) {
          console.log('data', response.data);
          this.slides = response.data.map((item: any) => ({
            name: item.name,
            imageUrl: `${this.s3Url}${item.image}`, // Include correct base URL
            description: item.description,
            miniDescription: item.designation, // Adjust as needed
          }));
        } else {
          console.error('Error fetching founder details:', response.message);
        }
      },
      error: (error) => {
        console.error('Error fetching founder details:', error);
      },
    });
  }
}
