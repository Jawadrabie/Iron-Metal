import { useCallback, useState } from "react"

import type { TabKey } from "../components/navigation/BottomTabNavigator"

type UseHomeTabsOptions = {
  initialTab?: TabKey
}

export function useHomeTabs({ initialTab = "home" }: UseHomeTabsOptions) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab)
  const [moreVisible, setMoreVisible] = useState(false)
  const [displayTab, setDisplayTab] = useState<TabKey>(initialTab)

  const handleCloseMore = useCallback(() => {
    setMoreVisible(false)
    setDisplayTab(activeTab)
  }, [activeTab])

  const handleTabChange = useCallback(
    (tab: TabKey) => {
      if (tab === "more") {
        const willOpen = !moreVisible
        setMoreVisible(willOpen)
        if (willOpen) {
          setDisplayTab("more")
        } else {
          setDisplayTab(activeTab)
        }
        return
      }

      setActiveTab(tab)
      setDisplayTab(tab)
      setMoreVisible(false)
    },
    [moreVisible, activeTab],
  )

  return {
    activeTab,
    displayTab,
    setActiveTab,
    moreVisible,
    handleTabChange,
    handleCloseMore,
    openCalculator: () => {
      setActiveTab("home")
      setDisplayTab("home")
      setMoreVisible(false)
    },
  }
}



