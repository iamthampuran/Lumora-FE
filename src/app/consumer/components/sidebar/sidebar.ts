import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-consumer-sidebar',
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class ConsumerSidebar {
  readonly isProfileMenuOpen = signal(false);

  toggleProfileMenu(): void {
    this.isProfileMenuOpen.update((value) => !value);
  }
}
