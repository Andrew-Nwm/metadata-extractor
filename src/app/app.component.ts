import { Component } from '@angular/core';
import { ImageMetadataComponent } from './image-component/image-component.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ImageMetadataComponent],
  template: '<app-image-metadata></app-image-metadata>'
})
export class AppComponent {}