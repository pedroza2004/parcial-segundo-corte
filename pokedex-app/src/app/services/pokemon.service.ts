import { Injectable } from '@angular/core';

export interface Pokemon {
  id: number;
  name: string;
  image: string;
  types: string[];
  height: number; // metros
  weight: number; // kg
  abilities: string[];
  stats: { name: string; value: number }[];
}

const STAT_NAMES: Record<string, string> = {
  hp: 'HP',
  attack: 'Ataque',
  defense: 'Defensa',
  'special-attack': 'Ataque esp.',
  'special-defense': 'Defensa esp.',
  speed: 'Velocidad',
};

@Injectable({ providedIn: 'root' })
export class PokemonService {
  private readonly base = 'https://pokeapi.co/api/v2/pokemon/';

  async get(query: string | number): Promise<Pokemon> {
    const res = await fetch(this.base + String(query).toLowerCase().trim());
    if (!res.ok) throw new Error('Pokémon no encontrado');
    const d = await res.json();

    return {
      id: d.id,
      name: d.name,
      image:
        d.sprites?.other?.['official-artwork']?.front_default ??
        d.sprites?.front_default ??
        '',
      types: d.types.map((t: any) => t.type.name),
      height: d.height / 10,
      weight: d.weight / 10,
      abilities: d.abilities.map((a: any) => a.ability.name),
      stats: d.stats.map((s: any) => ({
        name: STAT_NAMES[s.stat.name] ?? s.stat.name,
        value: s.base_stat,
      })),
    };
  }
}
