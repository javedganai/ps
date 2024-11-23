import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as Highcharts from 'highcharts';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from 'src/app/services/loader.service';
import { SharedService } from 'src/app/services/shared.service';
import { COLOR_PALETTE } from 'src/assets/color-constants';

@Component({
  selector: 'app-product-compare',
  templateUrl: './product-compare.component.html',
  styleUrls: ['./product-compare.component.css'],
})
export class ProductCompareComponent implements OnInit {
  productIds: number[] = [];
  products: any = [];
  loading: boolean = false;
  s3url = 'https://poornasatya.s3.amazonaws.com/';
  productColors: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private loaderService: LoaderService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['productIds']) {
        this.productIds = JSON.parse(params['productIds']);
        this.fetchProductComparison();
      }
    });
  }

  fetchProductComparison(): void {
    this.loaderService.showLoader();
    const userId: any = localStorage.getItem('userId');
    this.sharedService.getProductComparison(userId, this.productIds).subscribe(
      (response: any) => {
        if (response.status === 200 && response.data) {
          this.products = response.data;
          this.productColors = this.products.map(
            (_: any, index: number) =>
              COLOR_PALETTE[index % COLOR_PALETTE.length]
          );
          this.renderChart();
          this.loaderService.hideLoader();
        } else {
          console.error('Error fetching product comparison:', response.message);
          this.loaderService.hideLoader();
        }
      },
      (error: any) => {
        console.error('Error fetching product comparison:', error);
        this.loaderService.hideLoader();
      }
    );
  }

  renderChart(): void {
    if (!this.products || this.products.length === 0) {
      console.error('No product data available.');
      return;
    }
    const productData = this.products[0];

    const categories = Object.keys(productData).filter((key) => {
      return (
        ![
          'id',
          'product_name',
          'image',
          'brand_id',
          'lifestyle_category_id',
          'veg_nonveg_category',
          'product_category_id',
          'product_sub_category_id',
          'barcode',
          'description',
          'lifeStyleCategory',
          'brand',
          'error',
          'timeTaken',
          'approval_status',
          'productCateogry',
          'barcode_string',
          'additives',
          'allergens',
          'image_resize_status',
          'ratings',
          'certification_type_id',
          'productLink',
        ].includes(key) && productData[key] !== null
      );
    });

    // Transforming JSON data into the format compatible with Highcharts
    const seriesData: Highcharts.SeriesOptionsType[] = this.products.map(
      (product: any, index: number) => ({
        name: product.product_name, // Using product name as series name
        data: categories.map((category) => parseFloat(product[category])),
        type: 'column',
        color: this.productColors[index], // Assigning color from productColors
      })
    );

    const chartOptions: Highcharts.Options = {
      chart: {
        type: 'column',
      },
      title: {
        text: 'Product Comparison',
      },
      credits: {
        enabled: false,
      },
      xAxis: {
        categories: categories,
      },
      yAxis: {
        title: {
          text: 'Value',
        },
      },
      legend: {
        verticalAlign: 'top',
      },
      plotOptions: {
        column: {
          borderRadius: 20, // Corner radius for bars
          borderWidth: 1,
          groupPadding: 0.2, // Controls spacing between groups
          pointPadding: 0.1, // Controls spacing between individual bars
          pointWidth: 13, // Explicit width for each bar in pixels
        },
      },
      series: seriesData,
    };

    Highcharts.chart('chart-container', chartOptions);
  }

  removeProduct(productId: number): void {
    if (this.products.length <= 2) {
      // Ensure at least 2 products remain
      this.toastr.warning('At least 2 products are needed for comparison.'); // Show warning
      return; // Exit without removing the product
    }

    // Remove the product from the products array
    const productIndex = this.products.findIndex(
      (p: { id: number }) => p.id === productId
    );
    if (productIndex !== -1) {
      this.products.splice(productIndex, 1);
    }

    // Remove the product ID from the productIds array
    const idIndex = this.productIds.findIndex((id) => id === productId);
    if (idIndex !== -1) {
      this.productIds.splice(idIndex, 1);
    }

    // Re-render the chart to reflect the updated products
    this.renderChart(); // Update the chart after removing a product
  }
}
