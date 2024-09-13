import { atom } from "jotai";
import { Case, ExternalSearchResultsWithStatus } from "../logics/Search";
export const searchResultsWithStatusAtom =
  atom<ExternalSearchResultsWithStatus>({
    status: "Empty",
  });
export const selectedCaseAtom = atom<Case | undefined>(undefined);

// 요청을 여러 개 보내면, 요청이 끝난 순서대로 결과가 오지 않을 수 있음.
// 마지막 요청만 결과에 반영하도록 reuqest시 id를 부여하고, 마지막 요청의 id를 저장함.
// 마지막 요청의 id와 저장된 id가 같을 때만 결과를 반영함.
export const currentResultIdAtom = atom<number>(0);

export const ContentPerPage = 5;
