import type { JSX } from 'solid-js'

// Small local decorative SVGs; no icon dependency or network asset is required.
type IconProps = JSX.SvgSVGAttributes<SVGSVGElement>
function Icon(props: IconProps & { path: string }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" {...props}><path d={props.path} /></svg>
}
export const CheckIcon = (props: IconProps) => <Icon {...props} path="m5 12 4 4L19 6" />
export const ClipboardCopyIcon = (props: IconProps) => <Icon {...props} path="M9 5H6v16h14V5h-3M9 3h8v4H9z" />
export const ChevronDownIcon = (props: IconProps) => <Icon {...props} path="m6 9 6 6 6-6" />
export const ChevronRightIcon = (props: IconProps) => <Icon {...props} path="m9 6 6 6-6 6" />
export const XIcon = (props: IconProps) => <Icon {...props} path="m6 6 12 12M6 18 18 6" />
export const BoldIcon = (props: IconProps) => <Icon {...props} path="M6 4h7a4 4 0 0 1 0 8H6V4Zm0 8h8a4 4 0 0 1 0 8H6v-8Z" />
export const CheckSquareIcon = (props: IconProps) => <Icon {...props} path="M21 11v9H3V3h13M7 10l4 4L21 4" />
export const FileIcon = (props: IconProps) => <Icon {...props} path="M14 2H4v20h16V8l-6-6ZM14 2v6h6" />
export const FolderIcon = (props: IconProps) => <Icon {...props} path="M3 5h6l2 2h10v14H3V5Z" />
