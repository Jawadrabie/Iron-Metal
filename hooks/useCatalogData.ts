import type { Section } from "../types/sections"

const LOCAL_CATALOG: Section[] = [
  require("../assets/data/1-hp.json"),
  require("../assets/data/2-i.json"),
  require("../assets/data/3-u.json"),
  require("../assets/data/4-ea.json"),
  require("../assets/data/6-t.json"),
  require("../assets/data/7-she.json"),
  require("../assets/data/8-rhe.json"),
  require("../assets/data/9-pb.json"),
  require("../assets/data/10-sb.json"),
  require("../assets/data/11-rb.json"),
  require("../assets/data/14-pipe.json"),
].map((section) => section as Section)

export function useCatalogData() {
  const refresh = async () => {
    return
  }

  return { data: LOCAL_CATALOG, loading: false, error: null, refresh }
}


