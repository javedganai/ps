import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { ProductListComponent } from './product/product-list/product-list.component';
import { ProductDetailsComponent } from './product/product-details/product-details.component';
import { ProductCompareComponent } from './product/product-compare/product-compare.component';
import { AboutComponent } from './about/about.component';
import { BlogComponent } from './blog/blog.component';
import { BlogDetailsComponent } from './blog-details/blog-details.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { AuthGuard } from './auth/guards/auth.guard';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'productsData', component: ProductListComponent },
  { path: 'about-us', component: AboutComponent },
  { path: 'blogs', component: BlogComponent },
  { path: 'contactUs', component: ContactUsComponent },
  // Routes with AuthGuard to ensure authentication
  {
    path: 'productDetails/:id',
    component: ProductDetailsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'product-comparison/:id',
    component: ProductCompareComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'blogDetailsId/:id',
    component: BlogDetailsComponent,
  },
  { path: '**', redirectTo: '' }, // Default and wildcard routes redirect to landing page
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
