export type AspectRatioProps = {
  /** Width divided by height. Uses a square when omitted. */
  ratio?: number;
}

/** Preserve the primitive's percentage geometry; reject unusable JS inputs. */
export function validateAspectRatio(ratio: number | undefined = 1): number {
  if (!Number.isFinite(ratio) || ratio <= 0 || !Number.isFinite((1 / ratio) * 100)) {
    throw new RangeError('Ready AspectRatio: ratio must be a positive, finite width-to-height number with a finite percentage height');
  }
  return ratio;
}
