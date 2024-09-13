import * as React from "react";
import { useSetAtom } from "jotai";
import { Flex, Spinner, Text } from "@chakra-ui/react";
import { useParams } from "react-router";

import { selectedNavbarKeyAtom } from "../../states/HomePage";
import { Case, getSelectedCase } from "../../logics/Search";
import { OnlyPC, OnlyMobile } from "../../utils/UIUtils";
import DisplayCase from "../DisplayCase";
import TobeImplementedTab from "../../tabs/TobeImplementedTab";
import SummaryInCaseViewer from "../SummaryInCaseViewer";

const CaseViewerNewTab = () => {
  const { caseId } = useParams();
  const setSelectedNavbarKey = useSetAtom(selectedNavbarKeyAtom);
  const [selectedCase, setSelectedCase] = React.useState<Case | undefined>(
    undefined
  );
  const [openSummary, setOpenSummary] = React.useState<Boolean>(false);
  const [isLoading, setIsLoading] = React.useState<Boolean>(true);
  const [errorLoadingCase, setErrorLoadingCase] =
    React.useState<Boolean>(false);
  const summaryWidth = 400;

  return (
    <>
      <OnlyPC>
        <Flex width={"100vw"} bg={"gray.100"}>
          <Flex flex={1} />
          <Flex
            minWidth={"540px"}
            height={`calc( 100vh )`}
            overflowY={"auto"}
            px="20px"
            bg={isLoading || errorLoadingCase ? "" : "white"}
            direction={"column"}
          >
            {errorLoadingCase ? (
              <Flex
                width={"100%"}
                height={"100%"}
                justifyContent={"center"}
                alignItems={"center"}
              >
                <Text fontSize="lg" color="red.500" fontWeight={"bold"}>
                  {
                    "판례를 불러오는 중 오류가 발생했습니다. 새로고침을 해주세요."
                  }
                </Text>
              </Flex>
            ) : isLoading ? (
              <Flex
                width={"100%"}
                height={"100%"}
                justifyContent={"center"}
                alignItems={"center"}
              >
                <Spinner color="gray.500" />
              </Flex>
            ) : (
              selectedCase && (
                <DisplayCase
                  selectedCase={selectedCase}
                  supportsSummaryFeature={true}
                  openSummary={openSummary}
                  setOpenSummary={setOpenSummary}
                />
              )
            )}
          </Flex>
          <Flex flex={1} />
          <Flex
            height={`calc( 100vh )`}
            width={openSummary ? `${summaryWidth}px` : "0px"}
            overflowX={"hidden"}
            borderRight={openSummary ? "1px" : "0px"}
            borderLeft={openSummary ? "1px" : "0px"}
            borderColor={"gray.300"}
            bg={"white"}
            transition={"width 0.3s ease-in-out"}
          >
            {openSummary && selectedCase && (
              <SummaryInCaseViewer
                openSummary={openSummary}
                setOpenSummary={setOpenSummary}
                summaryWidth={summaryWidth}
                case_id={selectedCase.case_id}
              />
            )}
          </Flex>
        </Flex>
      </OnlyPC>
      <OnlyMobile>
        <Flex width={"100%"} height={`calc( 100vh)`}>
          <TobeImplementedTab mobile={true} />
        </Flex>
      </OnlyMobile>
    </>
  );
};

export default CaseViewerNewTab;
