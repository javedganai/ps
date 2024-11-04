import { Component, OnInit } from '@angular/core';
import { SharedService } from '../services/shared.service';
import { Router } from '@angular/router';
import { LoaderService } from '../services/loader.service';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css'],
})
export class BlogComponent implements OnInit {
  blogs: any[] = [];
  s3Url = 'https://poornasatya.s3.amazonaws.com/';

  constructor(
    private sharedService: SharedService,
    private router: Router,
    private loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    this.fetchBlogs();
  }

  fetchBlogs(): void {
    this.loaderService.showLoader();

    this.sharedService.getBlogDetails().subscribe({
      next: (data: any) => {
        this.blogs = data.data;
        this.loaderService.hideLoader();
      },
      error: (error) => {
        console.error('Error fetching blogs:', error);
        this.loaderService.hideLoader();
      },
    });
  }

  viewBlogDetails(blogId: number, blogName: string): void {
    this.router.navigate(['/blogDetailsId', blogId, { blog_name: blogName }]);
  }
}
