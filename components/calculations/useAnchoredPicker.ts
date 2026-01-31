import { useCallback, useState } from "react"
import type { PickerOption, PickerState } from "./types"

export type OpenPickerArgs = {
  title?: string
  showTitle?: boolean
  compact?: boolean
  options: PickerOption[]
  value: string
  onSelect: (value: string) => void
  width?: number
  maxHeight?: number
}

type Params = {
  screenWidth: number
  screenHeight: number
}

export function useAnchoredPicker({ screenWidth, screenHeight }: Params) {
  const [picker, setPicker] = useState<PickerState>(null)

  const closePicker = useCallback(() => setPicker(null), [])

  const openPicker = useCallback(
    (args: OpenPickerArgs & { anchor?: { x: number; y: number } }) => {
      setPicker({
        ...args,
        anchor: args.anchor ?? { x: screenWidth / 2, y: screenHeight / 2 },
      })
    },
    [screenWidth, screenHeight],
  )

  const openPickerFromNode = useCallback(
    (node: any, args: OpenPickerArgs) => {
      if (!node || typeof node.measureInWindow !== "function") {
        openPicker({ ...args })
        return
      }

      node.measureInWindow((x: number, y: number, w: number, h: number) => {
        openPicker({
          ...args,
          anchor: { x: x + w / 2, y: y + h },
        })
      })
    },
    [openPicker],
  )

  return {
    picker,
    openPicker,
    openPickerFromNode,
    closePicker,
    setPicker,
  }
}
