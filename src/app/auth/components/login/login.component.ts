import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { RegisterComponent } from '../../register/register.component';
import { SharedService } from 'src/app/services/shared.service';
import { ActivatedRoute } from '@angular/router';
declare const google: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, AfterViewInit {
  @Input() showModal: boolean = false;
  showVerifyOtp: boolean = false;
  showRegister: boolean = false;
  verifyRegister: boolean = false;
  headerTitle: string = 'Login with OTP';
  headerSubtitle: string = 'Enter the mobile number';
  showLoginLink: boolean = true;
  registerForm!: FormGroup;
  registrationError: string = '';
  registrationSuccess: string = '';
  otpRegister: string = '';
  otpForm!: FormGroup;
  modalRegister: BsModalRef | null = null;
  mobileNumber: string = '';
  lastFourDigits: string = '';
  otp: string[] = new Array(6).fill('');
  loginForm!: FormGroup;
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef>;
  loginErrorMessage: any = '';
  otpSuccessMessage: string = '';
  otpErrorMessage: string = '';
  otpSuccessRegister: string = '';
  otpErrorRegister: string = '';
  @Input() clientId!: string;
  @Output() onGoogleSigninSuccess = new EventEmitter<any>();
  private googleClientId =
    '862628930164-gu2sejuias3tdf82qp3debch02nfcfn8.apps.googleusercontent.com';
  private facebookAppId = '1901241770307602';
  showSignUpLink: boolean = false;

  constructor(
    private modalRef: BsModalRef,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private modalService: BsModalService,
    private sharedService: SharedService,
    private route: ActivatedRoute
  ) {
    this.registerForm = this.formBuilder.group({
      email: ['', Validators.email],
      mobile: ['', this.customMobileValidator],
    });
    this.otpForm = this.formBuilder.group({
      otp: ['', Validators.required],
    });

    this.loginForm = this.formBuilder.group({
      mobileLogin: ['', [Validators.required, this.customMobileValidator]],
      otpLogin1: ['', Validators.required],
      otpLogin2: ['', Validators.required],
      otpLogin3: ['', Validators.required],
      otpLogin4: ['', Validators.required],
      otpLogin5: ['', Validators.required],
      otpLogin6: ['', Validators.required],
    });
  }

  customMobileValidator(control: AbstractControl): ValidationErrors | null {
    const mobileNumber = control.value;
    const isValid = /^[6-9]{1}[0-9]{9}$/.test(mobileNumber);

    if (!isValid && mobileNumber) {
      return { invalidMobile: true };
    }

    return null;
  }

  onlogin() {
    this.showLoginLink = true;
    this.showRegister = false;
    this.headerTitle = 'Login with OTP';
    this.headerSubtitle = 'Enter the mobile number';
    this.showSignUpLink = false;
  }

  getMobileErrorMessage() {
    const mobileControl = this.registerForm.get('mobile');
    if (mobileControl?.hasError('required')) {
      return 'Mobile is required';
    } else if (mobileControl?.hasError('invalidMobile')) {
      return 'Please enter a valid mobile number';
    } else if (mobileControl?.hasError('invalidLength')) {
      return 'Mobile number should not exceed 10 digits';
    }
    return '';
  }

  ngOnInit() {
    const mobileInput = this.registerForm.get('mobile');
    const emailInput = this.registerForm.get('email');

    if (mobileInput && emailInput) {
      mobileInput.valueChanges.subscribe(() => {
        if (mobileInput.value) {
          emailInput.disable({ emitEvent: false });
        } else {
          emailInput.enable({ emitEvent: false });
        }
      });

      emailInput.valueChanges.subscribe(() => {
        if (emailInput.value) {
          mobileInput.disable({ emitEvent: false });
        } else {
          mobileInput.enable({ emitEvent: false });
        }
      });
    }

    this.registerForm.setValidators(this.requireOneFieldValidator());
    this.initForm();
    this.route.queryParams.subscribe((params) => {
      const authorizationCode = params['code']; // Get the authorization code from the query parameters

      if (authorizationCode) {
        this.authService
          .exchangeAuthorizationCode(authorizationCode)
          .subscribe((response) => {
            // Handle the access token
            console.log('Instagram access token:', response.access_token);
            // Store the token securely, and proceed with authentication logic
          });
      }
    });
  }

  ngAfterViewInit() {
    // Ensure GIS is loaded before initializing
    if (typeof google !== 'undefined') {
      // Initialize GIS with client ID and a callback function
      google.accounts.id.initialize({
        client_id: this.googleClientId,
        callback: (response: any) => this.handleCredentialResponse(response), // Callback function
      });
    } else {
      console.error("Google Identity Services script isn't loaded");
    }
  }

  loginWithGoogle() {
    const clientId =
      '862628930164-gu2sejuias3tdf82qp3debch02nfcfn8.apps.googleusercontent.com';
    const redirectUri = 'http://localhost:4200'; // The URI where Google redirects after sign-in
    const scope = 'openid email profile'; // Define the OAuth scopes

    // Construct the Google OAuth 2.0 authorization URL
    const authorizationUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=token&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

    // Open Google Sign-In in a new window
    const newWindow = window.open(
      authorizationUrl,
      '_blank',
      'width=600,height=600'
    );

    if (
      !newWindow ||
      newWindow.closed ||
      typeof newWindow.closed === 'undefined'
    ) {
      console.error('Failed to open Google Sign-In in a new window');
    }
  }

  handleCredentialResponse(response: any) {
    console.log('Google OAuth Response:', response);
    // Handle OAuth response (e.g., send the ID token to your backend for authentication)
  }

  loginWithFacebook() {
    const redirectUri = 'http://localhost:4200'; // The URI where Facebook redirects after login
    const scope = 'public_profile email'; // Define the OAuth scopes

    // Construct the Facebook OAuth authorization URL
    const authorizationUrl = `https://www.facebook.com/v11.0/dialog/oauth?client_id=${this.facebookAppId}&redirect_uri=${redirectUri}&scope=${scope}`;

    // Open Facebook Sign-In in a new window
    const newWindow = window.open(
      authorizationUrl,
      '_blank',
      'width=600,height=600'
    );

    if (
      !newWindow ||
      newWindow.closed ||
      typeof newWindow.closed === 'undefined'
    ) {
      console.error('Failed to open Facebook Sign-In in a new window');
    }
  }

  loginWithInstagram() {
    // Get the authorization URL from the service
    const authorizationUrl = this.authService.getAuthorizationUrl();

    // Open Instagram's OAuth flow in a new window
    const newWindow = window.open(
      authorizationUrl,
      '_blank',
      'width=600,height=600'
    );

    // You can check if the window was opened successfully
    if (
      !newWindow ||
      newWindow.closed ||
      typeof newWindow.closed == 'undefined'
    ) {
      console.error('Failed to open Instagram login window');
    }
  }

  initForm() {
    this.otpForm = this.formBuilder.group({
      otp: ['', Validators.required],
    });
  }

  switchToOTPVerification() {
    this.showLoginLink = false;
    this.headerTitle = 'Verify OTP';
    this.headerSubtitle = `Enter the OTP sent to your ******${this.lastFourDigits}`;
  }

  switchToRegisterVerification() {
    this.showLoginLink = false;
    this.headerTitle = 'Verify OTP';
    this.headerSubtitle = `Enter the OTP sent to your ******${this.lastFourDigits} or email`;
  }

  sendOtp() {
    this.loginErrorMessage = '';
    this.otpSuccessMessage = '';
    const mobileControl = this.loginForm.get('mobileLogin');
    if (mobileControl?.valid) {
      this.mobileNumber = mobileControl.value; // Capture the full mobile number
      this.lastFourDigits = this.mobileNumber.slice(-4); // Get the last four digits

      const mobileNumber = this.loginForm.get('mobileLogin')?.value;
      this.authService.sendOtp(mobileNumber).subscribe({
        next: (response: any) => {
          this.showVerifyOtp = true;
          this.switchToOTPVerification();
          this.otpSuccessMessage = response.message;
        },
        error: (error: any) => {
          if (error && error.error && error.error.message) {
            this.loginErrorMessage = error.error.message;

            // Check if the error message indicates that the user needs to register
            if (
              this.loginErrorMessage.includes(
                'You need to register first to log in. Sign up now!'
              )
            ) {
              this.showSignUpLink = true; // Set the flag to show Sign Up link
            }
          } else {
            this.loginErrorMessage = 'Login failed. Please try again later.';
          }
          console.error('Login failed:', error);
        },
      });
    }
  }

  switchToRegister() {
    this.showRegister = true;
    this.showLoginLink = false;
    this.headerTitle = 'Register';
    this.headerSubtitle = 'Enter your details';
  }

  resetOtpFields() {
    this.loginForm.patchValue({
      otpLogin1: '',
      otpLogin2: '',
      otpLogin3: '',
      otpLogin4: '',
      otpLogin5: '',
      otpLogin6: '',
    });
  }

  verifyOtp() {
    this.otpSuccessMessage = '';
    if (this.loginForm.valid) {
      const otp =
        this.loginForm.value['otpLogin1'] +
        this.loginForm.value['otpLogin2'] +
        this.loginForm.value['otpLogin3'] +
        this.loginForm.value['otpLogin4'] +
        this.loginForm.value['otpLogin5'] +
        this.loginForm.value['otpLogin6'];

      const mobileNumber = this.loginForm.get('mobileLogin')?.value;
      this.authService.verifyOtp(mobileNumber, otp).subscribe({
        next: (response: any) => {

          // sessionStorage.setItem('token', response.data.token.token);
          // sessionStorage.setItem('userId', response.data.userId);
          localStorage.setItem('token', response.data.token.token);
          localStorage.setItem('userId', response.data.userId);
          this.sharedService.setLoggedInStatus(true);
          this.modalRef.hide();
        },
        error: (error: any) => {
          this.resetOtpFields();
          if (error && error.error && error.error.message) {
            this.otpErrorMessage = error.error.message;
          } else {
            this.otpErrorMessage =
              'OTP verification failed. Please try again later.';
          }
          console.error('OTP verification failed:', error);
        },
      });
    }
  }

  requireOneFieldValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const mobile = formGroup.get('mobile');
      const email = formGroup.get('email');

      if (!(mobile?.value || email?.value)) {
        return { requireOneField: true };
      }
      return null;
    };
  }

  register() {
    this.registrationError = '';
    this.registrationSuccess = '';
    this.otpSuccessRegister = '';
    if (this.registerForm.valid) {
      const mobileNumber = String(this.registerForm.get('mobile')?.value);
      this.lastFourDigits = mobileNumber.slice(-4); // Get the last four digits

      this.authService.registerUser(mobileNumber).subscribe({
        next: (response) => {
          this.switchToRegisterVerification();
          this.verifyRegister = true;
          this.otpSuccessRegister = response.message;
        },
        error: (error) => {
          if (error && error.error && error.error.message) {
            this.registrationError = error.error.message;
          } else {
            this.registrationError =
              'Registration failed. Please try again later.';
          }
          console.error('Registration failed:', error);
        },
      });
    }
  }

  verifyRegisterOtp() {
    this.otpRegister = '';
    this.otpSuccessRegister = '';
    if (this.otpForm.valid) {
      const mobileNumber = this.registerForm.get('mobile')?.value;
      const email = this.registerForm.get('email')?.value;
      const otp = this.otpForm.get('otp')?.value;
      this.authService.verifyRegister(mobileNumber, email, otp).subscribe({
        next: (response) => {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('userId', response.data.id);
          this.sharedService.setLoggedInStatus(true);
          this.openCreateProfileModal();
          // Handle success
        },
        error: (error) => {
          this.resetOtpFields();
          if (error && error.error && error.error.message) {
            this.registrationError = error.error.message;
          } else {
            this.registrationError =
              'Verification failed. Please try again later.';
          }
          console.error('Verification failed:', error);
        },
      });
    } else {
      this.otpForm.markAllAsTouched();
    }
  }

  closeModal() {
    this.modalRef.hide();
  }

  openCreateProfileModal() {
    this.modalRef.hide();
    this.modalRef = this.modalService.show(RegisterComponent);
  }

  onOtpInputChange(event: any, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    if (!/^\d$/.test(value)) {
      input.value = '';
      this.otpErrorMessage = 'Please enter a digit';
      return;
    }

    this.otpErrorMessage = '';
    const nextInputIndex = index < 5 ? index + 1 : null;
    if (value && nextInputIndex !== null) {
      const nextInput = this.otpInputs.toArray()[nextInputIndex];
      if (nextInput) {
        nextInput.nativeElement.focus();
      }
    } else {
      return;
    }
  }
}
