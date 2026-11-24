import { createMemo, For, Show } from 'solid-js'
import { Tree as Primitive, createTreeCollection } from '@destyler-ui/solid/tree'
import { treeLabel, treeModel, treeState } from '../Tree'
import type { TreeNode, TreeProps } from '../Tree'

export type { TreeNode, TreeProps } from '../Tree'

function Node(props: { node: TreeNode; indexPath: number[] }) {
  return <Primitive.NodeProvider node={props.node} indexPath={props.indexPath}>
    <Show when={props.node.children?.length} fallback={<Primitive.Item>
      <Primitive.ItemText>{props.node.label}</Primitive.ItemText><Primitive.ItemIndicator>✓</Primitive.ItemIndicator>
    </Primitive.Item>}>
      <Primitive.Branch aria-label={props.node.label}>
        <Primitive.BranchControl aria-label={props.node.label}>
          <Primitive.BranchTrigger aria-hidden="true"><Primitive.BranchIndicator>›</Primitive.BranchIndicator></Primitive.BranchTrigger>
          <Primitive.BranchText>{props.node.label}</Primitive.BranchText>
        </Primitive.BranchControl>
        <Primitive.BranchContent>
          <For each={props.node.children}>{(child, index) => <Node node={child} indexPath={[...props.indexPath, index()]} />}</For>
        </Primitive.BranchContent>
      </Primitive.Branch>
    </Show>
  </Primitive.NodeProvider>
}

export function Tree(props: TreeProps) {
  const model = createMemo(() => treeModel(props.items))
  const collection = createMemo(() => createTreeCollection({ rootNode: model().rootNode }))
  return <div class="rd-component rd-tree">
    <Primitive.Root collection={collection()} selectionMode="single" expandOnClick={false}
      expandedValue={treeState(props.expandedValue, model().branches, 'expanded')}
      defaultExpandedValue={props.expandedValue === undefined ? treeState(props.defaultExpandedValue, model().branches, 'expanded') : undefined}
      selectedValue={treeState(props.selectedValue, model().selectable, 'selected')}
      defaultSelectedValue={props.selectedValue === undefined ? treeState(props.defaultSelectedValue, model().selectable, 'selected') : undefined}
      onExpandedChange={event => props.onExpandedChange?.([...event.expandedValue])}
      onSelectionChange={event => props.onSelectionChange?.([...event.selectedValue])}>
      <Primitive.Label>{treeLabel(props.label)}</Primitive.Label>
      <Primitive.Tree>
        <For each={props.items}>{(node, index) => <Node node={node} indexPath={[index()]} />}</For>
      </Primitive.Tree>
    </Primitive.Root>
  </div>
}
