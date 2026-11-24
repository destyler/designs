import { createMemo, For, Show } from 'solid-js'
import { Breadcrumbs as Primitive } from '@destyler-ui/solid/breadcrumbs'
import { prepareBreadcrumbs } from '../Breadcrumbs'
import type { BreadcrumbsItem, BreadcrumbsProps } from '../Breadcrumbs'

export type { BreadcrumbsItem, BreadcrumbsProps } from '../Breadcrumbs'

export function Breadcrumbs(props: BreadcrumbsProps & { onNavigate?: (event: MouseEvent, item: BreadcrumbsItem) => void }) {
  const trail = createMemo(() => prepareBreadcrumbs(props.items))
  return <div class="rd-component">
    <Primitive.Root items={trail()} aria-label={props.label ?? 'Breadcrumb'}>
      <Primitive.List>
        <For each={trail()}>{(item, index) => <Primitive.Item item={item} aria-label={undefined}>
          <Show when={index() > 0}><Primitive.Separator>{props.separator ?? '/'}</Primitive.Separator></Show>
          <Primitive.Link item={item} onClick={(event: MouseEvent) => { if (item.href) props.onNavigate?.(event, item.source) }}>
            {item.label}
          </Primitive.Link>
        </Primitive.Item>}</For>
      </Primitive.List>
    </Primitive.Root>
  </div>
}
