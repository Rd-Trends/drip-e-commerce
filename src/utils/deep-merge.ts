/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item: unknown): item is Record<PropertyKey, unknown> {
  return Boolean(item) && typeof item === 'object' && !Array.isArray(item)
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export function deepMerge<T extends Record<PropertyKey, unknown>, R extends Record<PropertyKey, unknown>>(
  target: T,
  source: R,
): T & R {
  const output: Record<PropertyKey, unknown> = { ...target }
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      const sourceValue = source[key]
      const targetValue = target[key]

      if (isObject(sourceValue)) {
        if (!(key in target)) {
          Object.assign(output, { [key]: sourceValue })
        } else if (isObject(targetValue)) {
          output[key] = deepMerge(targetValue, sourceValue)
        } else {
          output[key] = sourceValue
        }
      } else {
        Object.assign(output, { [key]: sourceValue })
      }
    })
  }

  return output as T & R
}
