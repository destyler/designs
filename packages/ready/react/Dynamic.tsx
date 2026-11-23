import { useId, useState } from 'react';
import { Dynamic as Primitive } from '@destyler-ui/react';
import { addDynamicTag, dynamicHint, dynamicTranslations, resolveDynamic, type DynamicProps } from '../Dynamic';

export function Dynamic(props: DynamicProps) {
  const config = resolveDynamic(props);
  const hintId = useId();
  const [rejected, setRejected] = useState(false);

  return (
    <Primitive.Root className="rd-component rd-dynamic" defaultValue={config.defaultValue} disabled={props.disabled}
      name={props.name} max={config.maxTags} maxLength={config.maxLength} validate={config.validate} delimiter=""
      editable={false} translations={dynamicTranslations} onValueInvalid={() => setRejected(true)}
      onValueChange={({ value }) => { setRejected(false); props.onValueChange?.([...value]); }}>
      <Primitive.Label>{props.label}</Primitive.Label>
      <Primitive.Control>
        <Primitive.Context>{api => <>
          {api.value.map((value, index) => (
            <Primitive.Item key={value} value={value} index={index}>
              <Primitive.ItemPreview>
                <Primitive.ItemText>{value}</Primitive.ItemText>
                <Primitive.ItemDeleteTrigger><span aria-hidden="true">×</span></Primitive.ItemDeleteTrigger>
              </Primitive.ItemPreview>
            </Primitive.Item>
          ))}
          <Primitive.Input aria-describedby={hintId} enterKeyHint="done" />
          <button className="rd-dynamic-add" type="button" disabled={props.disabled || api.count >= config.maxTags || !api.inputValue}
            onClick={() => addDynamicTag(api, config.maxTags)}>Add</button>
          <Primitive.ClearTrigger>Clear all</Primitive.ClearTrigger>
          <span aria-hidden="true" className="rd-dynamic-count">{api.count}/{config.maxTags}</span>
        </>}</Primitive.Context>
      </Primitive.Control>
      <p className="rd-dynamic-hint" id={hintId}>{dynamicHint} Limit: {config.maxTags}.</p>
      <p className="rd-dynamic-error" role="status">{rejected ? 'Use a unique tag within the length limit.' : ''}</p>
      <Primitive.HiddenInput />
    </Primitive.Root>
  );
}
