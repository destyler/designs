import { useMemo } from 'react'
import { Tree as Primitive, createTreeCollection } from '@destyler-ui/react'
import { treeLabel, treeModel, treeState } from '../Tree'
import type { TreeNode, TreeProps } from '../Tree'

export type { TreeNode, TreeProps } from '../Tree'

function Node({ node, indexPath }: { node: TreeNode; indexPath: number[] }) {
  return <Primitive.NodeProvider node={node} indexPath={indexPath}>
    {node.children?.length ? <Primitive.Branch aria-label={node.label}>
      <Primitive.BranchControl aria-label={node.label}>
        <Primitive.BranchTrigger aria-hidden="true"><Primitive.BranchIndicator>›</Primitive.BranchIndicator></Primitive.BranchTrigger>
        <Primitive.BranchText>{node.label}</Primitive.BranchText>
      </Primitive.BranchControl>
      <Primitive.BranchContent>
        {node.children.map((child, index) => <Node key={child.value} node={child} indexPath={[...indexPath, index]} />)}
      </Primitive.BranchContent>
    </Primitive.Branch> : <Primitive.Item>
      <Primitive.ItemText>{node.label}</Primitive.ItemText><Primitive.ItemIndicator>✓</Primitive.ItemIndicator>
    </Primitive.Item>}
  </Primitive.NodeProvider>
}

export function Tree(props: TreeProps) {
  const label = treeLabel(props.label)
  const model = useMemo(() => treeModel(props.items), [props.items])
  const collection = useMemo(() => createTreeCollection({ rootNode: model.rootNode }), [model])
  return <div className="rd-component rd-tree">
    <Primitive.Root collection={collection} selectionMode="single" expandOnClick={false}
      expandedValue={treeState(props.expandedValue, model.branches, 'expanded')}
      defaultExpandedValue={props.expandedValue === undefined ? treeState(props.defaultExpandedValue, model.branches, 'expanded') : undefined}
      selectedValue={treeState(props.selectedValue, model.selectable, 'selected')}
      defaultSelectedValue={props.selectedValue === undefined ? treeState(props.defaultSelectedValue, model.selectable, 'selected') : undefined}
      onExpandedChange={event => props.onExpandedChange?.([...event.expandedValue])}
      onSelectionChange={event => props.onSelectionChange?.([...event.selectedValue])}>
      <Primitive.Label>{label}</Primitive.Label>
      <Primitive.Tree>
        {props.items.map((node, index) => <Node key={node.value} node={node} indexPath={[index]} />)}
      </Primitive.Tree>
    </Primitive.Root>
  </div>
}
