import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { LoginComponent } from '../auth/components/login/login.component';
import { SharedService } from '../services/shared.service';
import { RegisterComponent } from '../auth/register/register.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  isScrolled: boolean = false;
  isMenuOpen = false;
  modalRef: BsModalRef | null = null;
  isLoggedIn: boolean = false;
  username!: string | null;
  token: any = null;
  userId: any = null;
  @ViewChild('userDropdown', { static: false }) userDropdown!: ElementRef;

  constructor(
    private modalService: BsModalService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.sharedService.isLoggedIn$.subscribe(
      ({ isLoggedIn, token, userId }) => {
        console.log('Is logged in register:', isLoggedIn);
        console.log('Token register:', token);
        console.log('User ID:', userId);
        this.isLoggedIn = isLoggedIn;
        this.token = token;
        this.userId = userId;
      }
    );
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 0;
  }

  openLoginModal() {
    this.modalRef = this.modalService.show(LoginComponent, {
      initialState: { showModal: true },
    });

    this.modalRef?.onHidden?.subscribe(() => {
      this.modalRef = null;
    });
  }

  logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userId');
    this.sharedService.setLoggedInStatus(false);
    this.sharedService.userId$.next(null);
  }

  toggleDropdown(): void {
    this.userDropdown.nativeElement.classList.toggle('show');
  }

  openCreateProfileModal() {
    this.modalRef?.hide();

    this.modalRef = this.modalService.show(RegisterComponent);
  }
}
