export const getFieldConfigForFormula = (formula: string, dims: any) => {
  switch (formula) {
    case "i_beam": {
      const fields = [
        { key: "tw", label: "H", title: "الارتفاع الكلي (Overall Height)" },
        { key: "tf", label: "B", title: "عرض الجناح (Flange Width)" },
        { key: "r", label: "TF", title: "سماكة الجناح (Flange Thickness)" },
        { key: "t", label: "TW", title: "سماكة الويب (Web Thickness)" },
        { key: "s", label: "R", title: "نصف قطر الانحناء (Radius)" },
        { key: "h", label: "L", title: "الطول (Length)" },
      ]

      return dims.includeRadius ? fields : fields.filter((f) => f.key !== "s")
    }
    case "flat_bar":
      return [
        { key: "tf", label: "B", title: "العرض (Width)" },
        { key: "tw", label: "T", title: "السماكة (Thickness)" },
        { key: "h", label: "L", title: "الطول (Length)" },
      ]
    case "hex_bar":
      return [
        { key: "tf", label: "AF", title: "المقاس عبر الأوجه (Across Flats)" },
        { key: "h", label: "L", title: "الطول (Length)" },
      ]
    case "hex_tube":
      return [
        { key: "tf", label: "AF", title: "المقاس الخارجي عبر الأوجه (AF_out)" },
        { key: "tw", label: "T", title: "السماكة (Thickness)" },
        { key: "h", label: "L", title: "الطول (Length)" },
      ]
    case "square_bar":
      return [
        { key: "tf", label: "S", title: "ضلع المربع (Side)" },
        { key: "h", label: "L", title: "الطول (Length)" },
      ]
    case "square_tube":
      return [
        { key: "tf", label: "S", title: "الضلع الخارجي (Outer Side)" },
        { key: "tw", label: "T", title: "السماكة (Thickness)" },
        { key: "h", label: "L", title: "الطول (Length)" },
      ]
    case "solid_sphere":
      return [{ key: "tf", label: "D", title: "القطر (Diameter)" }]
    case "rect_tube":
      return [
        { key: "tf", label: "W", title: "العرض الخارجي (Outer Width)" },
        { key: "tw", label: "H", title: "الارتفاع الخارجي (Outer Height)" },
        { key: "t", label: "T", title: "السماكة (Thickness)" },
        { key: "h", label: "L", title: "الطول (Length)" },
      ]
    case "cone_frustum":
      return [
        { key: "tf", label: "D1", title: "القطر العلوي (Top Diameter)" },
        { key: "tw", label: "D2", title: "القطر السفلي (Bottom Diameter)" },
        { key: "h", label: "H", title: "الارتفاع العمودي (Vertical Height)" },
        { key: "t", label: "T", title: "السماكة (Thickness)" },
      ]
    case "t_section":
      return [
        { key: "tf", label: "B", title: "العرض الكلي للجناح (Flange Width)" },
        { key: "r", label: "TF", title: "سماكة الجناح (Flange Thickness)" },
        { key: "tw", label: "H", title: "الارتفاع الكلي (Overall Height)" },
        { key: "t", label: "TW", title: "سماكة الجسر (Web Thickness)" },
        { key: "h", label: "L", title: "الطول (Length)" },
      ]
    case "lipped_c_channel":
      return [
        { key: "tw", label: "H", title: "الارتفاع الكلي (Overall Height)" },
        { key: "tf", label: "B", title: "عرض الجناح (Flange Width)" },
        { key: "r", label: "L", title: "طول الحافة (Lip Length)" },
        { key: "t", label: "T", title: "السماكة (Thickness)" },
        { key: "h", label: "Lₜ", title: "الطول (Length)" },
      ]
    case "flange_ring":
      return [
        { key: "tf", label: "OD", title: "القطر الخارجي (Outer Diameter)" },
        { key: "tw", label: "ID", title: "القطر الداخلي (Inner Diameter)" },
        { key: "t", label: "TH", title: "سماكة الفلنجة (Thickness)" },
        { key: "r", label: "N", title: "عدد الثقوب (Bolt Count)" },
        { key: "s", label: "d", title: "قطر الثقب (Hole Diameter)" },
      ]
    case "steel_grating": {
      const mode = dims.calcMode || "weight"
      if (mode === "weight") {
        return [
          { key: "h", label: "L", title: "الطول (Length)" },
          { key: "tf", label: "W", title: "العرض (Width)" },
          { key: "tw", label: "kg/m²", title: "الوزن لكل متر مربع (Weight per m²)" },
        ]
      }

      return [
        { key: "h", label: "L", title: "الطول (Length)" },
        { key: "tf", label: "W", title: "العرض (Width)" },
        { key: "tw", label: "hb", title: "ارتفاع الشريحة (Bearing Bar Height)" },
        { key: "t", label: "tb", title: "سماكة الشريحة (Bearing Bar Thickness)" },
        { key: "r", label: "sb", title: "المسافة بين الشرائح (Spacing)" },
        { key: "s", label: "dc", title: "قطر الرابط (Cross Bar Diameter)" },
        { key: "u", label: "sc", title: "المسافة بين الروابط (Cross Spacing)" },
      ]
    }
    case "hat_channel":
      return [
        { key: "tf", label: "A", title: "العرض العلوي (Top Width)" },
        { key: "tw", label: "H", title: "الارتفاع (Height)" },
        { key: "r", label: "B", title: "طول القاعدة (Base Flange)" },
        { key: "s", label: "L", title: "طول الحافة (Lip Length)" },
        { key: "t", label: "T", title: "السماكة (Thickness)" },
        { key: "h", label: "Lₜ", title: "الطول (Length)" },
      ]
    case "wire_mesh": {
      const mode = dims.calcMode || "weight"
      if (mode === "weight") {
        return [
          { key: "h", label: "L", title: "الطول (Length)" },
          { key: "tf", label: "W", title: "العرض (Width)" },
          { key: "tw", label: "kg/m²", title: "الوزن لكل متر مربع (Weight per m²)" },
        ]
      }

      return [
        { key: "h", label: "L", title: "الطول (Length)" },
        { key: "tf", label: "W", title: "العرض (Width)" },
        { key: "tw", label: "d", title: "قطر السلك (Wire Diameter)" },
        { key: "r", label: "P1", title: "المسافة P1 (Spacing P1)" },
        { key: "s", label: "P2", title: "المسافة P2 (Spacing P2)" },
      ]
    }
    case "z_channel":
      return [
        { key: "tw", label: "H", title: "ارتفاع الجسر (Web Height)" },
        { key: "tf", label: "B1", title: "عرض الجناح العلوي (Top Flange)" },
        { key: "r", label: "B2", title: "عرض الجناح السفلي (Bottom Flange)" },
        { key: "s", label: "L1", title: "طول الحافة العلوية (Top Lip)" },
        { key: "u", label: "L2", title: "طول الحافة السفلية (Bottom Lip)" },
        { key: "t", label: "T", title: "السماكة (Thickness)" },
        { key: "h", label: "Lₜ", title: "الطول (Length)" },
      ]
    case "expanded_metal": {
      const mode = dims.calcMode || "thickness"
      if (mode === "thickness") {
        return [
          { key: "tw", label: "T", title: "سماكة الصاج (Sheet Thickness)" },
          { key: "h", label: "L", title: "طول اللوح (Sheet Length)" },
          { key: "tf", label: "W", title: "عرض اللوح (Sheet Width)" },
        ]
      }

      return [
        { key: "tf", label: "W/m²", title: "الوزن لكل متر مربع (Weight per m²)" },
        { key: "h", label: "Area", title: "المساحة الإجمالية (Total Area)" },
      ]
    }
    case "u_channel":
      return [
        { key: "tf", label: "H", title: "الارتفاع الكلي (Overall Height)" },
        { key: "tw", label: "W", title: "عرض الجناح (Flange Width)" },
        { key: "t", label: "TW", title: "سماكة الجدار (Web Thickness)" },
        { key: "r", label: "TF", title: "سماكة الجناح (Flange Thickness)" },
        { key: "s", label: "R", title: "نصف قطر الانحناء (Radius)" },
        { key: "h", label: "L", title: "الطول (Length)" },
      ]
    case "round_tube":
      return [
        { key: "tf", label: "OD", title: "القطر الخارجي (Outer Diameter)" },
        { key: "tw", label: "T", title: "السماكة (Thickness)" },
        { key: "h", label: "L", title: "الطول (Length)" },
      ]
    case "rebar":
      return [
        { key: "tf", label: "D", title: "القطر الاسمي (Nominal Diameter)" },
        { key: "h", label: "L", title: "الطول (Length)" },
      ]
    case "round_bar":
      return [
        { key: "tf", label: "d", title: "القطر (Diameter)" },
        { key: "h", label: "L", title: "الطول (Length)" },
      ]
    case "equal_angle":
      return [
        { key: "tf", label: "B/H", title: "الضلع (Side)" },
        { key: "t", label: "T", title: "السماكة (Thickness)" },
        { key: "h", label: "L", title: "الطول (Length)" },
      ]
    case "plate":
      return [
        { key: "h", label: "L", title: "الطول (Length)" },
        { key: "tf", label: "W", title: "العرض (Width)" },
        { key: "tw", label: "T", title: "السماكة (Thickness)" },
      ]
    default:
      return [
        { key: "tf", label: "W", title: "العرض (Width)" },
        { key: "h", label: "L", title: "الطول (Length)" },
        { key: "tw", label: "T", title: "السماكة (Thickness)" },
      ]
  }
}
