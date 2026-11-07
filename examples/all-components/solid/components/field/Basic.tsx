import { Field } from "@destyler-ui/solid";
export function Basic() {
  return (
    <Field.Root invalid required>
      <Field.Label>
        Label <Field.RequiredIndicator />
      </Field.Label>
      <Field.Input />
      <Field.HelperText>Some additional Info</Field.HelperText>
      <Field.ErrorText>Error Info</Field.ErrorText>
    </Field.Root>
  );
}
