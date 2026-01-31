import type { Dims } from "../../hooks/useSidebarCalculations"
import type { FeaturedSectorInsert } from "../../lib/featured-sectors"

type ShareContext = {
  isDimsMode: boolean
  weightOfPieceKg: number
  priceOfPiece: number
  required: number
  totalWeightKg: number
  totalPrice: number
  linearMeterWeightKgPerM: number
  lengthMeters: number
  currencyCode: string
  sectorName?: string
}

type ShareUrlContext = {
  selectedSectionId: number | null
  selectedType: string
  selectedVariantIndex: number
  sliderValue: number
  isDimsMode: boolean
  dims: Dims
  pricePerKgInput: string
  requiredInput: string
  lengthInput: string
  lengthUnit: string
}

type FeaturedPayloadContext = {
  selectedSectionId: number | null
  selectedType: string
  selectedVariantIndex: number
  sliderValue: number
  dims: Dims
  lengthUnit: string
  lengthMeters: number
  pricePerKg: number
  required: number
  weightOfPieceKg: number
  totalWeightKg: number
  priceOfPiece: number
  totalPrice: number
  isDimsMode: boolean
}

export function buildShareMessage({
  isDimsMode,
  weightOfPieceKg,
  priceOfPiece,
  required,
  totalWeightKg,
  totalPrice,
  linearMeterWeightKgPerM,
  lengthMeters,
  currencyCode,
  sectorName,
}: ShareContext) {
  const makeWithOptionalSector = (body: string) => {
    if (sectorName && sectorName.trim().length > 0) {
      return `${sectorName.trim()}\n${body}`
    }
    return body
  }

  if (isDimsMode) {
    const body =
      `Weight: ${weightOfPieceKg.toFixed(2)} kg\n` +
      `Unit Price: ${priceOfPiece.toFixed(2)}\n` +
      `Required: ${required}\n` +
      `Total Wt: ${totalWeightKg.toFixed(2)} kg\n` +
      `Total: ${totalPrice.toFixed(2)} ${currencyCode}`

    return makeWithOptionalSector(body)
  }

  const body =
    `Linear Wt: ${linearMeterWeightKgPerM.toFixed(2)} kg/m\n` +
    `Length: ${lengthMeters.toFixed(2)} m\n` +
    `Unit Wt: ${weightOfPieceKg.toFixed(2)} kg\n` +
    `Unit Price: ${priceOfPiece.toFixed(2)}\n` +
    `Required: ${required}\n` +
    `Total Wt: ${totalWeightKg.toFixed(2)} kg\n` +
    `Total: ${totalPrice.toFixed(2)} ${currencyCode}`

  return makeWithOptionalSector(body)
}

export function buildShareUrl({
  selectedSectionId,
  selectedType,
  selectedVariantIndex,
  sliderValue,
  isDimsMode,
  dims,
  pricePerKgInput,
  requiredInput,
  lengthInput,
  lengthUnit,
}: ShareUrlContext) {
  const baseUrl = "https://iron-metal.net/"
  const params: string[] = []

  if (selectedSectionId != null) params.push(`sid=${encodeURIComponent(String(selectedSectionId))}`)
  if (selectedType) params.push(`type=${encodeURIComponent(selectedType)}`)
  if (Number.isFinite(selectedVariantIndex)) params.push(`vi=${encodeURIComponent(String(selectedVariantIndex))}`)
  if (Number.isFinite(sliderValue)) params.push(`sv=${encodeURIComponent(String(sliderValue))}`)

  if (isDimsMode) {
    if (dims.h != null) params.push(`h=${encodeURIComponent(String(dims.h))}`)
    if (dims.w != null) params.push(`w=${encodeURIComponent(String(dims.w))}`)
    if (dims.th != null) params.push(`th=${encodeURIComponent(String(dims.th))}`)
    if (dims.t != null) params.push(`t=${encodeURIComponent(String(dims.t))}`)
    if (dims.unit) params.push(`unit=${encodeURIComponent(dims.unit)}`)
    if (dims.density != null) params.push(`rho=${encodeURIComponent(String(dims.density))}`)
  }

  if (pricePerKgInput) params.push(`ppk=${encodeURIComponent(pricePerKgInput)}`)
  if (requiredInput) params.push(`req=${encodeURIComponent(requiredInput)}`)
  if (lengthInput) params.push(`len=${encodeURIComponent(lengthInput)}`)
  if (lengthUnit) params.push(`lunit=${encodeURIComponent(lengthUnit)}`)

  const query = params.join("&")
  return query ? `${baseUrl}?${query}` : baseUrl
}

export function buildFeaturedPayload({
  selectedSectionId,
  selectedType,
  selectedVariantIndex,
  sliderValue,
  dims,
  lengthUnit,
  lengthMeters,
  pricePerKg,
  required,
  weightOfPieceKg,
  totalWeightKg,
  priceOfPiece,
  totalPrice,
  isDimsMode,
}: FeaturedPayloadContext): FeaturedSectorInsert | null {
  if (selectedSectionId == null) return null

  return {
    section_id: selectedSectionId,
    section_type: selectedType || undefined,
    variant_index: Number.isFinite(selectedVariantIndex) ? selectedVariantIndex : undefined,
    slider_value: Number.isFinite(sliderValue) ? String(sliderValue) : undefined,
    price_per_kg: pricePerKg,
    required_pieces: required,
    length_value: lengthMeters,
    length_unit: lengthUnit,
    height: isDimsMode ? dims.h ?? undefined : undefined,
    width: isDimsMode ? dims.w ?? undefined : undefined,
    thickness: isDimsMode ? dims.th ?? undefined : undefined,
    hook_length: isDimsMode ? dims.t ?? undefined : undefined,
    dimension_unit: isDimsMode ? dims.unit ?? undefined : undefined,
    density: isDimsMode && dims.density ? Number.parseFloat(String(dims.density)) : undefined,
    unit_weight: weightOfPieceKg,
    total_weight: totalWeightKg,
    unit_price: priceOfPiece,
    total_cost: totalPrice,
    calc_type: isDimsMode ? "dims" : "linear",
  }
}
