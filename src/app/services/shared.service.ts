import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  private apiUrl = 'http://18.213.149.124:3006/';
  private isLoggedInSubject = new BehaviorSubject<{
    isLoggedIn: boolean;
    token: string | null;
    userId: string | null;
  }>(this.checkLoggedInStatus());
  private loadingSubject = new Subject<boolean>();
  SEARCH_COUNT_KEY = 'search_count';
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  userId$ = new BehaviorSubject<string | null>(null);
  constructor(private http: HttpClient) {}

  private checkLoggedInStatus(): {
    isLoggedIn: boolean;
    token: string | null;
    userId: string | null;
  } {
    // Check if token is present in session storage
    const token = sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId');
    const isLoggedIn = !!token;
    return { isLoggedIn, token, userId };
  }

  getSearchCount(): number {
    return parseInt(localStorage.getItem(this.SEARCH_COUNT_KEY) || '0', 10);
  }

  setSearchCount(count: number): void {
    localStorage.setItem(this.SEARCH_COUNT_KEY, count.toString());
  }

  resetSearchCount(): void {
    localStorage.removeItem(this.SEARCH_COUNT_KEY);
  }

  getLoadingState(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  setLoadingState(state: boolean): void {
    this.loadingSubject.next(state);
  }
  getToken(): string | null {
    return this.isLoggedInSubject.value.token;
  }

  setLoggedInStatus(status: boolean): void {
    this.isLoggedInSubject.next({
      isLoggedIn: status,
      token: sessionStorage.getItem('token'),
      userId: sessionStorage.getItem('userId'),
    });
  }

  getFilterCategories(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'filter-category');
  }

  getBrandFilters(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'getbrand');
  }

  getLifestyleFilters(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'getlifestyle-category');
  }

  getSocialMediaLink(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'social-media-link');
  }

  getProducts(
    offset: number,
    limit: number,
    filterParams: any
  ): Observable<any> {
    let queryParams = `offset=${offset}&limit=${limit}`;

    if (filterParams) {
      const filterQueryString = this.constructFilterQueryString(filterParams);
      queryParams += `&${filterQueryString}`;
    }

    const url = `${this.apiUrl}getallproduct?${queryParams}`;
    return this.http.get(url);
  }
  searchProducts(
    query: string,
    filterParams?: any,
    offset: any = 0,
    limit: any = 10,
    productId?: any
    // Default limit if not specified
  ): Observable<any> {
    // Construct query parameters with search term, offset, and limit
    let queryParams = `searchBy=${encodeURIComponent(
      query
    )}&offset=${offset}&limit=${limit}`;

    if (filterParams) {
      const filterQueryString = this.constructFilterQueryString(filterParams);
      queryParams += `&${filterQueryString}`; // Append additional filter parameters
    }

    if (productId) {
      queryParams += `&productId=${productId}`;
    }

    const url = `${this.apiUrl}search?${queryParams}`; // Complete URL with query parameters
    return this.http.get(url); // Make the API request
  }

  private constructFilterQueryString(filterParams: any): string {
    return Object.keys(filterParams)
      .map((key) => {
        const values = filterParams[key];
        if (Array.isArray(values)) {
          if (values.length === 0) {
            return `${encodeURIComponent(key)}=[]`;
          } else {
            const valueStrings = values.map(
              (value: any) => `"${encodeURIComponent(value)}"`
            );
            return `${encodeURIComponent(key)}=[${valueStrings.join(',')}]`;
          }
        } else {
          return `${encodeURIComponent(key)}=${encodeURIComponent(values)}`;
        }
      })
      .join('&');
  }

  getProductDetails(productId: number) {
    return this.http.get(`${this.apiUrl}product-information/${productId}`);
  }

  getBanner(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'getbanner');
  }

  getBlogDetails() {
    return this.http.get(this.apiUrl + 'blog-details');
  }

  getBlogDetailsById(blogId: number) {
    return this.http.get(`${this.apiUrl}blog-detailsId/${blogId}`);
  }

  addComment(userId: string, productId: string, comment: string) {
    const payload = { userId, productId, comment };
    return this.http.post(`${this.apiUrl}add-comment`, payload);
  }
  getComments(
    productId: number,
    offset: number,
    limit: number
  ): Observable<any> {
    return this.http.get(
      `${this.apiUrl}get-comment/${productId}?offset=${offset}&limit=${limit}`
    );
  }

  getProductComparison(userId: number, productIds: number[]): Observable<any> {
    const url = `${
      this.apiUrl
    }product-comparison/${userId}?productIds=${JSON.stringify(productIds)}`;
    return this.http.get(url);
  }

  submitRating(
    userId: string,
    productId: string,
    rating: string
  ): Observable<any> {
    const payload = { userId, productId, rating };
    return this.http.post(this.apiUrl + 'add-rating', payload);
  }

  subsCribeUser(email: string): Observable<any> {
    const payload = { email };
    return this.http.post(this.apiUrl + 'user/subscribe', payload);
  }

  getTrendingProducts(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'gettrendingProduct');
  }

  getPopularComparison(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'popular-comparison');
  }

  getProductsByCategory(
    productId: number,
    offset: number,
    limit: number
  ): Observable<any> {
    const endpoint = `${this.apiUrl}getproductbasedOnProductCategoryId/${productId}?offset=${offset}&limit=${limit}`;
    return this.http.get(endpoint);
  }

  getFeedback(userId: number, productId: number): Observable<any> {
    const url = `${this.apiUrl}get-feedback/${userId}/${productId}`;
    return this.http.get(url);
  }

  getAboutUsDetails(): Observable<any> {
    const url = `${this.apiUrl}about-us`;
    return this.http.get(url);
  }

  addFeedback(feedbackData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}add-feedback`, feedbackData); // POST request to add feedback
  }

  deleteComment(commentId: number, userId: number): Observable<any> {
    const url = `${this.apiUrl}delete-comment?commentId=${commentId}&userId=${userId}`;
    return this.http.get(url);
  }

  getFounderDetails(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}get-founder-details`);
  }

  subscribeEmail(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}user/subscribe`, { email });
  }

  sendContactForm(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}contact-us`, data, {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
