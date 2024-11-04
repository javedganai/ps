import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductListComponent } from './product-list/product-list.component';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { ProductCompareComponent } from './product-compare/product-compare.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    ProductListComponent,
    ProductDetailsComponent,
    ProductCompareComponent,
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class ProductModule {}
