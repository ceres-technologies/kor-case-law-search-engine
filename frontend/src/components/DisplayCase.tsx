import React from "react";
import {
  Flex,
  Text,
  Divider,
  Table,
  Tbody,
  Tr,
  Td,
  TableContainer,
  Button,
  Icon,
} from "@chakra-ui/react";
import { Case, beutifyString, convertToJSXWithSpan } from "../logics/Search";
import ReactHtmlParser from "react-html-parser";
import { MdOutlineSummarize } from "react-icons/md";

const extractStrings = (array) => {
  return array.reduce((acc, val) => acc.concat(val), []);
};

const InfoTableDisplay = ({
  caseDictionary,
  candidatesRowLabels,
}: {
  caseDictionary: any;
  candidatesRowLabels: string[][];
}) => {
  return (
    <TableContainer width={"100%"} fontSize={"md"} my="20px" px="20px">
      <Table>
        <Tbody>
          {candidatesRowLabels.map((cadidatesRowLabel) => {
            const matchingKeys = Object.keys(caseDictionary).filter((key) =>
              cadidatesRowLabel.some((label) => key === label)
            );
            return matchingKeys.length > 0
              ? matchingKeys.map((key) => (
                  <Tr key={key}>
                    <Td>{beutifyString(key)}</Td>
                    <Td whiteSpace={"pre-wrap"}>
                      {ReactHtmlParser(caseDictionary[key])}
                    </Td>
                  </Tr>
                ))
              : null;
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

const SectionDisplay = ({
  caseDictionary,
  subsectionTitles,
  type = "section",
  selectedSpanId = undefined,
  isHighlighted = true,
}: {
  caseDictionary: any;
  subsectionTitles: string[];
  type?: "section" | "intro";
  highlightParts?: string[];
  selectedSpanId?: string | undefined;
  isHighlighted?: boolean;
}) => {
  const paddingBottom = type === "section" ? "10px" : "";
  return (
    <Flex direction={"column"} width={"100%"} pb={paddingBottom}>
      {subsectionTitles.map((subsectionTitle) => {
        const matchedKey = Object.keys(caseDictionary).find(
          (key) => key === subsectionTitle
        );

        if (matchedKey && caseDictionary[matchedKey] !== null) {
          return (
            <Flex direction={"column"} key={matchedKey}>
              {type === "section" ? (
                <Text
                  textAlign={"center"}
                  fontSize={"lg"}
                  fontWeight={"bold"}
                  my="10px"
                >
                  {beutifyString(matchedKey)}
                </Text>
              ) : (
                <>
                  <Text fontSize={"lg"} fontWeight={"bold"} mt="10px">
                    {beutifyString(matchedKey)}
                  </Text>
                  <Divider mb="10px" />
                </>
              )}
              <Text whiteSpace={"pre-wrap"}>
                {isHighlighted === true
                  ? convertToJSXWithSpan(
                      caseDictionary[matchedKey],
                      selectedSpanId
                    )
                  : `${caseDictionary[matchedKey]}`}
              </Text>
              {type === "intro" && caseDictionary[matchedKey] !== "" && (
                <Divider my="5px" />
              )}
            </Flex>
          );
        }
        return null;
      })}
    </Flex>
  );
};

const DisplayCase = ({
  selectedCase,
  selectedSpanId,
  maxWidth = "700px",
  isHighlighted = true,
  supportsSummaryFeature = false,
  openSummary,
  setOpenSummary = () => {},
}: {
  selectedCase: Case;
  selectedSpanId?: string | undefined;
  maxWidth?: string;
  isHighlighted?: boolean;
  supportsSummaryFeature?: boolean;
  openSummary?: Boolean;
  setOpenSummary?: React.Dispatch<React.SetStateAction<Boolean>>;
}) => {
  const contents = selectedCase.contents_json;
  const candidatesRowLabels =
    selectedCase.case_information.사건종류 === "형사"
      ? [
          [
            "피고인",
            "상고인,피고인",
            "피고인겸피치료감호청구인,피부착명령청구자,치료명령피청구자",
            "피고인겸피치료감호청구인",
            "피고인겸피부착명령청구자",
            "피고인겸치료명령피청구자",
          ],
          ["피감호청구인"],
          ["원고인", "상고인"],
          ["항소인"],
          ["검사"],
          ["변호인", "변호사"],
          ["제1심"],
          ["원심판결", "원판결", "원심결정", "제1심판결"],
        ]
      : [
          [
            "원고",
            "원고,피항고인",
            "원고,항고인",
            "원고,항소인",
            "원고,피항소인",
            "원고,피상고인",
            "원고,상고인",
            "원고(재심피고),피상고인",
            "원고(재심피고),피항소인",
            "원고(재심원고),항소인",
            "원고(반소피고),피상고인",
            "원고,항소인,재심원고",
            "원고(반소피고)",
          ],
          ["원고,피상고인겸상고인", "원고,상고인겸피상고인"],
          ["원고보조참가인"],
          ["피고,상고인겸피상고인", "피고,피상고인겸상고인"],
          [
            "피고",
            "피고,피항고인",
            "피고,항고인",
            "피고,항소인",
            "피고,피항소인",
            "피고,피상고인",
            "피고,상고인",
            "피고(재심원고),상고인",
            "피고(재심원고),항소인",
            "피고(재심피고),피항소인",
            "피고(반소원고)",
            "피고(반소원고),상고인",
            "피고,피항소인,재심피고",
          ],
          ["재항고인"],
          ["피고보조참가인"],
          ["원심판결", "원판결", "원심결정"],
          ["환송판결"],
          ["제1심"],
          ["제1심판결"],
          ["변론종결"],
        ];

  const subsectionTitlesForIntro = [
    "판시사항",
    "판결요지",
    "참조조문",
    "참조판례",
  ];

  const subsectionTitles = [
    "이유",
    "다시쓰는판결",
    "다시쓰는판결이유",
    "범죄사실",
    "감호요건사실",
    "범죄사실및증거의요지",
    "증거의요지",
    "법령의적용",
    "적용법조",
    "피고인및변호인의주장에대한판단",
    "피고인과변호인의주장에관한판단",
    "양형이유",
    "양형의이유",
    "공소기각부분",
    "신상정보의등록및제출",
    "무죄부분",
  ];

  const listInRowsLabel = extractStrings(candidatesRowLabels);

  const [remainedContentsKeys, setRemainedContentsKeys] = React.useState<
    string[]
  >(
    Object.keys(contents)
      .filter((key) => key !== "제목")
      .filter((key) => key !== "주문")
  );
  // console.log("사건종류", selectedCase.case_informatio.사건종류);
  // console.log("remainedContentsKeys", remainedContentsKeys);

  React.useEffect(() => {
    const newRemainedContentsKeys = remainedContentsKeys
      .filter((key) => !listInRowsLabel.includes(key))
      .filter((key) => !subsectionTitles.includes(key))
      .filter((key) => !subsectionTitlesForIntro.includes(key));
    setRemainedContentsKeys(newRemainedContentsKeys);
  }, []);

  return (
    <Flex
      width={"100%"}
      height={"100%"}
      maxWidth={maxWidth}
      direction={"column"}
      alignItems={"center"}
    >
      <Flex
        width={"100%"}
        py="10px"
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Flex flex={1} />
        <Text fontSize={"xl"}>
          <b>{selectedCase.name}</b>
        </Text>
        <Flex flex={1} />
        {supportsSummaryFeature && (
          <Button
            minWidth={"fit-content"}
            size={"sm"}
            leftIcon={<Icon as={MdOutlineSummarize} />}
            variant={"outline"}
            bg={"white"}
            mx="5px"
            isDisabled={openSummary ? true : false}
            _hover={{ bg: "gray.300" }}
            onClick={() => setOpenSummary(!openSummary)}
          >
            {"요약"}
          </Button>
        )}
      </Flex>
      <Divider />
      <SectionDisplay
        caseDictionary={contents}
        subsectionTitles={subsectionTitlesForIntro}
        type="intro"
        selectedSpanId={selectedSpanId}
        isHighlighted={isHighlighted}
      />
      <Flex>
        <InfoTableDisplay
          caseDictionary={contents}
          candidatesRowLabels={candidatesRowLabels}
        />
      </Flex>
      <SectionDisplay
        caseDictionary={contents}
        subsectionTitles={["주문"]}
        selectedSpanId={selectedSpanId}
        isHighlighted={isHighlighted}
      />
      {remainedContentsKeys.length > 0 && (
        <SectionDisplay
          caseDictionary={contents}
          subsectionTitles={remainedContentsKeys}
          selectedSpanId={selectedSpanId}
          isHighlighted={isHighlighted}
        />
      )}
      <SectionDisplay
        caseDictionary={contents}
        subsectionTitles={subsectionTitles}
        selectedSpanId={selectedSpanId}
        isHighlighted={isHighlighted}
      />
      <Flex minHeight={"100px"} width={"50px"} />
    </Flex>
  );
};
export default DisplayCase;
