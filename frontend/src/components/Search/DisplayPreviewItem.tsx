import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Flex, Text, IconButton, Icon } from "@chakra-ui/react";

import { convertToJSX } from "../../logics/Search";
import DisplayCase from "../DisplayCase";
import { BsThreeDots } from "react-icons/bs";
import { BsChevronExpand, BsChevronContract } from "react-icons/bs";
import { IoIosExpand, IoIosContact } from "react-icons/io";
import { IoContract, IoExpand } from "react-icons/io5";

const DisplayPreviewItem = ({ id, content, caseData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [maxHeight, setMaxHeight] = useState("none");
  const contentRef = useRef<HTMLDivElement>(null);
  const componentRef = useRef<HTMLDivElement>(null);
  const safeId = id.replace(/([^\w-])/g, "\\$1");

  const handleOnClick = () => {
    setIsExpanded(!isExpanded);
  };

  useLayoutEffect(() => {
    if (contentRef.current) {
      setMaxHeight(`${contentRef.current.offsetHeight + 10}px`);
    }
  }, [contentRef.current]);

  useEffect(() => {
    if (isExpanded && componentRef.current) {
      const element = componentRef.current.querySelector(`#${safeId}`);

      if (element) {
        element.scrollIntoView({ block: "nearest" });
      }
    }
  }, [isExpanded]);

  const [duringTransition, setDuringTransition] = useState(false);

  return (
    <Flex
      ref={componentRef}
      direction="column"
      position={"relative"}
      border={"1px"}
      borderColor={"gray.300"}
      borderRadius={"5px"}
      overflow={"hidden"}
      width={"calc(100% - 2px)"}
      minHeight={"36px"}
      transition="height 0.3s ease"
      onTransitionEnd={() => {
        setDuringTransition(false);
      }}
      py={isExpanded ? "2px" : "5px"}
      my="2px"
      _hover={{
        border: "2px",
        borderColor: "blue.500",
        width: "100%",
        ".icon-button": { opacity: 1 },
      }}
      style={{
        height: isExpanded ? "310px" : maxHeight,
      }}
      px="30px"
    >
      {isExpanded ? (
        <Flex direction="column" width={"100%"}>
          <Flex
            maxHeight={"300px"}
            width={"100%"}
            direction={"column"}
            overflowY="auto"
          >
            <DisplayCase
              selectedCase={caseData}
              selectedSpanId={id}
              maxWidth=""
            />
          </Flex>
        </Flex>
      ) : (
        <Text width={"100%"} ref={contentRef} cursor={"text"}>
          {convertToJSX(content)}
        </Text>
      )}
      {!duringTransition && (
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            setDuringTransition(true);
            handleOnClick();
          }}
          overflow={"hidden"}
          position={"absolute"}
          variant={"outline"}
          borderColor={"gray.400"}
          right={"5px"}
          _hover={{ bg: "gray.100" }}
          bottom={"5px"}
          aria-label="open"
          maxWidth={"0px"}
          minWidth={"23px"}
          height="23px"
          opacity={0}
          justifyContent={"center"}
          alignItems={"center"}
          className="icon-button"
          icon={
            <Icon
              color={"gray.600"}
              height={"23px"}
              as={isExpanded ? IoContract : IoExpand}
            />
          }
        />
      )}
    </Flex>
  );
};

export default DisplayPreviewItem;
