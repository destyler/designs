import type { MouseEvent } from 'react'
import { Breadcrumbs as Primitive } from '@destyler-ui/react'
import { prepareBreadcrumbs } from '../Breadcrumbs'
import type { BreadcrumbsItem, BreadcrumbsProps } from '../Breadcrumbs'

export type { BreadcrumbsItem, BreadcrumbsProps } from '../Breadcrumbs'

export function Breadcrumbs({
  items, label = 'Breadcrumb', separator = '/', onNavigate,
}: BreadcrumbsProps & { onNavigate?: (event: MouseEvent<HTMLAnchorElement>, item: BreadcrumbsItem) => void }) {
  const trail = prepareBreadcrumbs(items)
  return <div className="rd-component">
    <Primitive.Root items={trail} aria-label={label}>
      <Primitive.List>
        {trail.map((item, index) => <Primitive.Item key={item.id} item={item} aria-label={undefined}>
          {index > 0 && <Primitive.Separator>{separator}</Primitive.Separator>}
          <Primitive.Link item={item} onClick={item.href ? event => onNavigate?.(event, item.source) : undefined}>
            {item.label}
          </Primitive.Link>
        </Primitive.Item>)}
      </Primitive.List>
    </Primitive.Root>
  </div>
}
