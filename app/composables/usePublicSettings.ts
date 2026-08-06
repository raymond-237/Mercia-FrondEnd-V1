import useSettingsService from "~/services/Models/settings.service"
import type { PublicSettings } from "~/types/Models/settings.type"

export function usePublicSettings() {
  return useAsyncData<PublicSettings | null>('public-settings', async () => {
    try {
      const service = useSettingsService()
      return await service.publicSetting()
    } catch (e) {
      console.error('[publicSettings] fetch failed:', e)
      return null
    }
  })
}