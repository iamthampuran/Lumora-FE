import { Component, Input, OnInit } from '@angular/core';
import { PortfolioDetails } from '../../models/studio-profile-model';

@Component({
  selector: 'app-portfolio-gallery',
  imports: [],
  templateUrl: './portfolio-gallery.html',
  styleUrl: './portfolio-gallery.css',
})
export class PortfolioGallery implements OnInit {
  @Input() portfolioDetails!: PortfolioDetails[];
  ngOnInit(): void {
    console.log('Portfolio Details:', this.portfolioDetails);
    for (let i = 0; i < this.portfolioDetails.length; i++) {
      console.log(this.portfolioDetails[i].imageUrl);
    }
  }
}
