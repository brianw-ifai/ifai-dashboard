/** Lets node run the retail reading tests, which import extensionless TypeScript modules. */
export async function resolve(specifier, context, nextResolve) {
  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !/\.(?:ts|tsx|js|mjs|cjs|json)$/.test(specifier)
  ) {
    return nextResolve(`${specifier}.ts`, context);
  }
  return nextResolve(specifier, context);
}
