# Pokédex con Ionic Angular (escáner QR + PokeAPI)

Flujo (igual a tu boceto):
1. Pantalla 1: recuadro de cámara + botón **Escanear**.
2. Pantalla 2: nombre, imagen y datos del Pokémon escaneado.

El QR debe contener el **nombre** o el **número** del Pokémon (ej. `pikachu` o `25`).
En la carpeta `qr-pokemon/` hay QR de prueba.

## Instalación

```bash
npm install -g @ionic/cli
ionic start pokedex blank --type=angular   # elige "Standalone"
cd pokedex
npm install html5-qrcode
```

Copia la carpeta `src/` de este zip encima de la del proyecto (reemplaza `app.routes.ts` y la carpeta `home`).

```bash
ionic serve
```

## Android (celular real)

```bash
ionic build
npm install @capacitor/android
npx cap add android
npx cap sync
npx cap open android
```

En `android/app/src/main/AndroidManifest.xml` agrega:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.INTERNET" />
```

## Notas
- Los datos vienen de https://pokeapi.co (gratis, sin API key).
- En `ionic serve` la cámara solo funciona en `localhost` o HTTPS.
- Si no tienes cámara a mano, usa el campo "Búsqueda manual".
