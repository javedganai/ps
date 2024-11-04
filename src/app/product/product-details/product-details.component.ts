import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { SharedService } from 'src/app/services/shared.service';
import { KeyValue } from '@angular/common';
import { LoaderService } from 'src/app/services/loader.service';
import { FeedbackModalComponent } from 'src/app/feedback-modal/feedback-modal.component';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/auth/services/auth.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css'],
})
export class ProductDetailsComponent implements OnInit {
  commentForm!: FormGroup;
  productId!: number;
  selectedProducts: any[] = [];
  productCategoryId: any;
  product: any;
  comment: string = '';
  comments: any[] = [];
  @ViewChild('commentList') commentList!: ElementRef;
  currentPage = 1;
  isLoading = false;
  offset = 0;
  limit = 5;
  allCommentsLoaded: boolean = false;
  showFewerComments: boolean = false;
  selectedStars: number = 0;
  maxStars: number = 5;
  commentLoading = false;
  ratingLoading = false;
  commentMessage = '';
  ratingMessage = '';
  moreCommentLoading: boolean = false;
  offsetSimilar = 0;
  limitSimilar = 5;
  categoryId = 1;
  isSimilarLoading = false;
  totalRecords = 0;
  similarproducts: any[] = [];
  bsModalRef!: BsModalRef;
  feedbackLoading: boolean = false;
  feedbackMessage: string = '';
  deleteCommentLoading = false;
  deletingCommentId: number | null = null;
  userId: any = sessionStorage.getItem('userId');
  s3url = 'https://poornasatya.s3.amazonaws.com/';
  constructor(
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private loaderService: LoaderService,
    private modalService: BsModalService,
    private toastr: ToastrService,
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.commentForm = this.fb.group({
      comment: ['', Validators.required], // Add 'required' validation
    });
  }

  ngOnInit(): void {
    this.productId = +this.route.snapshot.paramMap.get('id')!;

    this.route.queryParams.subscribe((params) => {
      this.productCategoryId = +params['productCategoryId'];
    });

    this.loadProductDetails();
    this.getComments();
    this.loadProducts();
    this.loadFeedback();
  }

  getDescriptionWithFallback(description: string | undefined): string {
    console.log('description', description);
    if (description && description.trim().length > 0) {
      return description.length > 50 ? description.slice(0, 50) : description;
    } else {
      return 'No description available'; // Fallback message
    }
  }

  loadProducts(): void {
    if (this.isSimilarLoading) {
      return;
    }

    this.isSimilarLoading = true;

    this.sharedService
      .getProductsByCategory(
        this.productCategoryId,
        this.offsetSimilar,
        this.limitSimilar
      )
      .subscribe({
        next: (response: any) => {
          if (response.status === 200 && response.data) {
            console.log(response);
            this.similarproducts = [...this.similarproducts, ...response.data];
            this.totalRecords = response.totalRecords || 0;
            this.offsetSimilar += this.limitSimilar;
          }
          this.isSimilarLoading = false;
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.isSimilarLoading = false;
        },
      });
  }

  loadFeedback(): void {
    this.sharedService.getFeedback(this.userId, this.productId).subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data.length > 0) {
          this.selectedStars = response.data[0].rating;
        } else {
          console.warn('No feedback found for the current product.');
        }
      },
      error: (error) => {
        console.error('Error fetching feedback:', error);
      },
    });
  }

  loadProductDetails(): void {
    this.loaderService.showLoader();
    this.sharedService.getProductDetails(this.productId).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.product = response.data;
        } else {
          console.error('Error fetching product details:', response.message);
        }
        this.loaderService.hideLoader();
      },
      error: (error) => {
        console.error('Error fetching product details:', error);
        this.loaderService.hideLoader();
      },
    });
  }

  starsArray(): number[] {
    return Array(this.maxStars)
      .fill(0)
      .map((x, i) => i + 1);
  }

  setRating(stars: number): void {
    this.selectedStars = stars;
  }

  nutrients: any = [];
  getNutrients(product: any): any[] {
    this.nutrients = [];
    for (const key in product) {
      if (
        product[key] !== null &&
        key !== 'id' &&
        key !== 'product_name' &&
        key !== 'image' &&
        key !== 'brand_id' &&
        key !== 'lifestyle_category_id' &&
        key !== 'veg_nonveg_category' &&
        key !== 'product_category_id' &&
        key !== 'product_sub_category_id' &&
        key !== 'barcode' &&
        key !== 'description' &&
        key !== 'lifeStyleCategory' &&
        key !== 'brand' &&
        key !== 'error' &&
        key !== 'timeTaken' &&
        key !== 'approval_status' &&
        key !== 'barcode_string' &&
        key !== 'ratings' &&
        key !== 'image_resize_status' &&
        key !== 'productLink' &&
        key !== 'certification_type_id'
      ) {
        this.nutrients.push({ name: key, value: product[key] });
      }
    }
    return this.nutrients;
  }
  calculateMidpoint(length: number): number {
    return Math.ceil(length / 2);
  }

  convertUtcToLocal(utcDateString: string): Date {
    return new Date(utcDateString);
  }
  calculateTimeDifference(utcDateString: string): string {
    const commentTime = new Date(utcDateString);
    const currentTime = new Date();

    const differenceMs = currentTime.getTime() - commentTime.getTime();
    const differenceSeconds = Math.floor(differenceMs / 1000);
    const differenceMinutes = Math.floor(differenceSeconds / 60);
    const differenceHours = Math.floor(differenceMinutes / 60);
    const differenceDays = Math.floor(differenceHours / 24);

    if (differenceDays > 0) {
      return `${differenceDays} day${differenceDays > 1 ? 's' : ''} ago`;
    } else if (differenceHours > 0) {
      return `${differenceHours} hour${differenceHours > 1 ? 's' : ''} ago`;
    } else if (differenceMinutes > 0) {
      return `${differenceMinutes} minute${
        differenceMinutes > 1 ? 's' : ''
      } ago`;
    } else {
      return `${differenceSeconds} second${
        differenceSeconds > 1 ? 's' : ''
      } ago`;
    }
  }

  rateProduct(stars: number): void {
    this.selectedStars = stars;
  }

  addComment(): void {
    if (this.commentForm.invalid) {
      this.commentForm.markAllAsTouched(); // Ensure form validation
      return;
    }

    this.commentLoading = true; // Start the loading spinner

    this.sharedService
      .addComment(this.userId, this.productId.toString(), this.comment)
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this.toastr.success('Comment added successfully!');
            this.clearInput(); // Clear the comment input field

            // Reset the offset and clear existing comments
            this.offset = 0; // Reset the offset
            this.comments = []; // Clear existing comments

            this.getComments(); // Fetch the updated comments
          } else {
            this.toastr.error('Error adding comment.');
          }
        },
        error: (error) => {
          console.error('Error adding comment:', error);
          this.toastr.error('Error adding comment.');
        },
        complete: () => {
          this.commentLoading = false; // Stop the loading spinner
        },
      });
  }

  isLoggedIn(): boolean {
    const userId = sessionStorage.getItem('userId'); // Check if a userId is stored
    return !!userId; // Return true if logged in, false otherwise
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
      const productIds = this.selectedProducts.map((product) => product.id);
      const url = `/product-comparison/${userId}?productIds=${JSON.stringify(
        productIds
      )}`;
      this.router.navigateByUrl(url);
    } else {
      this.toastr.error('Select between 2 and 5 products to compare.');
    }
  }

  getButtonDisabled(): boolean {
    const selectedCount = this.selectedProducts.length;
    return selectedCount < 2 || selectedCount > 5; // Disable when out of range
  }

  toggleSelection(product: any): void {
    if (!this.isLoggedIn()) {
      this.toastr.warning('Please log in to compare products.'); // Show warning if not logged in
      return; // Prevent further action
    }

    const productId = product.id;
    const index = this.selectedProducts.findIndex((p) => p.id === productId);

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

  // addComment(): void {
  //   const user_id: any = sessionStorage.getItem('userId');
  //   this.commentLoading = true; // Start the loader inside the button
  //   this.sharedService
  //     .addComment(user_id, this.productId.toString(), this.comment)
  //     .subscribe({
  //       next: (response: any) => {
  //         if (response.status === 200) {
  //           this.toastr.success('Comment added successfully!', 'Success'); // Toaster for success
  //           this.clearInput(); // Clear input after comment submission
  //           this.getComments(); // Refresh comments
  //         } else {
  //           this.toastr.error('Error adding comment.', 'Error'); // Toaster for error
  //         }
  //       },
  //       error: (error) => {
  //         this.toastr.error('Error adding comment.', 'Error'); // Toaster for error
  //         console.error('Error:', error);
  //         this.commentLoading = false;
  //       },
  //       complete: () => {
  //         this.commentLoading = false; // Stop loader
  //       },
  //     });
  // }

  deleteComment(commentId: number): void {
    const comment = this.comments.find((c) => c.id === commentId);
    console.log(this.userId, comment.user_id);
    if (comment?.user_id != this.userId) {
      this.toastr.error(
        "You can't delete someone else's comment.",
        'Unauthorized'
      );
      return; // Prevent unauthorized deletion
    }

    this.deletingCommentId = commentId;

    this.sharedService.deleteComment(commentId, this.userId).subscribe({
      next: () => {
        this.comments = this.comments.filter((c) => c.id !== commentId); // Correctly remove the deleted comment
        this.toastr.success('Comment deleted successfully.', 'Success');
      },
      error: (error) => {
        console.error('Error deleting comment:', error);
        this.toastr.error('Error deleting comment.', 'Error');
      },
      complete: () => {
        this.deletingCommentId = null;
      },
    });
  }

  submitRating(): void {
    if (this.selectedStars === 0) {
      return;
    }

    this.ratingLoading = true;

    this.sharedService
      .submitRating(
        this.userId,
        this.productId.toString(),
        this.selectedStars.toString()
      )
      .subscribe({
        next: () => {
          this.toastr.success('Rating submitted successfully!', 'Success');
          this.loadFeedback();
        },
        error: (error) => {
          this.toastr.error('Error submitting rating.', 'Error');
          console.error('Error:', error);
          this.ratingLoading = false;
        },
        complete: () => {
          this.ratingLoading = false;
        },
      });
  }

  openFeedbackModal(): void {
    const initialState = {
      productId: this.productId,
    };

    this.bsModalRef = this.modalService.show(FeedbackModalComponent, {
      initialState,
    });

    this.modalService.onHide.subscribe(() => {
      const feedbackComponent = this.bsModalRef
        ?.content as FeedbackModalComponent;

      if (feedbackComponent && feedbackComponent.isFeedbackSubmitted) {
        this.toastr.success('Thank you for your feedback!', 'Success');
      }
    });
  }

  clearInput(): void {
    const textarea = document.getElementById(
      'exampleFormControlTextarea1'
    ) as HTMLTextAreaElement;
    textarea.value = '';
  }
  getComments(showLoader = true): void {
    this.sharedService
      .getComments(this.productId, this.offset, this.limit)
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this.comments = this.comments.concat(response.data); // Append new comments
            console.log(this.comments, 'enter');
            this.offset += response.data.length; // Update the offset for pagination
            if (response.data.length < this.limit) {
              this.allCommentsLoaded = true; // If fewer than the limit, assume all comments are loaded
            }
          } else {
            this.toastr.error('Error fetching comments.', 'Error');
          }
        },
        error: (error) => {
          console.error('Error fetching comments:', error);
          this.toastr.error('Error fetching comments.', 'Error');
        },
        complete: () => {
          if (showLoader) {
            this.moreCommentLoading = false; // Stop the loading indication
          }
        },
      });
  }

  seeMore(): void {
    if (!this.allCommentsLoaded) {
      this.getComments(true); // Load more comments when "Show More" is clicked
    }
  }

  getButtonClass(product: any): string {
    return this.isSelected(product)
      ? 'custom-button-selected'
      : 'custom-button-default'; // Apply custom class for button
  }

  isSelected(product: any): boolean {
    return this.selectedProducts.some((p) => p.id === product.id);
  }
}
