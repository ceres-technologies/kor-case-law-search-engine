import * as React from "react";
import { Text, Spinner, Flex, Button, useToast } from "@chakra-ui/react";
import { useAtomValue, useAtom } from "jotai";
import {
  searchResultsWithStatusAtom,
  currentResultIdAtom,
  selectedCaseAtom,
  ContentPerPage,
} from "../../states/Search";
import {
  requestCases,
  requestPreviewSentences,
  ExternalSearchResultsWithStatus,
} from "../../logics/Search";
import { caseSearchResulWidth } from "./SearchResultDisplay";

import { toastErrorMessage } from "../../utils/UIUtils";
import CaseViewerInTab from "./CaseViewerInTab";
import ExternalSearchResultListItem from "./ExternalSearchResultListItem";

const ExternalSearchResultList = () => {
  const toast = useToast();
  const [searchResultsWithStatus, setSearchResultsWithStatus] = useAtom(
    searchResultsWithStatusAtom,
  );


  const [searchResultsWithStatusTemp, setSearchResultsWithStatusTemp] =
    React.useState<ExternalSearchResultsWithStatus>({
      status: "Empty",
    });
  const [loading, setLoading] = React.useState<boolean>(false);
  const startIdx = searchResultsWithStatus.startIdxDisplay;
  const endIdx = Math.min(
    startIdx! + ContentPerPage,
    searchResultsWithStatus.searchResults!.length,
  );
  const currentResultId = useAtomValue(currentResultIdAtom);
  const noResult = searchResultsWithStatus.searchResults?.length === 0;
  const nomoreResult = endIdx === searchResultsWithStatus.searchResults!.length;
  const [selectedSummaryIndex, setSelectedSummaryIndex] = React.useState<
    number | undefined
  >(undefined);
  const selectedCase = useAtomValue(selectedCaseAtom);


  React.useEffect(() => {
    if (searchResultsWithStatusTemp.id === currentResultId) {
      setSearchResultsWithStatus(searchResultsWithStatusTemp);
    }
  }, [searchResultsWithStatusTemp, currentResultId]);

  React.useEffect(() => {
    const toRequestCaseIds = searchResultsWithStatus.searchResults
      ?.filter((result, idx) => startIdx! <= idx && idx < endIdx)
      .filter((result) => result.case === undefined)
      .map((result) => result.case_id) as number[];
    if (!toRequestCaseIds || toRequestCaseIds.length === 0) return;
    setLoading(true);
    const fetchData = async () => {
      try {
        const relevantParts = await requestPreviewSentences(
          toRequestCaseIds,
          searchResultsWithStatus.query!,
        );

        const cases = await requestCases(toRequestCaseIds);
        for (let i = 0; i < toRequestCaseIds.length; i++) {
          const case_id = toRequestCaseIds[i];
          const caseIdx = searchResultsWithStatus.searchResults!.findIndex(
            (result) => result.case_id === case_id,
          );
          searchResultsWithStatus.searchResults![caseIdx].case = cases[i];
          searchResultsWithStatus.searchResults![caseIdx].relevant_parts =
            relevantParts[i];
        }
        setSearchResultsWithStatusTemp({ ...searchResultsWithStatus });
      } catch (e) {
        console.log(e);
        toastErrorMessage({
          toast: toast,
          message: "서버 에러입니다. 다시 시도해 주세요.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [startIdx]);

  return (
    <Flex direction={"column"} height={"100%"} width={"100%"}>
      {selectedCase !== undefined && (
        <Flex
          position={"fixed"}
          bg="white"
          left={"0"}
          width={"100vw"}
          zIndex={50}
          direction="column"
          flex={1}
          borderRight={"1px "}
          borderColor={"gray.300"}
          height={`calc( 100vh )`}
        >
          <CaseViewerInTab />
        </Flex>
      )}
        <Flex direction="column">
          {searchResultsWithStatus.searchResults
            ?.filter((result, idx) => idx < endIdx)
            .filter((result) => result.case !== undefined)
            .map((result, index) => {
              return (
                <ExternalSearchResultListItem
                  key={index}
                  searchResult={result}
                  index={index}
                  selectedSummaryIndex={selectedSummaryIndex}
                  setSelectedSummaryIndex={setSelectedSummaryIndex}
                />
              );
            })}
          {loading && (
            <Flex
              minWidth={`${caseSearchResulWidth}px`}
              maxWidth={`${caseSearchResulWidth}px`}
              direction="column"
              alignItems={"center"}
              justifyContent={"center"}
              my={"10px"}
              height={"50px"}
            >
              <Spinner color="gray.500" size="md" />
            </Flex>
          )}
          {nomoreResult ? (
            noResult ? (
              <Text
                minWidth={`${caseSearchResulWidth}px`}
                maxWidth={`${caseSearchResulWidth}px`}
                my={"50px"}
                color={"gray.600"}
                align={"center"}
              >
                <b>{"검색 결과가 없습니다."}</b>{" "}
              </Text>
            ) : (
              <Text
                minWidth={`${caseSearchResulWidth}px`}
                maxWidth={`${caseSearchResulWidth}px`}
                my={"20px"}
                color={"gray.600"}
                align={"center"}
              >
                <b>{"더 이상 검색 결과가 없습니다."}</b>{" "}
              </Text>
            )
          ) : (
            <Flex
              minWidth={`${caseSearchResulWidth}px`}
              maxWidth={`${caseSearchResulWidth}px`}
              justifyContent={"center"}
            >
              <Button
                size={"sm"}
                my={"10px"}
                onClick={() => {
                  const newStartIdx = endIdx;
                  setSearchResultsWithStatus({
                    ...searchResultsWithStatus,
                    startIdxDisplay: newStartIdx,
                  });
                }}
              >
                {"검색결과 더 보기"}
              </Button>
            </Flex>
          )}
        </Flex>
    </Flex>
  );
};

export default ExternalSearchResultList;
