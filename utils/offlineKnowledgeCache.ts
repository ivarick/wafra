import { CROPS } from "@/constants/crops";
import { COMMON_DISEASES } from "@/constants/commonDiseases";
import * as storage from "@/utils/storage";

const OFFLINE_CROPS_KEY = "wafra_offline_crop_fact_sheets_v1";
const OFFLINE_DISEASES_KEY = "wafra_offline_common_diseases_v1";
const OFFLINE_CACHE_REFRESHED_AT_KEY = "wafra_offline_cache_refreshed_at";

export async function warmOfflineKnowledgeCache() {
  const existingCrops = await storage.getItemAsync(OFFLINE_CROPS_KEY);
  const existingDiseases = await storage.getItemAsync(OFFLINE_DISEASES_KEY);

  if (!existingCrops) {
    await storage.setItemAsync(OFFLINE_CROPS_KEY, JSON.stringify(CROPS));
  }
  if (!existingDiseases) {
    await storage.setItemAsync(OFFLINE_DISEASES_KEY, JSON.stringify(COMMON_DISEASES));
  }
  await storage.setItemAsync(OFFLINE_CACHE_REFRESHED_AT_KEY, new Date().toISOString());
}

export async function getOfflineCropsCache() {
  const raw = await storage.getItemAsync(OFFLINE_CROPS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function getOfflineDiseasesCache() {
  const raw = await storage.getItemAsync(OFFLINE_DISEASES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function getOfflineCacheRefreshedAt() {
  return storage.getItemAsync(OFFLINE_CACHE_REFRESHED_AT_KEY);
}
