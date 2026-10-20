import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonLabel,
  IonProgressBar,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { Pokemon, PokemonService } from '../services/pokemon.service';

@Component({
  selector: 'app-detail',
  templateUrl: 'detail.page.html',
  styleUrls: ['detail.page.scss'],
  imports: [
    IonBackButton,
    IonButtons,
    IonChip,
    IonContent,
    IonHeader,
    IonLabel,
    IonProgressBar,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class DetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(PokemonService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  pokemon?: Pokemon;
  loading = true;
  error = '';

  async ngOnInit() {
    const query = this.route.snapshot.paramMap.get('query') ?? '';
    try {
      this.pokemon = await this.service.get(query);
    } catch {
      this.error = 'No encontramos ese Pokémon. Prueba con otro código.';
    } finally {
      this.loading = false;
      this.changeDetector.markForCheck();
    }
  }
}
