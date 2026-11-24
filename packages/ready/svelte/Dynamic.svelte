<script lang="ts">
  import { Dynamic as Primitive } from '@destyler-ui/svelte/dynamic';
  import { addDynamicTag, dynamicHint, dynamicTranslations, resolveDynamic, type DynamicProps } from '../Dynamic';

  const props: DynamicProps = $props();
  const id = $props.id();
  const hintId = `${id}-hint`;
  let rejected = $state(false);
  const config = $derived(resolveDynamic(props));
</script>

<Primitive.Root class="rd-component rd-dynamic" defaultValue={config.defaultValue} disabled={props.disabled}
  name={props.name} max={config.maxTags} maxLength={config.maxLength} validate={config.validate} delimiter=""
  editable={false} translations={dynamicTranslations} onValueInvalid={() => { rejected = true; }}
  onValueChange={({ value }) => { rejected = false; props.onValueChange?.([...value]); }}>
  <Primitive.Label>{props.label}</Primitive.Label>
  <Primitive.Control>
    <Primitive.Context>
      {#snippet render(api)}
        {#each api().value as value, index (value)}
          <Primitive.Item {value} {index}>
            <Primitive.ItemPreview>
              <Primitive.ItemText>{value}</Primitive.ItemText>
              <Primitive.ItemDeleteTrigger><span aria-hidden="true">×</span></Primitive.ItemDeleteTrigger>
            </Primitive.ItemPreview>
          </Primitive.Item>
        {/each}
        <Primitive.Input aria-describedby={hintId} enterkeyhint="done" />
        <button class="rd-dynamic-add" type="button" disabled={props.disabled || api().count >= config.maxTags || !api().inputValue}
          onclick={() => addDynamicTag(api(), config.maxTags)}>Add</button>
        <Primitive.ClearTrigger>Clear all</Primitive.ClearTrigger>
        <span aria-hidden="true" class="rd-dynamic-count">{api().count}/{config.maxTags}</span>
      {/snippet}
    </Primitive.Context>
  </Primitive.Control>
  <p class="rd-dynamic-hint" id={hintId}>{dynamicHint} Limit: {config.maxTags}.</p>
  <p class="rd-dynamic-error" role="status">{rejected ? 'Use a unique tag within the length limit.' : ''}</p>
  <Primitive.HiddenInput />
</Primitive.Root>
