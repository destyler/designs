import { createMemo, createSignal, createUniqueId, For } from 'solid-js';
import { Dynamic as Primitive } from '@destyler-ui/solid/dynamic';
import { addDynamicTag, dynamicHint, dynamicTranslations, resolveDynamic, type DynamicProps } from '../Dynamic';

export function Dynamic(props: DynamicProps) {
  const config = createMemo(() => resolveDynamic(props));
  const hintId = `rd-dynamic-hint-${createUniqueId()}`;
  const [rejected, setRejected] = createSignal(false);

  return (
    <Primitive.Root class="rd-component rd-dynamic" defaultValue={config().defaultValue} disabled={props.disabled}
      name={props.name} max={config().maxTags} maxLength={config().maxLength} validate={config().validate} delimiter=""
      editable={false} translations={dynamicTranslations} onValueInvalid={() => setRejected(true)}
      onValueChange={({ value }) => { setRejected(false); props.onValueChange?.([...value]); }}>
      <Primitive.Label>{props.label}</Primitive.Label>
      <Primitive.Control>
        <Primitive.Context>{api => <>
          <For each={api().value}>{(value, index) => (
            <Primitive.Item value={value} index={index()}>
              <Primitive.ItemPreview>
                <Primitive.ItemText>{value}</Primitive.ItemText>
                <Primitive.ItemDeleteTrigger><span aria-hidden="true">×</span></Primitive.ItemDeleteTrigger>
              </Primitive.ItemPreview>
            </Primitive.Item>
          )}</For>
          <Primitive.Input aria-describedby={hintId} enterkeyhint="done" />
          <button class="rd-dynamic-add" type="button" disabled={props.disabled || api().count >= config().maxTags || !api().inputValue}
            onClick={() => addDynamicTag(api(), config().maxTags)}>Add</button>
          <Primitive.ClearTrigger>Clear all</Primitive.ClearTrigger>
          <span aria-hidden="true" class="rd-dynamic-count">{api().count}/{config().maxTags}</span>
        </>}</Primitive.Context>
      </Primitive.Control>
      <p class="rd-dynamic-hint" id={hintId}>{dynamicHint} Limit: {config().maxTags}.</p>
      <p class="rd-dynamic-error" role="status">{rejected() ? 'Use a unique tag within the length limit.' : ''}</p>
      <Primitive.HiddenInput />
    </Primitive.Root>
  );
}
