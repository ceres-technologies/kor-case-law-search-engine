import React from "react";
import { Flex, Text, IconButton, Icon, Spinner } from "@chakra-ui/react";
import { LuX } from "react-icons/lu";
import Markdown from "react-markdown";
import { prepareSummaryFromRaw } from "../utils/TextUtils";
import { io } from 'socket.io-client';

const WEBSOCKET_URL = process.env.REACT_APP_WS_URL + "/summary";

const SummaryInCaseViewer = ({
  openSummary,
  setOpenSummary,
  summaryWidth,
  case_id,
}: {
  openSummary: Boolean;
  setOpenSummary: React.Dispatch<React.SetStateAction<Boolean>>;
  summaryWidth: number;
  case_id: number;
}) => {
  const [caseSummaryState, setCaseSummaryState] = React.useState<
    "Ready" | "Loading" | "Finished" | "Error"
  >("Ready");
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
    <Flex minWidth={`${summaryWidth}px`} height={"100%"} direction={"column"}>
      <Flex
        width={"100%"}
        key={"summary header"}
        maxHeight={"50px"}
        minHeight={"50px"}
        bg="gray.50"
        borderBottom={"1px"}
        borderColor={"gray.300"}
        px="10px"
        alignItems={"center"}
      >
        <IconButton
          size={"sm"}
          variant={"ghost"}
          aria-label="close folder"
          _hover={{ bg: "gray.300" }}
          me="5px"
          onClick={() => setOpenSummary(false)}
        >
          <Icon as={LuX} />
        </IconButton>
        <Text fontWeight={"bold"} color={"gray.600"}>
          {"요약"}
        </Text>
        {caseSummaryState === "Loading" && (
          <Spinner ms={"10px"} color="gray.500" size="sm" />
        )}
      </Flex>
      <Flex height={"100%"} p="10px" direction={"column"} overflowY={"auto"}>
        <Markdown
          components={{
            h1: ({ node, children, ...props }) => (
              <CustomHeading headingLevel={1} children={children} {...props} />
            ),
            h2: ({ node, children, ...props }) => (
              <CustomHeading headingLevel={2} children={children} {...props} />
            ),
            h3: ({ node, children, ...props }) => (
              <CustomHeading headingLevel={3} children={children} {...props} />
            ),
          }}
        >
          {prepareSummaryFromRaw(summary)}
        </Markdown>
      </Flex>
    </Flex>
  );
};
export default SummaryInCaseViewer;
