<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'
import { Tree as Primitive, createTreeCollection } from '@destyler-ui/vue'
import { treeLabel, treeModel, treeState } from '../Tree'
import type { PropType } from 'vue'
import type { TreeNode, TreeProps } from '../Tree'

const props = defineProps<Omit<TreeProps, 'onExpandedChange' | 'onSelectionChange'>>()
const emit = defineEmits<{
  'update:expandedValue': [value: string[]]
  'update:selectedValue': [value: string[]]
  expandedChange: [value: string[]]
  selectionChange: [value: string[]]
}>()
const model = computed(() => treeModel(props.items))
const collection = computed(() => createTreeCollection({ rootNode: model.value.rootNode }))
function expand(event: { expandedValue: string[] }) {
  emit('update:expandedValue', [...event.expandedValue])
  emit('expandedChange', [...event.expandedValue])
}
function select(event: { selectedValue: string[] }) {
  emit('update:selectedValue', [...event.selectedValue])
  emit('selectionChange', [...event.selectedValue])
}

const Node = defineComponent({
  props: {
    node: { type: Object as PropType<TreeNode>, required: true },
    indexPath: { type: Array as PropType<number[]>, required: true },
  },
  setup(local) {
    return () => h(Primitive.NodeProvider, { node: local.node, indexPath: local.indexPath }, {
      default: () => local.node.children?.length
        ? h(Primitive.Branch, { 'aria-label': local.node.label }, { default: () => [
          h(Primitive.BranchControl, { 'aria-label': local.node.label }, { default: () => [
            h(Primitive.BranchTrigger, { 'aria-hidden': 'true' }, { default: () => h(Primitive.BranchIndicator, {}, () => '›') }),
            h(Primitive.BranchText, {}, () => local.node.label),
          ] }),
          h(Primitive.BranchContent, {}, () => local.node.children?.map(
            (child, index) => h(Node, { key: child.value, node: child, indexPath: [...local.indexPath, index] }),
          )),
        ] })
        : h(Primitive.Item, {}, () => [
          h(Primitive.ItemText, {}, () => local.node.label),
          h(Primitive.ItemIndicator, {}, () => '✓'),
        ]),
    })
  },
})
</script>

<template>
  <div class="rd-component rd-tree">
    <Primitive.Root :collection="collection" selection-mode="single" :expand-on-click="false"
      :expanded-value="treeState(expandedValue, model.branches, 'expanded')"
      :default-expanded-value="expandedValue === undefined ? treeState(defaultExpandedValue, model.branches, 'expanded') : undefined"
      :selected-value="treeState(selectedValue, model.selectable, 'selected')"
      :default-selected-value="selectedValue === undefined ? treeState(defaultSelectedValue, model.selectable, 'selected') : undefined"
      @expanded-change="expand" @selection-change="select">
      <Primitive.Label>{{ treeLabel(label) }}</Primitive.Label>
      <Primitive.Tree>
        <Node v-for="(node, index) in items" :key="node.value" :node="node" :index-path="[index]" />
      </Primitive.Tree>
    </Primitive.Root>
  </div>
</template>
