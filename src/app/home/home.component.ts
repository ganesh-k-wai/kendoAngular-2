import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ButtonsModule, RouterModule],
  styleUrls: ['./home.component.css'],
  templateUrl: './home.component.html', // Use external HTML file
})
export class HomeComponent {}
