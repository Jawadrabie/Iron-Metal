import type { ViewStyle } from "react-native"

export type DimensionStyle =
  | "vertical-line"
  | "vertical-line-small"
  | "horizontal-line"
  | "floating-label"
  | "corner-line"
  | "z-line"

export type OverlayEntry = {
  enabled: boolean
  position?: string
  offset?: string
  label: string
  style: DimensionStyle
  labelStyle?: ViewStyle
}

export type OverlayConfig = Record<string, OverlayEntry>

const buildBaseConfig = (): OverlayConfig => ({
  H: {
    enabled: true,
    position: "right",
    offset: "-right-16",
    label: "H",
    style: "vertical-line",
  },
  Tf: {
    enabled: true,
    position: "top",
    offset: "-top-12 left-1/4 right-1/4",
    label: "Tf",
    style: "horizontal-line",
  },
  Tw: {
    enabled: true,
    position: "center",
    offset: "",
    label: "Tw",
    style: "floating-label",
  },
  r: {
    enabled: true,
    position: "corner",
    offset: "top-1/4 right-1/4",
    label: "R",
    style: "floating-label",
  },
})

const EXTRA_DIMENSIONS_DEFAULTS: OverlayConfig = {
  w: {
    enabled: false,
    style: "floating-label",
    offset: "top-4 left-4",
    label: "w",
  },
  b: {
    enabled: false,
    style: "floating-label",
    offset: "top-4 right-4",
    label: "b",
  },
  A: {
    enabled: false,
    style: "floating-label",
    offset: "top-16 left-6",
    label: "A",
  },
  Al: {
    enabled: false,
    style: "floating-label",
    offset: "top-16 right-6",
    label: "Al",
  },
  d: {
    enabled: false,
    style: "floating-label",
    offset: "top-28 left-8",
    label: "d",
  },
  hi: {
    enabled: false,
    style: "floating-label",
    offset: "top-28 right-8",
    label: "hi",
  },
  ss: {
    enabled: false,
    style: "floating-label",
    offset: "top-40 left-10",
    label: "ss",
  },
  Av: {
    enabled: false,
    style: "floating-label",
    offset: "top-40 right-10",
    label: "Av",
  },
  Ix: {
    enabled: false,
    style: "floating-label",
    offset: "top-1/2 left-8",
    label: "Ix",
  },
  Iy: {
    enabled: false,
    style: "floating-label",
    offset: "top-1/2 right-8",
    label: "Iy",
  },
  Sx: {
    enabled: false,
    style: "floating-label",
    offset: "bottom-36 left-6",
    label: "Sx",
  },
  Sy: {
    enabled: false,
    style: "floating-label",
    offset: "bottom-36 right-6",
    label: "Sy",
  },
  Zx: {
    enabled: false,
    style: "floating-label",
    offset: "bottom-24 left-8",
    label: "Zx",
  },
  Zy: {
    enabled: false,
    style: "floating-label",
    offset: "bottom-24 right-8",
    label: "Zy",
  },
  rx: {
    enabled: false,
    style: "floating-label",
    offset: "bottom-14 left-10",
    label: "rx",
  },
  ry: {
    enabled: false,
    style: "floating-label",
    offset: "bottom-14 right-10",
    label: "ry",
  },
  J: {
    enabled: false,
    style: "floating-label",
    offset: "bottom-4 left-1/2 transform -translate-x-1/2",
    label: "J",
  },
  thickness: {
    enabled: false,
    style: "floating-label",
    offset: "bottom-8 left-4",
    label: "thk",
  },
}

export const getOverlayConfig = (id: number): OverlayConfig => {
  const base = buildBaseConfig()
  let cfg: OverlayConfig = { ...base, ...EXTRA_DIMENSIONS_DEFAULTS }

  switch (id) {
   case 1:
  cfg.H = {
    enabled: true,
    position: "right",
    offset: "right-[17px] top-[20px] h-[260px]",  
    label: "H",
    style: "vertical-line",
    labelStyle: {
      left: 0,
    },
  }

  cfg.Tf = {
    enabled: true,
    position: "top",
    offset: "left-[20px] top-[17px] h-[35px]",      // كانت left-[18%] top-[17%] h-[11%]
    label: "Tf",
    style: "vertical-line-small",
   labelStyle: {
         left:-55, 
           

    }
  }

  cfg.b = {
    enabled: true,
    position: "top",
    offset: "w-[250px] top-[-4px] left-[50px]",   // كانت w-[70%] top-[-8%] left-1/2 ...
    label: "B",
    style: "horizontal-line",
    labelStyle: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 2,
      alignItems: "center",
    },
  }

  cfg.Tw = {
    enabled: true,
    position: "center",
    offset: "w-[50px] top-[90px] left-[150px]",    // كانت w-[13%] top-[53%] left-1/2 ...
    label: "Tw",
    style: "horizontal-line",
    labelStyle: {
      position: "absolute",
      left: -100,
      right: 0,
      top: 3,
      alignItems: "center",
    },
  }

  cfg.r = {
    enabled: true,
    position: "top",
    offset: "top-[210px] right-[95px]",             // كانت top-[72%] right-[28%]
    label: "R",
    style: "corner-line",
    labelStyle: {
    bottom:10,
      left:10
    },
  }

  return cfg

    case 2:
     cfg.H = {
    enabled: true,
    position: "right",
    offset: "right-[55px] top-[20px] h-[260px]",   // كانت top-[7%] و h-[94%]
    label: "H",
    style: "vertical-line",
    labelStyle: {
      left: 0,
    },
  }

  cfg.Tf = {
    enabled: true,
    position: "top",
    offset: "left-[90px] top-[18px] h-[35px]",      // كانت left-[18%] top-[17%] h-[11%]
    label: "Tf",
    style: "vertical-line-small",
    labelStyle: {
      marginLeft: -65,
    },
  }

  cfg.b = {
    enabled: true,
    position: "top",
    offset: "w-[130px] top-[-4px] left-[110px]",   // كانت w-[70%] top-[-8%] left-1/2 ...
    label: "B",
    style: "horizontal-line",
    labelStyle: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 2,
      alignItems: "center",
    },
  }

  cfg.Tw = {
    enabled: true,
    position: "center",
    offset: "w-[50px] top-[90px] left-[150px]",    // كانت w-[13%] top-[53%] left-1/2 ...
    label: "Tw",
    style: "horizontal-line",
    labelStyle: {
      position: "absolute",
      left: -100,
      right: 0,
      top: 3,
      alignItems: "center",
    },
  }

  cfg.r = {
    enabled: true,
    position: "top",
    offset: "top-[210px] right-[95px]",             // كانت top-[72%] right-[28%]
    label: "R",
    style: "corner-line",
    labelStyle: {
     bottom:10,
      left:10
    },
  }

  return cfg

    case 3:
      cfg.H = {
        enabled: true,
        position: " left-[60px]",
        offset: "-left-[60px] top-[22px] h-[93%]",
        label: "H",
        style: "vertical-line",
        labelStyle:{
        
        }
      }
      cfg.Tf = {
        enabled: true,
        position: "bottom right-[26px]",
        offset: "top-[16px] w-[30px] left-[240px] h-[35px]",
        label: "TF",
        style: "vertical-line-small",
        labelStyle:{
          left:5,
          //right:4,
        }
      }
      cfg.Tw = {
        enabled: true,
        position: "left left-[33px] w-[38px]",
        offset: "left-[96px] bottom-[30%] top-[100px] w-[40px]",
        label: "Tw",
        style: "horizontal-line",
         labelStyle: {
         left:45, 
         top:18       

    },
      }
      cfg.r = {
        enabled: true,
        position: "top",
        offset: "bottom-[55px] left-[120px]",
        label: "R",
        style: "corner-line",
      }
      cfg.b = {
        enabled: true,
        position: "top",
        offset: "top-[-20px] left-[103px] w-[145px]",
        label: "W",
        style: "horizontal-line",
      }
      return cfg

    case 4:
      cfg.H = {
        enabled: true,
        position: "left",
        offset: "h-[260px] right-[305px] top-[23px]",
        label: "H",
        style: "vertical-line",
      }
    
       cfg.tf = {
        enabled: true,
        position: "right",
        offset: "right-[0px] top-[248px] h-[35px] ",
        label: "T",
        style: "vertical-line-small",
       labelStyle: {
        // right: 0 
        },
 }
     cfg.Tf.enabled = false 
     cfg.Tw.enabled = false;
      return cfg

    case 5:
      cfg.H = {
        enabled: true,
        position: "right",
        offset: "right-[251px] top-[20px] h-[80حء]",
        label: "W",
        style: "vertical-line",
      }
      cfg.d = {
        enabled: true,
        position: "top",
        offset: "top-[319px] right-[121px] left-[122px]",
        label: "H",
        style: "horizontal-line",
      }
      cfg.Tf = {
        enabled: true,
        position: "-top-[70px] left-[50px] left-[-13px]",
        offset: "top-[49px] left-[243px] h-[15px]",
        label: "Th",
        style: "vertical-line-small",
      }
      return cfg

    case 6:
      cfg.H = {
        enabled: true,
        position: "left",
        offset: "left-[20px] top-[21px] h-[262px]",
        label: "H",
        style: "vertical-line",
      }
      cfg.b = {
        enabled: true,
        position: "top",
        style: "horizontal-line",
        offset: "top-[-5px] left-[40px] w-[255px]",
        label: "W",
      }
      cfg.Tw = {
        enabled: false,
        position: "center",
        style: "floating-label",
        offset: "top-3/4 left-1/2 transform -translate-x-1/2",
        label: "T",
      }
      cfg.r = {
        enabled: false,
        position: "",
        offset: "",
        label: "Th",
        style: "vertical-line-small",
      }
      cfg.t = {
        enabled: true,
        position: "left-[6px]",
        offset: "left-[290px] top-[18px] h-[45px]",
        label: "Th",
        style: "vertical-line-small",
        labelStyle: {
         left:5, 

    }
      }
              cfg.Tf.enabled = false;

      return cfg

  

    case 7:
      cfg.d = {
        enabled: true,
        position: "center",
        style: "horizontal-line",
        offset: "w-[245px] top-[-5px] left-1/2 transform -translate-x-1/2",
        label: "W",
      }
      cfg.t = {
        enabled: true,
        position: "top-[-15px] left-[-15px]",
        style: "vertical-line-small",
        offset: "h-[45px] top-[243px] left-[47%]",
        label: "Th",
        labelStyle: {
         left:-25, 
         top:-35       

    }
      }
      cfg.Tf.enabled = false;
      return cfg

    case 8:
      cfg.H = {
        enabled: true,
        position: "right",
        offset: "right-[63px] top-[23px] h-[260px]",
        label: "H",
        style: "vertical-line",
      }
      cfg.b = {
        enabled: true,
        position: "center",
        style: "horizontal-line",
        offset: "w-[150px] top-[20p] left-1/2 transform -translate-x-1/2",
        label: "W",
      }
      cfg.t = {
        enabled: true,
        position: "top-[-15px] left-[-15px]",
        style: "vertical-line-small",
        offset: "h-[40px] top-[245px] left-[160px]",
        label: "Th",
        labelStyle: {
         left:-25, 
         top:-30       

    }
      }
      
       cfg.Tf.enabled = false;
      return cfg

    case 9:
      cfg.w = {
        enabled: true,
        position: "center",
        style: "horizontal-line",
        offset: "w-[230px] top-[-0px] left-1/2 transform -translate-x-1/2",
        label: "W",
      }
      cfg.t = {
        enabled: false,
        position: "center",
        style: "vertical-line-small",
        offset: "h-[6%] top-[82%] left-[56%]",
        label: "Th",
      }
      return cfg

    case 10:
      cfg.w = {
        enabled: true,
        position: "center",
        style: "horizontal-line",
        offset: "w-[270px] top-[-5px] left-1/2 transform -translate-x-1/2",
        label: "W",
      }
      return cfg

    case 11:
      cfg.w = {
        enabled: true,
        position: "center",
        style: "horizontal-line",
        offset: "w-[250px] top[-10px] left-1/2 transform -translate-x-1/2",
        label: "W",
      }
      return cfg

    // case 12:
    //   cfg.d = {
    //     enabled: true,
    //     position: "center",
    //     style: "horizontal-line",
    //     offset: "w-[68%] top-[8%] left-1/2 transform -translate-x-1/2",
    //     label: "W",
    //   }
    //   cfg.t = {
    //     enabled: true,
    //     position: "center",
    //     style: "vertical-line-small",
    //     offset: "h-[6%] top-[82%] left-[56%]",
    //     label: "Th",
    //   }
    //   return cfg

    case 13:
      cfg.H = {
        enabled: true,
        position: "right text-red-500",
        offset: "left-[65px] top-[40px] h-[250px]",
        label: "L",
        style: "z-line",
          labelStyle: {
         left:-10, 
           top:120

    }
      }
      cfg.Tf = {
        enabled: true,
        position: "top",
        // W: خط أفقي أعلى الشريط
        offset: "w-[170px] left-[-6px] top-[40px]",
        label: "W",
        style: "horizontal-line",
      }
      cfg.Tw = {
        enabled: true,
        position: "top-[25px] right-[-50px]",
        offset: "left-[350px] top-[205px] h-[35px]",
        label: "Th",
        style: "vertical-line-small",
          labelStyle: {
         left:-50, 
         top:20      

    }
      }
      cfg.w = {
        enabled: false,
        position: "bottom",
        offset: "bottom-[15%] left-[40%] w-[50%]",
        label: "W",
        style: "vertical-line",
      }
      return cfg

    case 14:
      cfg.D = {
        enabled: true,
        position: "center left-[10px]",
        style: "horizontal-line",
        offset: "w-[68%] top-[-30px] left-1/2 transform -translate-x-1/2",
        label: "OD_mm",
        labelStyle: {
         left:0, 
         top:7      

    }
      }
      cfg.Din = {
        enabled: true,
        position: "center left-[10px]",
        style: "floating-label",
        offset: "w-[110px] top-[24px] left-1/2 transform -translate-x-1/2 text-[15px] bg-white",
        label: "OD_in",
        labelStyle: {
         left:140, 
         top:-1       

    }
      }
      cfg.t = {
        enabled: true,
        position: "left left-[33px] w-[50px]",
        offset: "left-[33px] top-[120px] w-[55px]",
        style: "horizontal-line",
        label: "T",
        labelStyle: {
         right:35, 
         top:20       

    }
      }
       cfg.Tf.enabled = false;
      return cfg

    case 15:
      cfg.H = {
        enabled: true,
        position: "right",
        offset: "right-[63px] top-[20px] h-[260px]",
        label: "H",
        style: "vertical-line",
      }
      cfg.Tf = {
        enabled: true,
        position: "top",
        offset: "w-[100px] left-[165px] top-[-10px]",
        label: "W",
        style: "horizontal-line",
      }
      cfg.Tw = {
        enabled: true,
        position: "top-[-72%] left-[-13px]",
        offset: "left-[135px] top-[250px] h-[40px]",
        label: "Th",
        style: "vertical-line-small",
          labelStyle: {
         left:-30, 
         top:-30       

    }
      }
      cfg.t = {
        enabled: true,
        position: "top",
        offset: "top-[225px] left-[63px]",
        label: "T",
        style: "floating-label",
      }
      return cfg

    case 16:
      cfg.H = {
        enabled: true,
        position: "right",
        offset: "right-[90px] top-[22px] h-[260px]",
        label: "H",
        style: "vertical-line",
      }
      cfg.Tf = {
        enabled: true,
        position: "top",
        offset: "w-[100px] left-[126px] top-[-0px]",
        label: "W",
        style: "horizontal-line",
      }
      cfg.Tw = {
        enabled: true,
        position: "top-[-72%] left-[-13px]",
        offset: "left-[165px] top-[250px] h-[40px]",
        label: "Th",
        style: "vertical-line-small",
          labelStyle: {
         left:-30, 
         top:-30,       
    }
      }
      cfg.t = {
        enabled: true,
        position: "top",
        offset: "top-[60px] left-[185px]",
        label: "T",
        style: "floating-label",
      }
      return cfg

   
        case 17:
      cfg.H = {
        enabled: false,
        position: "right",
        offset: "right-[310px] top-[35px] h-[77%]",
        label: "H",
        style: "vertical-line",
      }
      cfg.b = {
        enabled: true,
        position: "top",
        style: "horizontal-line",
        offset: "top-[17px] left-[59px] w-[221px]",
        label: "W",
      }
      cfg.t = {
        enabled: true,
        position: "",
        offset: "left-[51px] top-[30px]",
        label: "Th",
        style: "vertical-line-small",
      }
      cfg.r = {
        enabled: false,
        position: "",
        offset: "",
        label: "Th",
        style: "vertical-line-small",
      }
      return cfg

      
       default:
      return cfg
  }

}

