import { ChangeDetectorRef, Component, inject } from '@angular/core';
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
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { scanOutline, stopCircleOutline, searchOutline } from 'ionicons/icons';
import { Html5Qrcode } from 'html5-qrcode';
import { PokemonImageClassifierService } from '../services/pokemon-image-classifier.service';

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
  private readonly router = inject(Router);
  private readonly classifier = inject(PokemonImageClassifierService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  scanning = false;
  error = '';
  manual = '';
  scanningMessage = '';
  modelMessage = 'Preparando el reconocedor para escanear más rápido...';
  private recognizerReady = false;
  private preloadPromise?: Promise<void>;
  private scanner?: Html5Qrcode;
  private recognitionTimer?: number;
  private recognizing = false;

  constructor() {
    addIcons({ scanOutline, stopCircleOutline, searchOutline });
  }

  ionViewWillEnter() {
    this.preloadPromise ??= this.preloadRecognizer();
  }

  async startScan() {
    this.error = '';
    this.scanning = true;
    this.scanningMessage = 'Iniciando la cámara...';
    this.changeDetector.markForCheck();
    try {
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (!this.scanning) return;

      const permissionStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      permissionStream.getTracks().forEach((track) => track.stop());

      const cameras = await Html5Qrcode.getCameras();
      if (cameras.length === 0) {
        this.error =
          'No se encontró una cámara. Conecta una cámara y permite su uso en la configuración de privacidad de Windows.';
        await this.stopScan();
        return;
      }

      const camera =
        cameras.find((device) => /back|rear|environment|trasera/i.test(device.label)) ??
        cameras[0];
      this.scanner = new Html5Qrcode('reader');
      await this.scanner.start(
        camera.id,
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (text) => this.onScan(text),
        () => {}
      );
      const video = document.querySelector<HTMLVideoElement>('#reader video');
      if (!video) {
        throw new Error('No se encontró la imagen de la cámara.');
      }

      this.scanningMessage = 'Cargando el reconocedor de Pokémon...';
      this.changeDetector.markForCheck();
      void this.loadRecognizer(video);
    } catch (error) {
      const name = error instanceof Error ? error.name : '';
      const cameraErrors: Record<string, string> = {
        NotFoundError:
          'No se detecta ninguna cámara. Conecta una cámara o activa una en Windows: Configuración > Privacidad y seguridad > Cámara.',
        NotAllowedError:
          'Edge bloqueó el permiso de cámara. En el candado junto a la dirección, permite Cámara; también actívala en Windows: Configuración > Privacidad y seguridad > Cámara.',
        NotReadableError:
          'La cámara está ocupada por otra aplicación. Ciérrala y vuelve a intentarlo.',
        SecurityError:
          'El navegador bloqueó el acceso a la cámara. Abre la app en localhost o HTTPS y permite el acceso.',
      };
      this.error =
        cameraErrors[name] ??
        `No se pudo iniciar el escáner: ${error instanceof Error ? error.message : String(error)}`;
      await this.stopScan();
    }
  }

  async scanImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const image = input.files?.[0];
    input.value = '';
    if (!image) return;

    this.error = '';
    this.scanning = true;
    this.scanningMessage = 'Leyendo el código QR de la imagen...';
    this.changeDetector.markForCheck();

    try {
      await new Promise((resolve) => setTimeout(resolve, 50));
      this.scanner = new Html5Qrcode('reader');
      const text = await this.scanner.scanFile(image, false);
      await this.stopScan();
      this.openPokemon(text);
    } catch {
      await this.stopScan();
      this.error = 'No se encontró un código QR legible en la imagen. Prueba con otra imagen o usa la búsqueda manual.';
    }
  }

  private async loadRecognizer(video: HTMLVideoElement) {
    try {
      await (this.preloadPromise ??= this.preloadRecognizer());
      if (!this.scanning) return;
      if (!this.recognizerReady) {
        this.scanningMessage = 'Reconocimiento no disponible. Puedes escanear un código QR.';
        this.changeDetector.markForCheck();
        return;
      }

      this.scanningMessage = 'Centra un Pokémon frente a la cámara.';
      this.changeDetector.markForCheck();
      void this.recognizeFrame(video);
      this.recognitionTimer = window.setInterval(() => {
        void this.recognizeFrame(video);
      }, 500);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.error = `La cámara está activa, pero no se pudo cargar el reconocimiento: ${reason}`;
      this.scanningMessage = 'Puedes escanear un código QR o cancelar.';
      this.changeDetector.markForCheck();
    }
  }

  private async preloadRecognizer() {
    try {
      await this.classifier.load();
      this.recognizerReady = true;
      this.modelMessage = 'Escáner listo.';
      this.changeDetector.markForCheck();
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.recognizerReady = false;
      this.preloadPromise = undefined;
      this.modelMessage = 'No se pudo precargar el reconocedor.';
      this.error = `No se pudo preparar el reconocimiento: ${reason}`;
      this.changeDetector.markForCheck();
    }
  }

  async stopScan() {
    if (this.recognitionTimer !== undefined) {
      window.clearInterval(this.recognitionTimer);
      this.recognitionTimer = undefined;
    }

    try {
      if (this.scanner?.isScanning) await this.scanner.stop();
      this.scanner?.clear();
      this.scanner = undefined;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.error = `No se pudo cerrar la cámara correctamente: ${reason}`;
    } finally {
      this.scanning = false;
      this.scanningMessage = '';
      this.changeDetector.markForCheck();
    }
  }

  private async recognizeFrame(video: HTMLVideoElement) {
    if (this.recognizing || !this.scanning || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return;
    }

    this.recognizing = true;
    try {
      const pokemonId = await this.classifier.recognize(video);
      if (pokemonId !== null && this.scanning) {
        await this.stopScan();
        this.openPokemon(String(pokemonId));
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.error = `No se pudo analizar la imagen: ${reason}`;
      await this.stopScan();
    } finally {
      this.recognizing = false;
    }
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
    void this.stopScan();
  }
}
