import { Component, Input, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AuthService } from '../services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedService } from 'src/app/services/shared.service';
import { GeolocationService } from 'src/app/services/geolocation.service';

interface Category {
  id: number;
  category_name: string;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  @Input() showModal: boolean = false;
  categories: any[] = [];
  selectedCategories: { [key: number]: boolean } = {};
  mobile: string = '';
  phone: string = '';
  email: string = '';
  address: string = '';
  instagram: string = '';
  facebook: string = '';
  gmail: string = '';
  income: number = 0;
  profileForm!: FormGroup;
  isLoggedIn: boolean = false;
  token: any = null;
  userId: any = null;
  selectedCategoryNames: string[] = [];

  constructor(
    public bsModalRef: BsModalRef,
    private authService: AuthService,
    private modalRef: BsModalRef,
    private fb: FormBuilder,
    private sharedService: SharedService,
    private geolocationService: GeolocationService
  ) {}

  ngOnInit(): void {
    this.sharedService.isLoggedIn$.subscribe(
      ({ isLoggedIn, token, userId }) => {
        this.isLoggedIn = isLoggedIn;
        this.token = token;
        this.userId = userId;
      }
    );
    this.geolocationService.getLocation().subscribe(
      (location) => {
        this.profileForm.patchValue({ userLocation: location.address }); // Prefill location
      },
      (error) => {
        console.error('Error getting location:', error);
      }
    );
    this.fetchCategories();
    this.fetchProfile();
    this.profileForm = this.fb.group({
      fullName: [''],
      userMobile: [''],
      userEmail: [''],
      userLocation: [''],
      instagramId: [''],
      facebookId: [''],
      gmailId: [''],
      areaOfInterest: [''],
      ageGroup: [''],
      gender: [''],
      occupation: [''],
      incomeRange: [''],
    });
  }

  closeCreateProfileModal() {
    this.bsModalRef.hide();
  }

  fetchCategories(): void {
    this.authService.getCategories().subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data) {
          this.categories = response.data;
        } else {
          console.error('Error fetching categories:', response.message);
        }
      },
      error: (error: any) => {
        console.error('Error fetching categories:', error);
      },
    });
  }

  toggleSelection(category: Category): void {
    const index = this.selectedCategoryNames.indexOf(category.category_name);
    if (index === -1) {
      this.selectedCategoryNames.push(category.category_name);
    } else {
      this.selectedCategoryNames.splice(index, 1);
    }
  }

  closeModal() {
    this.modalRef.hide();
  }

  selectedOption: string = '';

  selectOption(option: string) {
    this.selectedOption = option;
    this.profileForm.controls['gender'].setValue(option);
  }

  errorMessages: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

completeProfile() {
  if (this.profileForm.valid && this.userId) {
    this.isLoading = true;

    const formData = {
      fullName: this.profileForm.value.fullName,
      email: this.profileForm.value.userEmail,
      mobileNumber: this.profileForm.value.userMobile,
      location: this.profileForm.value.userLocation,
      instaId: this.profileForm.value.instagramId,
      facebookId: this.profileForm.value.facebookId,
      gmailId: this.profileForm.value.googleId,
      areaOfInterest: this.selectedCategoryNames,
      age: this.profileForm.value.ageGroup,
      gender: this.profileForm.value.gender,
      occupation: this.profileForm.value.occupation,
      income: this.income ? this.income.toString() : '',
      userId: this.userId,
    };

    this.authService.createProfile(formData).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.status === 200) {
          this.successMessage = res.message;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessages =
          error?.error?.message || 'An error occurred. Please try again later.';
      },
    });
  } else {
    this.errorMessages = 'Please fill in all required fields.';
  }
}

  profileData: any;
  fetchProfile(): void {
    this.authService.getProfile(this.userId).subscribe({
      next: (response) => {
        if (response.status === 200 && response.data) {
          const profileData = response.data;

          // Ensure correct mapping to form controls
          this.profileForm.patchValue({
            fullName: profileData?.full_name || '',
            userMobile: profileData?.mobilenumber || '',
            userEmail: profileData?.email || '',
            userLocation: profileData?.location || '',
            instagramId: profileData?.instaId || '',
            facebookId: profileData?.facebookId || '',
            googleId: profileData?.gmailId || '',
            ageGroup: profileData?.age || '',
            gender: profileData?.gender || '',
            occupation: profileData?.occupation || '',
            incomeRange: profileData.income,
          });
          this.selectedOption = profileData?.gender || '';
          if (profileData?.area_of_interest) {
            try {
              this.selectedCategoryNames = JSON.parse(
                profileData.area_of_interest
              );
            } catch (error) {
              console.error('Error parsing area_of_interest:', error);
              this.selectedCategoryNames = [];
            }
          }
        }
      },
      error: (error) => {
        console.error('Error fetching profile:', error);
      },
    });
  }
}
