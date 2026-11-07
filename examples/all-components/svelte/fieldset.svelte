<script module lang="ts">
  import type { FieldsetRootProps } from '@destyler-ui/svelte/fieldset'

  export interface BasicProps extends FieldsetRootProps {}
</script>

<script lang="ts">
  import { Field } from '@destyler-ui/svelte/field'
  import { Fieldset } from '@destyler-ui/svelte/fieldset'

  const props: BasicProps = $props()
</script>

<Fieldset.Root invalid {...props}>
  <Fieldset.Legend>Legend</Fieldset.Legend>
  <Fieldset.HelperText>Fieldset Helper Text</Fieldset.HelperText>
  <Fieldset.ErrorText>Fieldset Error Text</Fieldset.ErrorText>
  <Field.Root>
    <Field.Label>Label</Field.Label>
    <Field.Input />
    <Field.HelperText>Field Helper Text</Field.HelperText>
  </Field.Root>
</Fieldset.Root>
