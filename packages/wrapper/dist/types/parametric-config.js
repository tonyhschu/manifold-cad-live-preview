// Parameter builder helpers for ergonomics
export const P = {
    number: (value, min, max, step) => ({
        value,
        ...(min !== undefined && { min }),
        ...(max !== undefined && { max }),
        ...(step !== undefined && { step })
    }),
    boolean: (value) => ({ value }),
    select: (value, options) => {
        // Convert array to object format that Tweakpane expects
        const optionsObj = Array.isArray(options)
            ? options.reduce((acc, opt) => ({ ...acc, [opt]: opt }), {})
            : options;
        return { value, options: optionsObj };
    },
    string: (value) => ({ value }),
    color: (value) => ({
        value,
        color: { type: 'float' }
    }),
    // Custom UI helper - NOT YET IMPLEMENTED
    // See Issue #14: https://github.com/tonyhschu/manifold-cad-live-preview/issues/14
    /*
    custom: <T>(
      value: T,
      setup: CustomParam<T>['setup'],
      fallback?: TweakpaneParam
    ): CustomParam<T> => ({
      type: 'custom',
      value,
      setup,
      ...(fallback && { fallback })
    })
    */
};
// Config creation helper
export function createConfig(parameters, modelFn, metadata = {}) {
    return {
        parameters,
        generateModel: modelFn,
        ...metadata
    };
}
//# sourceMappingURL=parametric-config.js.map