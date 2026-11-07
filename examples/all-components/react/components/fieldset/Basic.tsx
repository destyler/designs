import { Fieldset, Field } from "@destyler-ui/react";
export function Basic() {
  return (
    <Fieldset.Root invalid>
      <Fieldset.Legend>Legend</Fieldset.Legend>
      <Fieldset.HelperText>Fieldset Helper Text</Fieldset.HelperText>
      <Fieldset.ErrorText>Fieldset Error Text</Fieldset.ErrorText>
      <Field.Root>
        <Field.Label>Label</Field.Label>
        <Field.Input />
        <Field.HelperText>Field Helper Text</Field.HelperText>
      </Field.Root>
    </Fieldset.Root>
  );
}
