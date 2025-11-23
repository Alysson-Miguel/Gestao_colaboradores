"use client"

import SettingsHeader from "./settings-header"
import SettingsCards from "./settings-cards"

export default function SettingsLayout() {
  return (
    <div className="space-y-6">
      <SettingsHeader />
      <SettingsCards />
    </div>
  )
}
