import { toNumber } from "./numeric"
import type { CalculationResults } from "./types"

type Params = {
  formula: string
  dims: any
  qty: number
  price: number | null
  getUnitForKey: (key: string) => string
}

export const calculateResultsEngine = ({ formula, dims, qty, price, getUnitForKey }: Params): CalculationResults => {
  const getScale = (u?: string) => {
    switch (u) {
      case "m":
        return 1000
      case "ft":
        return 304.8
      case "in":
        return 25.4
      default:
        return 1
    }
  }

  const L_mm = toNumber(dims.h) * getScale(getUnitForKey("h"))
  const B_mm = toNumber(dims.tf) * getScale(getUnitForKey("tf"))
  const H_mm = toNumber(dims.tw) * getScale(getUnitForKey("tw"))
  const T_mm = toNumber(dims.t) * getScale(getUnitForKey("t"))
  const R_mm = toNumber(dims.r) * getScale(getUnitForKey("r"))
  const S_mm = toNumber(dims.s) * getScale(getUnitForKey("s"))
  const U_mm = toNumber(dims.u) * getScale(getUnitForKey("u"))

  const density_g_cm3 = toNumber(dims.density) || 7.85

  let pieceWeightKg = 0
  let unitWeightKgPerM = 0

  switch (formula) {
    case "strip":
      pieceWeightKg = (B_mm * L_mm * H_mm * density_g_cm3) / 1000000
      unitWeightKgPerM = (B_mm * 1000 * H_mm * density_g_cm3) / 1000000
      break
    case "round_bar":
      pieceWeightKg = 0.006165 * Math.pow(B_mm, 2) * (L_mm / 1000)
      unitWeightKgPerM = 0.006165 * Math.pow(B_mm, 2)
      break
    case "equal_angle":
      const Side_m = B_mm / 1000
      const T_m_angle = T_mm / 1000
      const L_m_angle = L_mm / 1000
      const area_m2 = 2 * Side_m * T_m_angle - T_m_angle * T_m_angle
      unitWeightKgPerM = area_m2 * (density_g_cm3 * 1000)
      pieceWeightKg = unitWeightKgPerM * L_m_angle
      break
    case "plate":
      const L_plate = L_mm / 1000
      const W_plate = B_mm / 1000
      const T_plate = H_mm / 1000
      pieceWeightKg = L_plate * W_plate * T_plate * (density_g_cm3 * 1000)
      unitWeightKgPerM = W_plate * T_plate * (density_g_cm3 * 1000)
      break
    case "u_channel":
      const H_uchannel = B_mm
      const W_uchannel = H_mm
      const TW_uchannel = T_mm
      const TF_uchannel = R_mm
      const R_uchannel = S_mm
      const L_m_uchannel = L_mm / 1000
      const area_rects = 2 * (W_uchannel * TF_uchannel) + (H_uchannel - 2 * TF_uchannel) * TW_uchannel
      let area_corners = 0
      if (R_uchannel > 0) {
        const Ri = R_uchannel
        const Ro = R_uchannel + TW_uchannel
        area_corners = 2 * (Math.PI / 4) * (Math.pow(Ro, 2) - Math.pow(Ri, 2))
      }
      const total_area_mm2 = area_rects + area_corners
      unitWeightKgPerM = total_area_mm2 * 0.00785 * (density_g_cm3 / 7.85)
      pieceWeightKg = unitWeightKgPerM * L_m_uchannel
      break
    case "round_tube":
      const OD = B_mm
      const T_roundtube = H_mm
      const L_m_roundtube = L_mm / 1000
      const ID = OD - 2 * T_roundtube
      const area_roundtube = (Math.PI / 4) * (Math.pow(OD, 2) - Math.pow(ID, 2))
      unitWeightKgPerM = area_roundtube * 0.00785 * (density_g_cm3 / 7.85)
      pieceWeightKg = unitWeightKgPerM * L_m_roundtube
      break
    case "rebar":
      const D_rebar = B_mm
      const L_m_rebar = L_mm / 1000
      unitWeightKgPerM = (Math.pow(D_rebar, 2) / 162) * (density_g_cm3 / 7.85)
      pieceWeightKg = unitWeightKgPerM * L_m_rebar
      break
    case "flat_bar":
      const B_flatbar = B_mm
      const T_flatbar = H_mm
      const L_m_flatbar = L_mm / 1000
      const area_flatbar = B_flatbar * T_flatbar
      unitWeightKgPerM = area_flatbar * 0.00785 * (density_g_cm3 / 7.85)
      pieceWeightKg = unitWeightKgPerM * L_m_flatbar
      break
    case "hex_bar":
      const AF_hexbar = B_mm
      const L_m_hexbar = L_mm / 1000
      const area_hexbar = (Math.sqrt(3) / 2) * Math.pow(AF_hexbar, 2)
      unitWeightKgPerM = area_hexbar * 0.00785 * (density_g_cm3 / 7.85)
      pieceWeightKg = unitWeightKgPerM * L_m_hexbar
      break
    case "hex_tube":
      const AF_out_hextube = B_mm
      const T_hextube = H_mm
      const L_m_hextube = L_mm / 1000
      const AF_in_hextube = AF_out_hextube - 2 * T_hextube
      const area_hextube =
        (Math.sqrt(3) / 2) * (Math.pow(AF_out_hextube, 2) - Math.pow(AF_in_hextube, 2))
      unitWeightKgPerM = area_hextube * 0.00785 * (density_g_cm3 / 7.85)
      pieceWeightKg = unitWeightKgPerM * L_m_hextube
      break
    case "square_bar":
      const S_squarebar = B_mm
      const L_m_squarebar = L_mm / 1000
      const area_squarebar = Math.pow(S_squarebar, 2)
      unitWeightKgPerM = area_squarebar * 0.00785 * (density_g_cm3 / 7.85)
      pieceWeightKg = unitWeightKgPerM * L_m_squarebar
      break
    case "square_tube":
      const S_out_squaretube = B_mm
      const T_squaretube = H_mm
      const L_m_squaretube = L_mm / 1000
      const S_in_squaretube = S_out_squaretube - 2 * T_squaretube
      const area_squaretube = Math.pow(S_out_squaretube, 2) - Math.pow(S_in_squaretube, 2)
      unitWeightKgPerM = area_squaretube * 0.00785 * (density_g_cm3 / 7.85)
      pieceWeightKg = unitWeightKgPerM * L_m_squaretube
      break
    case "solid_sphere":
      const D_sphere = B_mm
      const radius_m = D_sphere / 1000 / 2
      const volume_m3 = (4 / 3) * Math.PI * Math.pow(radius_m, 3)
      pieceWeightKg = volume_m3 * (density_g_cm3 * 1000)
      unitWeightKgPerM = pieceWeightKg
      break
    case "rect_tube":
      const W_out_recttube = B_mm
      const H_out_recttube = H_mm
      const T_recttube = T_mm
      const L_m_recttube = L_mm / 1000
      const W_in_recttube = W_out_recttube - 2 * T_recttube
      const H_in_recttube = H_out_recttube - 2 * T_recttube
      const area_recttube = W_out_recttube * H_out_recttube - W_in_recttube * H_in_recttube
      unitWeightKgPerM = area_recttube * 0.00785 * (density_g_cm3 / 7.85)
      pieceWeightKg = unitWeightKgPerM * L_m_recttube
      break

    case "cone_frustum":
      const D1_cone = B_mm
      const D2_cone = H_mm
      const H_cone = L_mm
      const T_cone = T_mm
      const R1_cone = D1_cone / 2
      const R2_cone = D2_cone / 2
      const deltaR_cone = R1_cone - R2_cone
      const L_cone = Math.sqrt(Math.pow(H_cone, 2) + Math.pow(deltaR_cone, 2))
      const area_cone = Math.PI * (R1_cone + R2_cone) * L_cone
      const volumeMm3_cone = area_cone * T_cone
      const volumeM3_cone = volumeMm3_cone / 1_000_000_000
      pieceWeightKg = volumeM3_cone * (density_g_cm3 * 1000)
      unitWeightKgPerM = pieceWeightKg
      break

    case "t_section":
      const B_t = B_mm
      const TF_t = R_mm
      const H_t = H_mm
      const TW_t = T_mm
      const L_m_t = L_mm / 1000
      const webHeight_t = H_t - TF_t
      const area_t = B_t * TF_t + TW_t * webHeight_t
      unitWeightKgPerM = area_t * 0.00785 * (density_g_cm3 / 7.85)
      pieceWeightKg = unitWeightKgPerM * L_m_t
      break

    case "lipped_c_channel":
      const H_lipped = H_mm
      const B_lipped = B_mm
      const L_lipped = R_mm
      const T_lipped = T_mm
      const L_m_lipped = L_mm / 1000
      const area_lipped =
        H_lipped * T_lipped +
        2 * B_lipped * T_lipped +
        2 * L_lipped * T_lipped -
        4 * T_lipped * T_lipped
      unitWeightKgPerM = area_lipped * 0.00785 * (density_g_cm3 / 7.85)
      pieceWeightKg = unitWeightKgPerM * L_m_lipped
      break

    case "steel_grating":
      const mode_grating = dims.calcMode || "weight"
      const L_m_grating = L_mm / 1000
      const W_m_grating = B_mm / 1000
      if (mode_grating === "weight") {
        const weightPerM2_grating = Number(dims.tw) || 0
        pieceWeightKg = L_m_grating * W_m_grating * weightPerM2_grating
      } else {
        const hb_grating = H_mm
        const tb_grating = T_mm
        const sb_grating = R_mm
        const dc_grating = S_mm
        const sc_grating = U_mm
        const bearingArea_grating = hb_grating * tb_grating
        const bearingKgPerM_grating = bearingArea_grating * 0.00785 * (density_g_cm3 / 7.85)
        const bearingCount_grating =
          sb_grating > 0 && B_mm > 0 ? Math.max(1, Math.round(B_mm / sb_grating)) : 0
        const bearingWeight_grating = bearingKgPerM_grating * L_m_grating * bearingCount_grating

        const crossArea_grating = (Math.PI / 4) * Math.pow(dc_grating, 2)
        const crossKgPerM_grating = crossArea_grating * 0.00785 * (density_g_cm3 / 7.85)
        const crossCount_grating =
          sc_grating > 0 && L_mm > 0 ? Math.max(1, Math.round(L_mm / sc_grating)) : 0
        const crossLength_grating = W_m_grating
        const crossWeight_grating = crossKgPerM_grating * crossLength_grating * crossCount_grating

        pieceWeightKg = bearingWeight_grating + crossWeight_grating
      }

      unitWeightKgPerM = L_m_grating > 0 ? pieceWeightKg / L_m_grating : 0
      break

    case "hat_channel":
      const A_hat = B_mm
      const H_hat = H_mm
      const B_hat = R_mm
      const L_hat = S_mm
      const T_hat = T_mm
      const L_m_hat = L_mm / 1000
      const developedWidth_hat = A_hat + 2 * H_hat + 2 * B_hat + 2 * L_hat
      const area_hat = developedWidth_hat * T_hat
      unitWeightKgPerM = area_hat * 0.00785 * (density_g_cm3 / 7.85)
      pieceWeightKg = unitWeightKgPerM * L_m_hat
      break

    case "wire_mesh":
      const mode_mesh = dims.calcMode || "weight"
      const L_m_mesh = L_mm / 1000
      const W_m_mesh = B_mm / 1000
      if (mode_mesh === "weight") {
        const weightPerM2_mesh = Number(dims.tw) || 0
        pieceWeightKg = L_m_mesh * W_m_mesh * weightPerM2_mesh
      } else {
        const d_mesh = H_mm
        const p1_mesh = R_mm
        const p2_mesh = S_mm
        const wireArea_mesh = (Math.PI / 4) * Math.pow(d_mesh, 2)
        const wireKgPerM_mesh = wireArea_mesh * 0.00785 * (density_g_cm3 / 7.85)
        const lengthPerM2_mesh = (p1_mesh > 0 ? 1000 / p1_mesh : 0) + (p2_mesh > 0 ? 1000 / p2_mesh : 0)
        const weightPerM2_mesh = wireKgPerM_mesh * lengthPerM2_mesh
        pieceWeightKg = L_m_mesh * W_m_mesh * weightPerM2_mesh
      }

      unitWeightKgPerM = L_m_mesh > 0 ? pieceWeightKg / L_m_mesh : 0
      break

    case "z_channel":
      const H_z = H_mm
      const B1_z = B_mm
      const B2_z = R_mm
      const L1_z = S_mm
      const L2_z = U_mm
      const T_z = T_mm
      const L_m_z = L_mm / 1000
      const developedWidth_z = H_z + B1_z + B2_z + L1_z + L2_z
      const area_z = developedWidth_z * T_z
      unitWeightKgPerM = area_z * 0.00785 * (density_g_cm3 / 7.85)
      pieceWeightKg = unitWeightKgPerM * L_m_z
      break

    case "flange_ring":
      const OD_flange = B_mm
      const ID_flange = H_mm
      const TH_flange = T_mm
      const holeCount_flange = Number(dims.r) || 0
      const holeDiameter_flange = S_mm
      const outerArea_flange = (Math.PI / 4) * Math.pow(OD_flange, 2)
      const innerArea_flange = (Math.PI / 4) * Math.pow(ID_flange, 2)
      const holeArea_flange = (Math.PI / 4) * Math.pow(holeDiameter_flange, 2)
      const volumeMm3_flange = (outerArea_flange - innerArea_flange - holeCount_flange * holeArea_flange) * TH_flange
      const volumeM3_flange = volumeMm3_flange / 1_000_000_000
      pieceWeightKg = volumeM3_flange * (density_g_cm3 * 1000)
      unitWeightKgPerM = pieceWeightKg
      break

    case "i_beam":
      const H_i = H_mm
      const B_i = B_mm
      const TF_i = R_mm
      const TW_i = T_mm
      const R_i = S_mm
      const L_m_i = L_mm / 1000
      const area_rects_i = 2 * (B_i * TF_i) + (H_i - 2 * TF_i) * TW_i
      let area_corners_i = 0
      if (dims.includeRadius && R_i > 0) {
        const Ri_i = R_i
        const Ro_i = R_i + TW_i
        area_corners_i = 4 * (Math.PI / 4) * (Math.pow(Ro_i, 2) - Math.pow(Ri_i, 2))
      }
      const total_area_mm2_i = area_rects_i + area_corners_i
      unitWeightKgPerM = total_area_mm2_i * 0.00785 * (density_g_cm3 / 7.85)
      pieceWeightKg = unitWeightKgPerM * L_m_i
      break

    case "expanded_metal":
      const mode_expanded = dims.calcMode || "thickness"
      if (mode_expanded === "thickness") {
        const T_m_expanded = H_mm / 1000
        const L_m_expanded = L_mm / 1000
        const W_m_expanded = B_mm / 1000
        pieceWeightKg = L_m_expanded * W_m_expanded * T_m_expanded * (density_g_cm3 * 1000)
        unitWeightKgPerM = W_m_expanded * T_m_expanded * (density_g_cm3 * 1000)
      } else {
        const weightPerM2_expanded = Number(dims.tf) || 0
        const area_expanded = Number(dims.h) || 0
        pieceWeightKg = weightPerM2_expanded * area_expanded
        unitWeightKgPerM = weightPerM2_expanded
      }
      break

    // Add all other cases from the web implementation here...
  }

  const totalWeightKg = pieceWeightKg * qty
  const totalPrice = price ? totalWeightKg * price : 0

  return {
    unitWeightPerMeter: unitWeightKgPerM.toFixed(3),
    pieceWeight: pieceWeightKg.toFixed(3),
    totalWeight: totalWeightKg.toFixed(3),
    totalPrice: totalPrice.toFixed(2),
  }
}
