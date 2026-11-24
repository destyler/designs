import { Avatar as Primitive } from '@destyler-ui/react';
import { resolveAvatar, type AvatarProps } from '../Avatar';

export function Avatar(props: AvatarProps) {
  const { source, label, text } = resolveAvatar(props);
  // A different URL starts a fresh primitive image state, not a visible stale image.
  return <Primitive.Root key={source ?? ''} className="rd-component rd-avatar" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
    {source && <Primitive.Image src={source} alt="" aria-hidden="true" />}
    <Primitive.Fallback aria-hidden="true">{text}</Primitive.Fallback>
  </Primitive.Root>;
}
