import { Component, HostListener, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent implements OnInit {
  showFilters: boolean = true;
  showVegDropdown: boolean = false;
  selectedProducts: any[] = [];
  filterParams: any = {
    productsubcategory: [],
    productcategory: [],
    vegnonveg: [],
    brand: [],
    lifestyle: [], // Initialize lifestyle array
  };
  categories: any[] = [];
  brandFilters: any[] = [];
  lifestyleFilters: any[] = [];
  showLifestyleDropdown: boolean = false;
  showBrandDropdown: boolean = false;
  vegFilter: any = { checked: false };
  nonVegFilter: any = { checked: false };
  products: any[] = [];
  offset = 0;
  limit = 10;
  totalRecords = 0;
  loading = false;
  searchQuery: FormControl = new FormControl('');
  searchResults: any[] = [];
  s3url = 'https://poornasatya.s3.amazonaws.com/';
  groupedSearchResults: any = [];
  isSearching = false;
  showAutosuggestions: boolean = false;
  shouldReloadProducts = false;
  lifestyleId: any;
  searchTerm: any;

  constructor(
    private router: Router,
    private sharedService: SharedService,
    private activatedRoute: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.fetchFilterCategories();
    this.fetchLifestyleFilters();
    this.fetchBrandFilters();

    this.activatedRoute.queryParams.subscribe((params) => {
      this.lifestyleId = +params['lifestyleId']; // Convert to number
      if (this.lifestyleId) {
        console.log('Lifestyle ID (from ngOnInit):', this.lifestyleId); // Debugging
        this.loadProducts(true);
      }
    });
    //console.log(this.searchQuery);
    this.searchQuery.setValue('');
    this.homeSearch();
    this.searchQuery.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged()) // Avoid duplicate calls
      .subscribe((searchTerm: string) => {
        if (searchTerm.trim()) {
          this.fetchAutosuggestions(searchTerm.trim()); // Autosuggestion fetch
        }
      });
    this.loadProducts(true);
  }

  isLoggedIn(): boolean {
    const userId = sessionStorage.getItem('userId'); // Check if a userId is stored
    return !!userId; // Return true if logged in, false otherwise
  }

  homeSearch(): void {
    this.activatedRoute.queryParams.subscribe((params) => {
      const search = params['search'];
      const productId = params['productId']
      
       // Retrieve the search parameter from the URL
      if (search) {
        this.shouldReloadProducts=true
        this.searchQuery.setValue(search); // Set the form control with the search term
        this.fetchProductListing(search,productId); // Optionally, fetch products based on this search term
      } else {
        this.searchQuery.setValue(''); // Default to empty if there's no search term
      }
    });
  }



  onSearchInput(): void {
    const searchTerm = this.searchQuery.value.trim();

    if (searchTerm.length==3 ||searchTerm.length>3) {
      this.showAutosuggestions = true; // Show autosuggestions
    } else {
      this.showAutosuggestions = false; // Hide autosuggestions
      this.groupedSearchResults = [];
    }
  }

  fetchAutosuggestions(searchTerm: string,product?:any): void {
    // this.loading = true;
    if(searchTerm.length ==3 || searchTerm.length>3){
      this.sharedService.searchProducts(searchTerm, this.filterParams,product).subscribe({
        next: (response) => {
          if (response.status === 200 && response.data) {
            let distinctProductKey: any = [];
            let distinctProduct: any = [];
            response.data.data.map((value: any) => {
              if (!distinctProductKey.includes(value?.search_key)) {
                distinctProductKey.push(value?.search_key);
                distinctProduct.push(value);
              }
            });
            console.log('distinctProduct', distinctProduct);
            this.groupedSearchResults = distinctProduct; // Group by brand
          }
        },
        error: (error) => {
          console.error('Error fetching autosuggestions:', error);
        },
        complete: () => {
          this.loading = false;
        },
      });
    }    
  }

  onSearchEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      const searchTerm = this.searchQuery.value.trim();
      if (searchTerm) {
        this.shouldReloadProducts = true; // Set flag to reload products
        this.fetchProductListing(searchTerm); // Fetch products
        this.showAutosuggestions = false; // Hide autosuggestions
      }
    }
  }

  selectSuggestion(product: any): void {
    this.searchQuery.setValue(product.search_key, { emitEvent: false }); // Set the search box value
    this.showAutosuggestions = false; // Hide autosuggestions
    this.shouldReloadProducts = true; // Flag to trigger product reload
    this.fetchProductListing(product.search_key,product?.product_id); // Fetch products based on suggestion
  }

  fetchProductListing(searchTerm: string,productId?:any): void {
    let count =  this.sharedService.getSearchCount()
    if(count==10||count>10){
      this.toastr.warning('Please log in to search for products.'); // Show warning if not logged in
      return;
    }
    if (this.shouldReloadProducts && !this.loading && count!=10) { 
      this.sharedService.setSearchCount(count+1)
      this.loading = true;
      this.sharedService
        .searchProducts(searchTerm, this.filterParams,undefined,undefined,productId)
        .subscribe({
          next: (response) => {
            if (response.status === 200 && response.data) {
              this.products = response.data.data; // Update product list
              this.noDataFound = this.products.length === 0;
            } else {
              console.error(
                'Error fetching product listing:',
                response.message
              );
            }
          },
          error: (error) => {
            console.error('Error fetching product listing:', error);
          },
          complete: () => {
            this.loading = false;
          },
        });

      this.shouldReloadProducts = false;
    }
  }

  clearSearch(): void {
    this.searchQuery.setValue(''); // Clear the search input
    this.showAutosuggestions = false; // Hide autosuggestions
    this.groupedSearchResults = []; // Reset autosuggestions

    // Navigate to the current route without the 'search' parameter
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { search: null }, // Remove 'search' parameter
      queryParamsHandling: 'merge', // Merge with other query parameters if any
    });

    this.loadProducts(true); // Reload products without search filters
  }

  isKeyPresent(obj: any, key: string): boolean {
    if(obj.hasOwnProperty(key) && obj.key=="sponsored"){
      return obj.hasOwnProperty(key);
    }
    return false
  }

  // clearSearch(): void {
  //   this.searchQuery.setValue('');
  //   this.showAutosuggestions = false;
  //   this.groupedSearchResults = {};
  //   this.loadProducts();
  // }

  groupByBrand(products: any[]): { [brand: string]: any[] } {
    const grouped: { [brand: string]: any[] } = {};

    products.forEach((product) => {
      const brand = product.brand_name;
      if (!grouped[brand]) {
        grouped[brand] = [];
      }
      grouped[brand].push(product);
    });

    return grouped;
  }

  getKeys(object: { [key: string]: any[] }): string[] {
    return Object.keys(object);
  }
  toggleSelection(product: any): void {
    if (!this.isLoggedIn()) {
      this.toastr.warning('Please log in to compare products.'); // Show warning if not logged in
      return; // Prevent further action
    }

    const productId = product.product_id;
    const index = this.selectedProducts.findIndex(
      (p) => p.product_id === productId
    );

    if (index === -1) {
      if (this.selectedProducts.length < 5) {
        this.selectedProducts.push(product);
      } else {
        this.toastr.error(
          'You can select a maximum of 5 products for comparison.'
        );
      }
    } else {
      this.selectedProducts.splice(index, 1);
    }

    if (this.selectedProducts.length < 2) {
      this.toastr.warning('Select at least 2 products for comparison.');
    }
  }

  isSelected(product: any): boolean {
    return this.selectedProducts.some(
      (p) => p.product_id === product.product_id
    );
  }



  navigateToComparePage(): void {
    if (!this.isLoggedIn()) {
      this.toastr.warning('Please log in to compare products.'); // Show warning if not logged in
      return; // Prevent navigation if not logged in
    }

    const userId = sessionStorage.getItem('userId');
    if (
      this.selectedProducts.length >= 2 &&
      this.selectedProducts.length <= 5
    ) {
      const productIds = this.selectedProducts.map(
        (product) => product.product_id
      );
      const url = `/product-comparison/${userId}?productIds=${JSON.stringify(
        productIds
      )}`;
      this.router.navigateByUrl(url);
    } else {
      this.toastr.error('Select between 2 and 5 products to compare.');
    }
  }

  getButtonClass(product: any): string {
    return this.isSelected(product)
      ? 'custom-button-selected'
      : 'custom-button-default'; // Apply custom class for button
  }

  getButtonDisabled(): boolean {
    const selectedCount = this.selectedProducts.length;
    return selectedCount < 2 || selectedCount > 5; // Disable when out of range
  }
  selectProduct(product: any) {
    const index = this.selectedProducts.findIndex(
      (p) => p.id === product.product_id
    );
    if (index === -1) {
      this.selectedProducts.push(product);
    } else {
      this.selectedProducts.splice(index, 1);
    }
  }

  toggleVegDropdown() {
    this.showVegDropdown = !this.showVegDropdown;
  }

  toggleLifestyleDropdown() {
    this.showLifestyleDropdown = !this.showLifestyleDropdown;
  }

  toggleBrandDropdown() {
    this.showBrandDropdown = !this.showBrandDropdown;
  }

  showFilterOptions: boolean = false;

  toggleFilterOptions() {
    this.showFilterOptions = !this.showFilterOptions;
  }

  fetchFilterCategories(): void {
    this.sharedService.getFilterCategories().subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data) {
          this.categories = response.data.map((category: any) => ({
            id: category.id, // Include the id property
            label: category.category_name,
            checked: false,
            showSubcategories: false,
            productSubCategory: category.productSubCategory.map(
              (subcategory: any) => ({
                id: subcategory.id, // Include the id property
                label: subcategory.product_sub_category_name,
                checked: false,
              })
            ),
          }));
        } else {
          console.error('Error fetching filter categories:', response.message);
        }
      },
      error: (error: any) => {
        console.error('Error fetching filter categories:', error);
      },
    });
  }

  toggleCategory(category: any): void {
    category.checked = !category.checked;

    if (category.checked) {
      category.productSubCategory.forEach((subcategory: any) => {
        subcategory.checked = true;
      });
    } else {
      category.productSubCategory.forEach((subcategory: any) => {
        subcategory.checked = false;
      });
    }
    this.applyFilters();
  }

  filetrCateogries() {}

  toggleSubcategories(category: any): void {
    category.showSubcategories = !category.showSubcategories;
  }

  toggleSubcategory(category: any, subcategory: any): void {
    subcategory.checked = !subcategory.checked;

    // Check if all subcategories are checked
    const allSubcategoriesChecked = category.productSubCategory.every(
      (sub: any) => sub.checked
    );

    // Update the parent category's checked state accordingly
    category.checked = allSubcategoriesChecked;
    this.applyFilters();
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  truncateDescription(description: string, maxLength: number): string {
    if (description.length > maxLength) {
      return description.slice(0, maxLength) + '...';
    } else {
      return description;
    }
  }
  viewProductDetails(productId: number,productCategoryId:number): void {
    console.log("productCategoryId",productCategoryId)
    if (this.isLoggedIn()) {
      this.router.navigate(['/productDetails', productId], { queryParams: { productCategoryId: productCategoryId } });
    } else {
      this.toastr.warning('Please log in to view product details.'); // Show warning if not logged in
    }
  }

  // viewProductDetails(productId:number){
  //   if(this.isLoggedIn()){
  //     this.router.navigate(['/productDetails', productId]);
  //   }
  //   else{
  //     this.toastr.warning('Please log in to view product details.');
  //   }
    
  // }
  

  // navigateToProductPage(searchTerm: string,productId?:any): vo id {
  //   this.router.navigate(['/productsData'], {
  //     queryParams: { search: searchTerm,productId: productId},
  //   });
  // }

  fetchBrandFilters(): void {
    this.sharedService.getBrandFilters().subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data) {
          this.brandFilters = response.data;
        } else {
          console.error('Error fetching brand filters:', response.message);
        }
      },
      error: (error: any) => {
        console.error('Error fetching brand filters:', error);
      },
    });
  }

  fetchLifestyleFilters(): void {
    this.sharedService.getLifestyleFilters().subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data) {
          this.lifestyleFilters = res.data;

          // If lifestyleId is defined, mark the corresponding filter as checked
          if (this.lifestyleId) {
            const lifestyleFilter = this.lifestyleFilters.find(
              (lifestyle) => lifestyle.id === this.lifestyleId
            );

            if (lifestyleFilter) {
              lifestyleFilter.checked = true; // Mark as checked
            }
          }
          // Apply filters after updating the lifestyleFilters
          this.applyFilters(); // Apply filters after setting the correct lifestyle
        } else {
          console.error('Error fetching lifestyle filters:', res.message);
        }
      },
      error: (error: any) => {
        console.error('Error fetching lifestyle filters:', error);
      },
    });
  }

  applyFilters(): void {
    const hasLifestyleFilters = this.filterParams.lifestyle.length > 0;
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {
        lifestyleId: null,
      },
      queryParamsHandling: 'merge',
    });
    this.loadProducts(true);
  }

  clearAllFilters(): void {
    // Reset the filter parameters
    this.filterParams = {
      productsubcategory: [],
      productcategory: [],
      vegnonveg: [],
      brand: [],
      lifestyle: [],
    };

    // Uncheck all checkboxes in the filter categories
    this.categories.forEach((category) => {
      category.checked = false; // Uncheck the parent category
      category.productSubCategory.forEach(
        (subcategory: { checked: boolean }) => {
          subcategory.checked = false; // Uncheck all subcategories
        }
      );
    });

    // Uncheck all brand filters
    this.brandFilters.forEach((brand) => {
      brand.checked = false;
    });

    // Uncheck all lifestyle filters
    this.lifestyleFilters.forEach((lifestyle) => {
      lifestyle.checked = false;
    });

    // Uncheck Veg/Non-Veg filters
    this.vegFilter.checked = false;
    this.nonVegFilter.checked = false;

    // Reload products with no filters
    this.loadProducts(true); // Pass true to reset the offset and clear existing products
  }

  isAnyFilterApplied(): boolean {
    // Check if any of the filter arrays have selected items
    const hasProductCategory = this.filterParams.productcategory.length > 0;
    const hasProductSubCategory =
      this.filterParams.productsubcategory.length > 0;
    const hasBrand = this.filterParams.brand.length > 0;
    const hasLifestyle = this.filterParams.lifestyle.length > 0;
    const hasVegNonVeg = this.vegFilter.checked || this.nonVegFilter.checked;

    return (
      hasProductCategory ||
      hasProductSubCategory ||
      hasBrand ||
      hasLifestyle ||
      hasVegNonVeg
    );
  }

  noDataFound: boolean = false;

  loadProducts(resetOffset: boolean = false): void {
    if (resetOffset) {
      this.offset = 0; // Reset offset to 0 when filters are applied
      this.products = [];
    }

    if (this.loading) {
      return;
    }

    this.loading = true;

    // Construct filter parameters
    // const filterParams: any = {
    //   productsubcategory: [],
    //   productcategory: [],
    //   vegnonveg: [],
    //   brand: [],
    //   lifestyle: [], // Initialize lifestyle array
    // };
    console.log(this.categories);
    this.callCommonFilters();
    // this.categories.forEach((category) => {
    //   if (category.checked) {
    //     console.log(category);
    //     filterParams.productcategory.push(category.id); // Add category id to productcategory array if category is checked
    //   }
    //   console.log(filterParams);

    //   category.productSubCategory.forEach(
    //     (subcategory: { checked: any; id: any }) => {
    //       if (subcategory.checked) {
    //         filterParams.productsubcategory.push(subcategory.id);
    //       }
    //     }
    //   );
    // });

    // this.brandFilters.forEach((brand) => {
    //   if (brand.checked) {
    //     filterParams.brand.push(brand.id);
    //   }
    // });

    // // Iterate over lifestyle filters to collect selected IDs
    // this.lifestyleFilters.forEach((lifestyle) => {
    //   if (lifestyle.checked) {
    //     filterParams.lifestyle.push(lifestyle.id);
    //   }
    // });

    // // Remove empty lifestyle filter array if none are selected
    // if (filterParams.lifestyle.length === 0) {
    //   delete filterParams.lifestyle;
    // }

    // // Push selected options (Veg or Non-Veg) to the vegnonveg filter parameter array
    // if (this.vegFilter.checked) {
    //   filterParams.vegnonveg.push('Veg');
    // }
    // if (this.nonVegFilter.checked) {
    //   filterParams.vegnonveg.push('Non-Veg');
    // }
    if (this.searchQuery.value || this.searchTerm) {
      const searchTerm = this.searchQuery.value.trim();
      console.log(searchTerm);
      this.sharedService
        .searchProducts(
          searchTerm || this.searchTerm,
          this.filterParams,
          this.offset,
          this.limit
        )
        .subscribe({
          next: (response: any) => {
            if (response.status === 200 && response.data.data) {
              console.log('enter');
              if (resetOffset) {
                this.products = response.data.data; // Replace products when filters are applied
                this.noDataFound = this.products.length === 0;
              } else {
                this.products = [...this.products, ...response.data.data]; // Append products when loading more
                this.noDataFound = this.products.length === 0;
              }
              this.offset += this.limit;
              this.totalRecords = response.data.totalCount;
            } else {
              console.error('Error fetching products:', response.message);
              this.noDataFound = this.products.length === 0;
            }

            this.loading = false;
          },
          error: (error) => {
            console.error('Error fetching product listing:', error);
            this.noDataFound = this.products.length === 0;
          },
          complete: () => {
            this.loading = false;
          },
        });
    } else {
      this.sharedService
        .getProducts(this.offset, this.limit, this.filterParams)
        .subscribe({
          next: (response: any) => {
            if (response.status === 200 && response.data.product) {
              console.log('enter');
              if (resetOffset) {
                this.products = response.data.product; // Replace products when filters are applied
                this.noDataFound = this.products.length === 0;
              } else {
                this.products = [...this.products, ...response.data.product]; // Append products when loading more
                this.noDataFound = this.products.length === 0;
              }
              this.offset += this.limit;
              this.totalRecords = response.data.totalCount;
            } else {
              console.error('Error fetching products:', response.message);
              this.noDataFound = this.products.length === 0;
            }

            this.loading = false;
          },
          error: (error: any) => {
            console.error('Error fetching products:', error);
            this.loading = false;
            this.noDataFound = this.products.length === 0;
          },
        });
    }
    // Call the service method with filter parameters and offset
  }

  callCommonFilters(): void {
    // console.log("hi",this.filterParams.lifestyle.length)
    this.categories.forEach((category) => {
      if (category.checked) {
        // console.log(category);
        if (!this.filterParams.productcategory.includes(category.id)) {
          this.filterParams.productcategory.push(category.id);
        }

        // Add category id to productcategory array if category is checked
      } else {
        this.filterParams.productcategory =
          this.filterParams.productcategory.filter(
            (data: any) => data != category.id
          );
      }

      category.productSubCategory.forEach(
        (subcategory: { checked: any; id: any }) => {
          if (subcategory.checked) {
            if (
              !this.filterParams.productsubcategory.includes(subcategory.id)
            ) {
              this.filterParams.productsubcategory.push(subcategory.id);
            }
          } else {
            this.filterParams.productsubcategory =
              this.filterParams.productsubcategory.filter(
                (data: any) => data != subcategory.id
              );
          }
        }
      );
    });

    this.brandFilters.forEach((brand) => {
      if (brand.checked) {
        if (!this.filterParams.brand.includes(brand.id))
          this.filterParams.brand.push(brand.id);
      } else {
        this.filterParams.brand = this.filterParams.brand.filter(
          (data: any) => data != brand.id
        );
      }
    });

    // Iterate over lifestyle filters to collect selected IDs
    this.lifestyleFilters.forEach((lifestyle) => {
      if (lifestyle.checked) {
        if (!this.filterParams.lifestyle.includes(lifestyle.id))
          this.filterParams.lifestyle.push(lifestyle.id);
      } else {
        this.filterParams.lifestyle = this.filterParams.lifestyle.filter(
          (data: any) => data != lifestyle.id
        );
      }
    });

    if (
      this.lifestyleId &&
      !this.filterParams.lifestyle.includes(this.lifestyleId.toString())
    ) {
      this.filterParams.lifestyle.push(this.lifestyleId.toString());
    }

    // Remove empty lifestyle filter array if none are selected
    // if (this.filterParams.lifestyle.length === 0) {
    //   delete this.filterParams.lifestyle;
    // }

    // Push selected options (Veg or Non-Veg) to the vegnonveg filter parameter array
    if (this.vegFilter.checked) {
      this.filterParams.vegnonveg.push('Veg');
    } else {
      this.filterParams.vegnonveg = this.filterParams.vegnonveg.filter(
        (data: any) => data != 'Veg'
      );
    }
    if (this.nonVegFilter.checked) {
      this.filterParams.vegnonveg.push('Non-Veg');
    } else {
      this.filterParams.vegnonveg = this.filterParams.vegnonveg.filter(
        (data: any) => data != 'Non-Veg'
      );
    }
  }

  shouldLoadMoreProducts(): boolean {
    // Check if all products are loaded
    if (this.products.length >= this.totalRecords) {
      return false; // No need to load more products
    }

    // Check remaining scroll to determine if more products should be loaded
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop;
    const remainingScroll = documentHeight - (windowHeight + scrollTop);
    const threshold = 600;

    // Only load more products if not already loading and close to the bottom of the page
    return !this.loading && remainingScroll <= threshold;
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event: any) {
    if (this.shouldLoadMoreProducts()) {
      this.loadProducts(); // Load more products when scrolling near the bottom
    }
  }

  transformProductName(productName: string): string {
    return productName.toLowerCase().replace(/\s/g, '_');
  }
  private readonly DESCRIPTION_LIMIT = 150;

  getTruncatedDescriptionWithReadMore(description: string): string {
    if (description && description.length > this.DESCRIPTION_LIMIT) {
      // Truncate and add "Read more..." inline, avoiding ellipses
      const truncatedText = description.substring(0, this.DESCRIPTION_LIMIT);
      return `${truncatedText}`; // Add ellipses to indicate truncation
    }
    return description;
  }

  getDescriptionWithFallback(description: string | undefined): string {
    if (description && description.trim().length > 0) {
      return description.length > 50 ? description.slice(0, 50) : description;
    } else {
      return 'No description available'; // Fallback message
    }
  
  }

  // Function to determine if "Read more..." should be shown
  shouldShowReadMore(description: string): any {
    return description && description.length > this.DESCRIPTION_LIMIT; // Return true if longer than limit
  }
}
