<script lang="ts">
  import { Tree as Primitive, createTreeCollection } from '@destyler-ui/svelte/tree'
  import { treeLabel, treeModel, treeState } from '../Tree'
  import type { TreeNode, TreeProps } from '../Tree'

  let { label, items, expandedValue, defaultExpandedValue, selectedValue, defaultSelectedValue,
    onExpandedChange, onSelectionChange }: TreeProps = $props()
  const model = $derived(treeModel(items))
  const collection = $derived(createTreeCollection({ rootNode: model.rootNode }))
</script>

{#snippet renderNode(node: TreeNode, indexPath: number[])}
  <Primitive.NodeProvider {node} {indexPath}>
    {#if node.children?.length}
      <Primitive.Branch aria-label={node.label}>
        <Primitive.BranchControl aria-label={node.label}>
          <Primitive.BranchTrigger aria-hidden="true"><Primitive.BranchIndicator>›</Primitive.BranchIndicator></Primitive.BranchTrigger>
          <Primitive.BranchText>{node.label}</Primitive.BranchText>
        </Primitive.BranchControl>
        <Primitive.BranchContent>
          {#each node.children as child, index (child.value)}
            {@render renderNode(child, [...indexPath, index])}
          {/each}
        </Primitive.BranchContent>
      </Primitive.Branch>
    {:else}
      <Primitive.Item><Primitive.ItemText>{node.label}</Primitive.ItemText><Primitive.ItemIndicator>✓</Primitive.ItemIndicator></Primitive.Item>
    {/if}
  </Primitive.NodeProvider>
{/snippet}

<div class="rd-component rd-tree">
  <Primitive.Root {collection} selectionMode="single" expandOnClick={false}
    expandedValue={treeState(expandedValue, model.branches, 'expanded')}
    defaultExpandedValue={expandedValue === undefined ? treeState(defaultExpandedValue, model.branches, 'expanded') : undefined}
    selectedValue={treeState(selectedValue, model.selectable, 'selected')}
    defaultSelectedValue={selectedValue === undefined ? treeState(defaultSelectedValue, model.selectable, 'selected') : undefined}
    onExpandedChange={event => onExpandedChange?.([...event.expandedValue])}
    onSelectionChange={event => onSelectionChange?.([...event.selectedValue])}>
    <Primitive.Label>{treeLabel(label)}</Primitive.Label>
    <Primitive.Tree>
      {#each items as node, index (node.value)}{@render renderNode(node, [index])}{/each}
    </Primitive.Tree>
  </Primitive.Root>
</div>
