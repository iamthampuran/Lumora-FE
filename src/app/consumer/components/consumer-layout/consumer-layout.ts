import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConsumerSidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-consumer-layout',
  imports: [RouterOutlet, ConsumerSidebar],
  templateUrl: './consumer-layout.html',
  styleUrl: './consumer-layout.css',
})
export class ConsumerLayout {}
