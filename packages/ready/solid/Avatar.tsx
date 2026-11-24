import { createMemo, Show } from 'solid-js';
import { Avatar as Primitive } from '@destyler-ui/solid';
import { resolveAvatar, type AvatarProps } from '../Avatar';

export function Avatar(props: AvatarProps) {
  const resolved = createMemo(() => resolveAvatar(props));
  return <Show when={`src:${resolved().source ?? ''}`} keyed>{(_key) =>
    <Primitive.Root class="rd-component rd-avatar" role={resolved().label ? 'img' : undefined} aria-label={resolved().label} aria-hidden={resolved().label ? undefined : true}>
      <Show when={resolved().source}>{source => <Primitive.Image src={source()} alt="" aria-hidden="true" />}</Show>
      <Primitive.Fallback aria-hidden="true">{resolved().text}</Primitive.Fallback>
    </Primitive.Root>
  }</Show>;
}
