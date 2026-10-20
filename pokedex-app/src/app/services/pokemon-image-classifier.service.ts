import { Injectable } from '@angular/core';
import * as ort from 'onnxruntime-web/wasm';

@Injectable({ providedIn: 'root' })
export class PokemonImageClassifierService {
  private readonly modelUrl =
    'https://huggingface.co/BiernyVR/pokemon-classifier-mobilenetv3/resolve/3bf528cf0f6ab8464ea3bac0f70d84886e8dab25/pokemon_classifier.onnx';
  private sessionPromise?: Promise<ort.InferenceSession>;

  async load(): Promise<void> {
    await this.getSession();
  }

  async recognize(video: HTMLVideoElement): Promise<number | null> {
    const session = await this.getSession();
    const input = this.createInput(video);
    const inputName = session.inputNames[0];
    const outputName = session.outputNames[0];

    if (!inputName || !outputName) {
      throw new Error('El modelo de reconocimiento no tiene entradas o salidas válidas.');
    }

    const results = await session.run({
      [inputName]: new ort.Tensor('float32', input, [1, 3, 224, 224]),
    });
    const logits = results[outputName]?.data;

    if (!(logits instanceof Float32Array) || logits.length !== 151) {
      throw new Error('El modelo devolvió un resultado inesperado.');
    }

    let bestIndex = -1;
    let bestScore = Number.NEGATIVE_INFINITY;
    let secondBestScore = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < logits.length; i++) {
      const score = logits[i];
      if (score > bestScore) {
        secondBestScore = bestScore;
        bestScore = score;
        bestIndex = i;
      } else if (score > secondBestScore) {
        secondBestScore = score;
      }
    }

    return bestScore >= 3 && bestScore - secondBestScore >= 2
      ? bestIndex + 1
      : null;
  }

  private async getSession(): Promise<ort.InferenceSession> {
    if (!this.sessionPromise) {
      this.sessionPromise = this.loadSession().catch((error: unknown) => {
        this.sessionPromise = undefined;
        throw error;
      });
    }

    return this.sessionPromise;
  }

  private async loadSession(): Promise<ort.InferenceSession> {
    ort.env.wasm.wasmPaths = new URL('assets/onnxruntime/', document.baseURI).href;

    const modelCache =
      typeof caches === 'undefined' ? undefined : await caches.open('pokemon-classifier-v1');
    let response = await modelCache?.match(this.modelUrl);

    if (!response) {
      response = await fetch(this.modelUrl);
      if (response.ok && modelCache) {
        try {
          await modelCache.put(this.modelUrl, response.clone());
        } catch (error) {
          console.warn('No se pudo guardar el modelo para el próximo escaneo.', error);
        }
      }
    }

    if (!response.ok) {
      throw new Error(`No se pudo descargar el modelo de reconocimiento (${response.status}).`);
    }

    const model = await response.arrayBuffer();
    return ort.InferenceSession.create(model, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
  }

  private createInput(video: HTMLVideoElement): Float32Array {
    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      throw new Error('No se pudo preparar la imagen de la cámara.');
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const input = new Float32Array(3 * canvas.width * canvas.height);
    const channelSize = canvas.width * canvas.height;
    const means = [0.485, 0.456, 0.406];
    const standardDeviations = [0.229, 0.224, 0.225];

    for (let pixel = 0; pixel < channelSize; pixel++) {
      for (let channel = 0; channel < 3; channel++) {
        const value = pixels[pixel * 4 + channel] / 255;
        input[channel * channelSize + pixel] =
          (value - means[channel]) / standardDeviations[channel];
      }
    }

    return input;
  }
}
