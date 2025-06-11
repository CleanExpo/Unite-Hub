import { Bundle } from '../../models/bundle';
import { optimizeBundle } from '../../helpers/bundle-optimizer';

export function optimizeBundles(bundles: Bundle[]): void {
  bundles.forEach(bundle => {
    try {
      optimizeBundle(bundle);
    } catch (error) {
      console.error(`Error optimizing bundle ${bundle.name}: ${error.message}`);
    }
  });
}