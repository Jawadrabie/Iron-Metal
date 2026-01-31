const getOverlayConfig = (id: number): OverlayConfig => {
  const base = buildBaseConfig();
  let cfg: OverlayConfig = { ...base, ...EXTRA_DIMENSIONS_DEFAULTS };
  switch (id) {
    case 1:
      cfg.H = {
        enabled: true,
        position: "right",
        offset: "right-[25px] top-[22px] h-[88%]",
        label: "H",
        style: "vertical-line",
      };
      cfg.Tf = {
        enabled: true,
        position: "top",
        offset: "w-[70%] left-[52px] top-[4%] ",
        label: "TF",
        style: "horizontal-line",
      };
      cfg.Tw = {
        enabled: true,
        position: "left",
        offset: "left-[44px] bottom-[22%] z-10",
        label: "Tw",
        style: "vertical-line-small",
      };
      cfg.r = {
        enabled: true,
        position: "top",
        offset: "top-[72%] right-[33%]",
        label: "r",
        style: "corner-line",
      };
      return cfg;
    case 2:
      cfg.H = {
        enabled: true,
        position: "right",
        offset: "right-[70px] top-[22px] h-[88%]",
        label: "H",
        style: "vertical-line",
      };
      cfg.Tf = {
        enabled: true,
        position: "top",
        offset: "w-[37%] left-[110px] top-[4%] z-10",
        label: "TF",
        style: "horizontal-line",
      };
      cfg.Tw = {
        enabled: true,
        position: "left",
        offset: "left-1 bottom-[30%]",
        label: "Tw",
        style: "vertical-line-small",
      };
      cfg.r = {
        enabled: true,
        position: "top",
        offset: "top-[70%] right-[33%]",
        label: "r",
        style: "corner-line",
      };
      return cfg;
    case 3:
      cfg.H = {
        enabled: true,
        position: "left",
        offset: "-left-[75px] top-[50%] h-[83%]",
        label: "H",
        style: "vertical-line",
      };
      cfg.b = {
        ...cfg.Tf,
        position: "bottom",
        offset: "top-[12px] right-[45%] w-[41%] left-[29%]",
        label: "TF",
        style: "horizontal-line",
      };
      cfg.Tw = {
        enabled: true,
        position: "left right-[144px]",
        offset: "-right-[91px] bottom-[38%]",
        label: "Tw",
        style: "vertical-line-small",
      };
      cfg.r = {
        enabled: true,
        position: "top",
        offset: "bottom-[18%] right-[53%]",
        label: "r",
        style: "corner-line",
      };
      cfg.Tf.enabled = false;
      return cfg;
    case 4:
      cfg.H = {
        enabled: true,
        position: "right",
        offset: "-right-2 top-[50%]",
        label: "H",
        style: "vertical-line",
      };
      cfg.Tf = {
        enabled: true,
        position: "left",
        offset: "left-[37%] bottom-[43%]",
        label: "Tf",
        style: "floating-label",
      };
      cfg.Tw.enabled = false;
      return cfg;
    case 5:
      cfg.H = {
        enabled: true,
        position: "right",
        offset: "right-2 top-[50%]",
        label: "H",
        style: "vertical-line",
      };
      cfg.d = {
        enabled: true,
        position: "top",
        offset: "top-1 right-[42%]",
        label: "d",
        style: "floating-label",
      };
      cfg.Tf = {
        enabled: true,
        position: "left",
        offset: "-left-5 bottom-[43%]",
        label: "T",
        style: "floating-label",
      };
      return cfg;
    case 6:
      cfg.H.label = "H";
      cfg.Tf = {
        enabled: true,
        position: "top",
        style: "horizontal-line",
        offset: "-top-12 left-1/4 right-1/4",
        label: "B",
      };
      cfg.Tw = {
        enabled: true,
        position: "center",
        style: "floating-label",
        offset: "top-3/4 left-1/2 transform -translate-x-1/2",
        label: "t",
      };
      cfg.r = {
        enabled: true,
        position: "corner",
        style: "floating-label",
        offset: "top-1/4 left-1/2",
        label: "r",
      };
      return cfg;
    case 14:
      cfg.H.label = "D";
      cfg.Tf.label = "t";
      cfg.Tw.enabled = false;
      cfg.r.enabled = false;
      return cfg;
    default:
      return cfg;
  }
};
