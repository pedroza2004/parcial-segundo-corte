import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { scanOutline, stopCircleOutline, searchOutline } from 'ionicons/icons';
import { Html5Qrcode } from 'html5-qrcode';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonText,
  ],
})
export class HomePage {
  scanning = false;
  error = '';
  manual = '';
  private scanner?: Html5Qrcode;

  constructor(private router: Router) {
    addIcons({ scanOutline, stopCircleOutline, searchOutline });
  }

  async startScan() {
    this.error = '';
    this.scanning = true;
    await new Promise((r) => setTimeout(r, 50)); // esperar a que el div #reader sea visible

    this.scanner = new Html5Qrcode('reader');
    try {
      await this.scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (text) => this.onScan(text),
        () => {}
      );
    } catch {
      this.error = 'No se pudo abrir la cámara. Revisa los permisos.';
      this.scanning = false;
    }
  }

  async stopScan() {
    try {
      if (this.scanner?.isScanning) await this.scanner.stop();
      this.scanner?.clear();
    } catch {}
    this.scanning = false;
  }

  private async onScan(text: string) {
    await this.stopScan();
    this.openPokemon(text);
  }

  openPokemon(raw: string) {
    // Acepta "25", "pikachu" o una URL tipo https://pokeapi.co/api/v2/pokemon/25/
    const clean = raw.trim().replace(/\/+$/, '');
    const query = clean.split('/').pop() ?? clean;
    if (!query) return;
    this.router.navigate(['/pokemon', query]);
  }

  ionViewWillLeave() {
    this.stopScan();
  }
}
