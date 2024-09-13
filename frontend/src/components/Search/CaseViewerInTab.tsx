import * as React from "react";
import {
  Flex,
  Icon,
  Text,
  Button,
} from "@chakra-ui/react";
import { useAtom } from "jotai";
import { MdKeyboardReturn } from "react-icons/md";
import { MdOutlineSummarize } from "react-icons/md";
import SummaryInCaseViewer from "../SummaryInCaseViewer";

import { selectedCaseAtom } from "../../states/Search";

import DisplayCase from "../DisplayCase";

const CaseViewerInTab = () => {
  const [selectedCase, setSelectedCase] = useAtom(selectedCaseAtom);
  const [openSummary, setOpenSummary] = React.useState<Boolean>(false);
  const heightHeader = 50;
  const summaryWidth = 400;

  return (
    <Flex
      minWidth={"100vw"}
      maxHeight={`calc( 100vh)`}
      maxWidth={"100vw"}
    >
      <Flex
        flex={1}
        height={"100%"}
        direction={"column"}
        borderRight={"1px"}
        borderColor={"gray.300"}
      >
        <Flex
          height={`${heightHeader}px`}
          borderBottom={"1px"}
          bg="gray.50"
          borderColor={"gray.300"}
          alignItems={"center"}
        >
          <Button
            size={"sm"}
            m="5px"
            bg="gray.50"
            leftIcon={<MdKeyboardReturn />}
            _hover={{ bg: "gray.200" }}
            onClick={() => {
              setSelectedCase(undefined);
            }}
          >
            <Text fontSize={"sm"} color="gray.600">
              {"검색결과로 돌아가기"}
            </Text>
          </Button>
          <Flex flex={1} />
          <Button
            size={"sm"}
            leftIcon={<Icon as={MdOutlineSummarize} />}
            variant={"outline"}
            bg={"white"}
            me="5px"
            isDisabled={openSummary ? true : false}
            _hover={{ bg: "gray.300" }}
            onClick={() => setOpenSummary(!openSummary)}
          >
            {"요약"}
          </Button>
        </Flex>

        <Flex
          px="40px"
          justifyContent={"center"}
          height={`calc( 100vh - ${heightHeader}px )`}
          overflowY={"scroll"}
        >
          <DisplayCase selectedCase={selectedCase!} />
        </Flex>
      </Flex>
      <Flex
        height={"100%"}
        width={openSummary ? `${summaryWidth}px` : "0px"}
        overflowX={"hidden"}
        borderRight={openSummary ? "1px" : "0px"}
        borderColor={"gray.300"}
        transition={"width 0.3s ease-in-out"}
      >
        {openSummary && (
          <SummaryInCaseViewer
            openSummary={openSummary}
            setOpenSummary={setOpenSummary}
            summaryWidth={summaryWidth}
            case_id={selectedCase!.case_id}
          />
        )}
      </Flex>
    </Flex>
  );
};

export default CaseViewerInTab;
