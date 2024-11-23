import { Component, Input } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { SharedService } from '../services/shared.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-feedback-modal',
  templateUrl: './feedback-modal.component.html',
  styleUrls: ['./feedback-modal.component.css'],
})
export class FeedbackModalComponent {
  @Input() productId!: number;
  feedbackCategory: string | null = null;
  feedbackText: string = '';
  isSubmittingFeedback: boolean = false;
  isFeedbackSubmitted = false;

  constructor(
    public bsModalRef: BsModalRef,
    private sharedService: SharedService,
    private toastr: ToastrService
  ) {}

  selectCategory(category: string): void {
    this.feedbackCategory = category;
  }

  submitFeedback(): void {
    // Ensure feedback text is not empty
    if (!this.feedbackCategory) {
      this.toastr.error(
        'Please select a feedback category.',
        'Validation Error'
      );
      return;
    }
    if (!this.feedbackText.trim()) {
      //this.toastr.error('Please enter your feedback.', 'Validation Error');
      return;
    }

    const userId = localStorage.getItem('userId');

    if (!userId) {
      this.toastr.error(
        'You need to log in to submit feedback.',
        'Login Required'
      );
      return;
    }

    this.isSubmittingFeedback = true;

    const feedbackData = {
      comment: this.feedbackText,
      userId,
      productId: this.productId.toString(),
      feedbackCategory: this.feedbackCategory,
    };

    this.sharedService.addFeedback(feedbackData).subscribe({
      next: () => {
        this.isFeedbackSubmitted = true;
        this.closeModal();
      },
      error: (error) => {
        this.toastr.error('Failed to submit feedback.', 'Error');
        console.error('Error submitting feedback:', error);
      },
      complete: () => {
        this.isSubmittingFeedback = false;
      },
    });
  }

  closeModal(): void {
    this.bsModalRef.hide();
  }
}
