export type DensityUnitValue = "kg_m3" | "lb_ft3" | "lb_yd3" | "g_cm3" | "g_m3"

export type DensityUnit = { label: string; value: DensityUnitValue }

export type DensityGroupItem = { label: string; value: number }

export type DensityGroup = { label: string; items: DensityGroupItem[] }

export type PickerOption = { label: string; value: string; rightLabel?: string }

export type PickerState =
  | null
  | {
      title?: string
      showTitle?: boolean
      compact?: boolean
      align?: "center" | "left" | "right"
      verticalOffset?: number
      options: PickerOption[]
      value: string
      onSelect: (value: string) => void
      anchor: { x: number; y: number }
      width?: number
      maxHeight?: number
    }

export type CalculationResults = {
  unitWeightPerMeter: string
  pieceWeight: string
  totalWeight: string
  totalPrice: string
}
