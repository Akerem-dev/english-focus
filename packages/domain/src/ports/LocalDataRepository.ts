import type { LocalDataSnapshot, ResetLocalDataInput, ResetLocalDataResult } from "../data";

export interface LocalDataRepository {
  getSnapshot(): Promise<LocalDataSnapshot>;
  resetLocalData(input: ResetLocalDataInput): Promise<ResetLocalDataResult>;
}
