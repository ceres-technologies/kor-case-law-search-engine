import * as React from "react";
import { Flex, Text, Box, Spinner } from "@chakra-ui/react";
import Markdown from "react-markdown";
import { io } from 'socket.io-client';

import { prepareSummaryFromRaw } from "../../utils/TextUtils";

const WEBSOCKET_URL = process.env.REACT_APP_WS_URL + "/summary";

const CaseSummaryDisplay = ({
  index,
  selectedSummaryIndex,
  setSelectedSummaryIndex,
  caseSummaryState,
  setCaseSummaryState,
  case_id,
}) => {
  const [summary, setSummary] = React.useState<string>("");
  React.useEffect(() => {
    const randomId = Math.random().toString(36).substring(2, 15);
    const websocketUrl = WEBSOCKET_URL;
    const socket = io(websocketUrl, {
      query: {
        id: randomId,
      },
    });
    socket.on("message", (message) => {
      if (message.t === "finish") {
        setCaseSummaryState("Finished");
        socket.disconnect();
      } else if (message.t === "error") {
        setCaseSummaryState("Error");
        socket.disconnect();
      } else {
        setSummary((prev) => prev + message.d);
      }
    });
    socket.on("error", (e) => {
      setCaseSummaryState("Error");
    });
    socket.send({ case_id });
  }, []);
  const minHeight = 70;
  const bottomMargin = 20;
  function CustomHeading({ headingLevel, children }) {
    const size = {
      1: "2xl",
      2: "xl",
      3: "lg",
    }[headingLevel];

    return (
      <Text fontSize={size} mt="5px" fontWeight={"bold"}>
        {children}
      </Text>
    );
  }
  return (
    <Flex mt={"18px"} ms={"5px"} maxHeight={"10px"} width={"100%"}>
      <Flex
        overflowY={"hidden"}
        width={"100%"}
        height={
          index === selectedSummaryIndex
            ? "100%"
            : `${minHeight + bottomMargin}px`
        }
      >
        <Flex
          width={"100%"}
          maxWidth={"500px"}
          minWidth={"300px"}
          zIndex={index === selectedSummaryIndex ? 10 : 0}
          _hover={{
            zIndex: 20,

            borderColor: "blue.500",
          }}
          ms={index === selectedSummaryIndex ? "20px" : "0px"}
          border={"2px"}
          borderColor={index === selectedSummaryIndex ? "blue.500" : "blue.100"}
          cursor={index === selectedSummaryIndex ? "" : "pointer"}
          bg={"white"}
          mb={`${bottomMargin}px`}
          borderRightRadius={"20px"}
          borderBottomRadius={"20px"}
          overflowY={"hidden"}
          onClick={() => {
            setSelectedSummaryIndex(index);
          }}
        >
          <Flex
            width={"100%"}
            height={"100%"}
            minHeight={`${minHeight}px`}
            pt="10px"
            px="10px"
            pb={
              index === selectedSummaryIndex || caseSummaryState === "Error"
                ? "10px"
                : "0px"
            }
            direction={"column"}
            justifyContent={caseSummaryState === "Error" ? "center" : ""}
          >
            {caseSummaryState === "Error" ? (
              <Text
                fontSize={"md"}
                color={"red.400"}
                fontWeight={"bold"}
                align={"center"}
              >
                {"요약문을 불러오는데 실패했습니다. 다시 시도해주세요."}
              </Text>
            ) : summary === "" ? (
              <Flex
                width={"100%"}
                height={"100%"}
                justifyContent={"center"}
                alignItems={"center"}
              >
                <Spinner color="gray.500" size={"md"} />
              </Flex>
            ) : (
              <Box position="relative" overflow="hidden">
                <Markdown
                  components={{
                    h1: ({ node, children, ...props }) => (
                      <CustomHeading
                        headingLevel={1}
                        children={children}
                        {...props}
                      />
                    ),
                    h2: ({ node, children, ...props }) => (
                      <CustomHeading
                        headingLevel={2}
                        children={children}
                        {...props}
                      />
                    ),
                    h3: ({ node, children, ...props }) => (
                      <CustomHeading
                        headingLevel={3}
                        children={children}
                        {...props}
                      />
                    ),
                  }}
                >
                  {prepareSummaryFromRaw(summary)}
                </Markdown>
                {index !== selectedSummaryIndex && (
                  <Box
                    position="absolute"
                    bottom="0"
                    left="0"
                    right="0"
                    height="50px"
                    bgGradient="linear(to-b, transparent, white)"
                  />
                )}
              </Box>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default CaseSummaryDisplay;
