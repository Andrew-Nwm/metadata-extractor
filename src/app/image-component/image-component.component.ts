import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as ExifReader from 'exifreader';

@Component({
  selector: 'app-image-metadata',
  imports:[CommonModule],
  standalone: true,
  template: `
    <div class="container">
      <h2>Extractor de Metadatos de Imagen</h2>
      
      <div class="upload-box" 
           (dragover)="onDragOver($event)" 
           (dragleave)="onDragLeave($event)"
           (drop)="onDrop($event)">
        <input type="file" 
               #fileInput 
               (change)="onFileSelected($event)" 
               accept="image/*" 
               style="display: none">
        <button (click)="fileInput.click()">Seleccionar Imagen</button>
        <p>o arrastra y suelta una imagen aquí</p>
      </div>

      @if (metadata) {
        <div class="metadata">
          <h3>Metadatos Básicos:</h3>
          <ul>
            <li><strong>Nombre:</strong> {{metadata.basic.name}}</li>
            <li><strong>Tamaño:</strong> {{metadata.basic.size}}</li>
            <li><strong>Tipo:</strong> {{metadata.basic.type}}</li>
            <li><strong>Dimensiones:</strong> {{metadata.basic.dimensions}}</li>
            <li><strong>Última modificación:</strong> {{metadata.basic.lastModified}}</li>
          </ul>

          @if (metadata.exif) {
            <h3>Información EXIF:</h3>
            <ul>
              <li *ngFor="let item of metadata.exif | keyvalue">
                <strong>{{item.key}}:</strong> {{item.value}}
              </li>
            </ul>
          }

          @if (metadata.gps) {
            <h3>Información GPS:</h3>
            <ul>
              <li><strong>Latitud:</strong> {{metadata.gps.latitude}}</li>
              <li><strong>Longitud:</strong> {{metadata.gps.longitude}}</li>
            </ul>
          }

          @if (metadata.iptc) {
            <h3>Información IPTC:</h3>
            <ul>
              <li *ngFor="let item of metadata.iptc | keyvalue">
                <strong>{{item.key}}:</strong> {{item.value}}
              </li>
            </ul>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 20px auto;
      padding: 20px;
    }

    .upload-box {
      border: 2px dashed #ccc;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .upload-box:hover {
      border-color: #007bff;
      background: #f8f9fa;
    }

    button {
      padding: 10px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.3s ease;
    }

    button:hover {
      background: #0056b3;
    }

    .metadata {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    h3 {
      color: #007bff;
      margin-top: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #dee2e6;
    }

    ul {
      list-style: none;
      padding: 0;
    }

    li {
      margin: 10px 0;
      padding: 8px;
      border-bottom: 1px solid #eee;
    }

    li:last-child {
      border-bottom: none;
    }
  `]
})
export class ImageMetadataComponent {
  metadata: any = null;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.processImage(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.processImage(file);
  }

  async processImage(file: File) {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen');
      return;
    }

    const metadata: any = {
      basic: {
        name: file.name,
        size: this.formatSize(file.size),
        type: file.type,
        lastModified: new Date(file.lastModified).toLocaleString()
      }
    };

    // Obtener dimensiones de la imagen
    const dimensionsPromise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        metadata.basic.dimensions = `${img.width}x${img.height}`;
        resolve(null);
      };
      img.src = URL.createObjectURL(file);
    });

    // Obtener datos EXIF y otros metadatos
    try {
      const tags = await ExifReader.load(file);
      
      // Extraer datos EXIF
      metadata.exif = {
        'Marca': tags['Make']?.description,
        'Modelo': tags['Model']?.description,
        'Fecha de captura': tags['DateTimeOriginal']?.description,
        'Velocidad ISO': tags['ISOSpeedRatings']?.description,
        'Velocidad de obturación': tags['ExposureTime']?.description,
        'Apertura': tags['FNumber']?.description,
        'Distancia focal': tags['FocalLength']?.description,
        'Software': tags['Software']?.description,
        'Orientación': tags['Orientation']?.description,
        'Flash': tags['Flash']?.description
      };

      // Limpiar valores undefined
      metadata.exif = Object.fromEntries(
        Object.entries(metadata.exif).filter(([_, v]) => v !== undefined)
      );

      // Extraer datos GPS si existen
      if (tags['GPSLatitude'] && tags['GPSLongitude']) {
        metadata.gps = {
          latitude: tags['GPSLatitude'].description,
          longitude: tags['GPSLongitude'].description
        };
      }

      // Extraer datos IPTC si existen
      const iptcTags = ['ObjectName', 'Keywords', 'Copyright', 'Caption', 'Author'];
      metadata.iptc = {};
      iptcTags.forEach(tag => {
        if (tags[tag]) {
          metadata.iptc[tag] = tags[tag].description;
        }
      });

      if (Object.keys(metadata.iptc).length === 0) {
        delete metadata.iptc;
      }

    } catch (error) {
      console.log('No se pudieron extraer metadatos EXIF:', error);
    }

    await dimensionsPromise;
    this.metadata = metadata;
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}