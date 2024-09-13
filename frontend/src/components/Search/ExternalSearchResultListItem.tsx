import * as React from "react";
import { useState } from "react";
import {
  Flex,
  Divider,
  Heading,
  Skeleton,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import {
  OnlyMobile,
  OnlyPC,
  highlightByRelevantParts,
} from "../../utils/UIUtils";
import { selectedCaseAtom } from "../../states/Search";
import { useSetAtom } from "jotai";
import { MdOutlineSummarize } from "react-icons/md";
import { caseSearchResulWidth } from "./SearchResultDisplay";
import TobeImplementedTab from "../../tabs/TobeImplementedTab";
import DisplayPreview from "./DisplayPreview";
import CaseSummaryDisplay from "./CaseSummaryDisplay";

const ExternalSearchResultListItem = ({
  searchResult,
  index,
  selectedSummaryIndex,
  setSelectedSummaryIndex,
  isPrioritized = false,
  isLast = false,
}) => {
  const setSelectedCase = useSetAtom(selectedCaseAtom);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [highlightedDocDic, setHighlightedDocDic] = useState<any>("");
  const [highlightedContentsJson, setHighlightedContentsJson] =
    useState<any>("");
  React.useEffect(() => {
    const contentsJson = JSON.parse(searchResult.case.contents_json);
    if (searchResult.relevant_parts === undefined) {
      setHighlightedDocDic("");
      setHighlightedContentsJson(contentsJson);
      return;
    }
    const [highlightedDocDic, highlightedContentsJson] =
      highlightByRelevantParts(contentsJson, searchResult.relevant_parts);
    setHighlightedDocDic(highlightedDocDic);

    setHighlightedContentsJson(highlightedContentsJson);
  }, [searchResult]);

  const getSelectedCase = () => {
    const 판례 = searchResult.case;
    const caseInformation = {
      법원: 판례.법원,
      사건명: 판례.사건명,
      사건번호: 판례.사건번호,
      사건종류: 판례.사건종류,
      선고: 판례.선고,
      선고일자: 판례.선고일자,
      이유: 판례.이유,
      주문: 판례.주문,
      청구취지: 판례.청구취지,
      판결유형: 판례.판결유형,
    };
    return {
      case_id: searchResult.case_id,
      name: searchResult.name,
      contents_json: highlightedContentsJson,
      case_information: caseInformation,
    };
  };

  const handleOnClickName = () => {
    const selectedCase = getSelectedCase();
    setSelectedCase(selectedCase);
  };


  const [caseSummaryState, setCaseSummaryState] = React.useState<
    "Ready" | "Loading" | "Finished" | "Error"
  >("Ready");

  const handleOnClickSummaryAnswer = () => {
    if (showSummary && caseSummaryState === "Finished") {
      setSelectedSummaryIndex(index);
      return;
    }
    if (caseSummaryState === "Loading") {
      return;
    }
    setCaseSummaryState("Loading");
    setShowSummary(true);
    setSelectedSummaryIndex(index);
  };

  return (
    <>
      <OnlyPC>
        <Flex alignItems={"flex-start"} width={"100%"}>
          <Flex
            direction={"column"}
            minWidth={`${caseSearchResulWidth}px`}
            maxWidth={`${caseSearchResulWidth}px`}
          >
            <Flex direction="column" width="100%" key={index}>
              <Flex mt="15px" mb="10px">
                <Flex flex={1} alignItems={"center"}>
                  <Heading
                    _hover={{
                      color: "blue.500",
                    }}
                    cursor={"pointer"}
                    size="sm"
                    color="gray.700"
                    onClick={() => handleOnClickName()}
                  >
                    {isPrioritized ? (
                      <u style={{ textDecoration: "underline #3182CE" }}>
                        {searchResult.name}
                      </u>
                    ) : (
                      searchResult.name
                    )}
                  </Heading>
                </Flex>
                <Flex ms="10px">
                  <Tooltip
                    bg="gray.500"
                    label={
                      caseSummaryState === "Ready"
                        ? "요약하기"
                        : caseSummaryState === "Finished"
                          ? "요약 보기"
                          : caseSummaryState === "Error"
                            ? "요약 재시도"
                            : "요약 하기"
                    }
                  >
                    <IconButton
                      size={"sm"}
                      aria-label="요약"
                      _loading={{ color: "gray.500" }}
                      isLoading={caseSummaryState === "Loading"}
                      variant={"outline"}
                      borderColor={
                        index === selectedSummaryIndex ? "blue.500" : "gray.500"
                      }
                      bg={index === selectedSummaryIndex ? "blue.50" : ""}
                      icon={
                        <MdOutlineSummarize
                          color={
                            index === selectedSummaryIndex ? "#3182CE" : ""
                          }
                        />
                      }
                      _hover={{ bg: "gray.100" }}
                      onClick={handleOnClickSummaryAnswer}
                    />
                  </Tooltip>
                </Flex>
              </Flex>
              {highlightedDocDic !== "" && (
                <Flex mb="5px">
                  {highlightedDocDic === undefined ? (
                    <Skeleton width={"100%"} height="20px" />
                  ) : (
                    <DisplayPreview
                      highlightedDocDic={highlightedDocDic}
                      caseData={getSelectedCase()}
                    />
                  )}
                </Flex>
              )}
            </Flex>
            <Flex
              mb="10px"
              width={"100%"}
              alignItems="flex-start"
              justifyContent={"flex-end"}
              ps="10px"
            >
            </Flex>
            {!isLast && <Divider borderColor={"gray.300"} />}
          </Flex>
          {showSummary && (
            <CaseSummaryDisplay
              index={index}
              selectedSummaryIndex={selectedSummaryIndex}
              setSelectedSummaryIndex={setSelectedSummaryIndex}
              setCaseSummaryState={setCaseSummaryState}
              caseSummaryState={caseSummaryState}
              case_id={searchResult.case_id}
            />
          )}
        </Flex>
      </OnlyPC>
      <OnlyMobile>
        <Flex width={"100%"} height={`calc( 100vh )`}>
          <TobeImplementedTab mobile={true} />
        </Flex>
      </OnlyMobile>
    </>
  );
};

export default ExternalSearchResultListItem;
