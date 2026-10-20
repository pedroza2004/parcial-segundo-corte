import { Component, OnInit } from '@angular/core';
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
} from '@ionic/angular/standalone';
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
  pokemon?: Pokemon;
  loading = true;
  error = '';

  constructor(private route: ActivatedRoute, private service: PokemonService) {}

  async ngOnInit() {
    const query = this.route.snapshot.paramMap.get('query') ?? '';
    try {
      this.pokemon = await this.service.get(query);
    } catch {
      this.error = 'No encontramos ese Pokémon. Prueba con otro código.';
    }
    this.loading = false;
  }
}
