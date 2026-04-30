
import { useState, useEffect, useCallback } from "react";
import type { Crop, CropCategory } from "../domain/entities/Crop";
import { GetCropsUseCase, GetCropByIdUseCase } from "../domain/usecases/GetCropsUseCase";
import { CropRepositoryMock } from "../data/repositories/CropRepositoryMock";

const _repository = new CropRepositoryMock();
const _getCrops = new GetCropsUseCase(_repository);
const _getCropById = new GetCropByIdUseCase(_repository);



interface UseCropsOptions {
  category?: CropCategory | "all";
  searchQuery?: string;
}

export function useCrops({ category = "all", searchQuery = "" }: UseCropsOptions = {}) {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await _getCrops.execute(category, searchQuery);
      setCrops(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load crops");
    } finally {
      setIsLoading(false);
    }
  }, [category, searchQuery]);

  useEffect(() => {
    load();
  }, [load]);

  return { crops, isLoading, error, refetch: load };
}

export function useCropById(id: string) {
  const [crop, setCrop] = useState<Crop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    _getCropById.execute(id).then((data) => {
      if (!cancelled) { setCrop(data); setIsLoading(false); }
    }).catch((e) => {
      if (!cancelled) { setError(e.message); setIsLoading(false); }
    });
    return () => { cancelled = true; };
  }, [id]);

  return { crop, isLoading, error };
}
