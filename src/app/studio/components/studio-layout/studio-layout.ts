import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StudioSidebar } from '../studio-sidebar/studio-sidebar';

@Component({
  selector: 'app-studio-layout',
  imports: [RouterOutlet, StudioSidebar],
  templateUrl: './studio-layout.html',
  styleUrl: './studio-layout.css',
})
export class StudioLayout {}
