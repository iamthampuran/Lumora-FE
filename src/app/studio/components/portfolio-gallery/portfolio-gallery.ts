import { Component, Input } from '@angular/core';
import { PortfolioDetails } from '../../models/studio-profile-model';

@Component({
  selector: 'app-portfolio-gallery',
  imports: [],
  templateUrl: './portfolio-gallery.html',
  styleUrl: './portfolio-gallery.css',
})
export class PortfolioGallery{
  @Input() portfolioDetails!: PortfolioDetails[];
}
