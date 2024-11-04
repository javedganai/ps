import { Component, OnInit } from '@angular/core';
import { SharedService } from '../services/shared.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-blog-details',
  templateUrl: './blog-details.component.html',
  styleUrls: ['./blog-details.component.css'],
})
export class BlogDetailsComponent implements OnInit {
  blogDetails: any = {};
  blogId!: number;
  blogName: any;

  constructor(
    private sharedService: SharedService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.blogId = +this.route.snapshot.paramMap.get('id')!;
    this.blogName = this.route.snapshot.paramMap.get('blog_name')!;
    if (this.blogId) {
      this.loadBlogDetails();
    }
  }

  loadBlogDetails() {
    this.sharedService
      .getBlogDetailsById(this.blogId)
      .subscribe((data: any) => {
        if (data && data.data && data.data.length > 0) {
          this.blogDetails = data.data[0];
        }
      });
  }
}
