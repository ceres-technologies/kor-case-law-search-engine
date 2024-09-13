import { Flex, Text } from "@chakra-ui/react";
import DisplayPreviewItem from "./DisplayPreviewItem";
import { sortKeysByOrder, caseSectionOrder } from "../../logics/Search";

const DisplayPreview = ({ highlightedDocDic, caseData }) => {
  const sortedKeys = sortKeysByOrder(
    Object.keys(highlightedDocDic),
    caseSectionOrder,
    "이유",
  );

  return (
    <Flex direction="column" fontSize={"sm"} width={"100%"}>
      {sortedKeys.map((key) => {
        return (
          <>
            <Text my="5px">
              <b>{key}</b>
            </Text>
            <Flex direction={"column"} width={"100%"} alignItems={"center"}>
              {highlightedDocDic[key].map((content, index) => {
                const id = `${key + index}`;
                return (
                  <>
                    <DisplayPreviewItem
                      id={id}
                      key={id}
                      content={content}
                      caseData={caseData}
                    />
                  </>
                );
              })}
            </Flex>
          </>
        );
      })}
    </Flex>
  );
};

export default DisplayPreview;
