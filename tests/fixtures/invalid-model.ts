// tests/fixtures/invalid-model.ts
// Invalid model for testing error handling

// This model has no default export - should cause an error
export function someFunction() {
  return "not a model";
}

export const someConfig = {
  notAModel: true
};
