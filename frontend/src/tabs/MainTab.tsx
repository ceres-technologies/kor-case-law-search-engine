import * as React from "react";
import { Flex, Text } from "@chakra-ui/react";
import { useSetAtom } from "jotai";
import { OnlyMobile, OnlyPC } from "../utils/UIUtils";
import { selectedNavbarKeyAtom } from "../states/HomePage";
import SearchBox from "../components/Search/SearchBox";
import logo from "../img/main.svg";

export const mainTabBackgroudColor = "white";

const MainTab = () => {
  const setSelectedNavbarKey = useSetAtom(selectedNavbarKeyAtom);
  React.useLayoutEffect(() => {
    setSelectedNavbarKey("메인");
  });
  return (
    <Flex
      height={`calc( 100vh )`}
      width="100%"
      maxWidth="100%"
      justifyContent="center"
      bg={mainTabBackgroudColor}
    >
      <OnlyPC>
        <Flex
          direction={"column"}
          width={"100%"}
          height={"100%"}
          alignItems={"center"}
        >
          <Flex height={"200px"} mb="20px" alignItems={"flex-end"}>
            <img src={logo} alt="Servant" style={{ height: "90px" }} />
          </Flex>
          <Flex
            minWidth={"48em"}
            width={"48em"}
            p="20px"
            justifyContent={"center"}
          >
            <SearchBox />
          </Flex>
        </Flex>
      </OnlyPC>
      <OnlyMobile>
        <Flex height={"100%"} justifyContent={"center"} alignItems={"center"}>
          <Text fontWeight={"bold"} color={"gray.600"}>
            {"모바일 버전은 준비중입니다."}
          </Text>
        </Flex>
      </OnlyMobile>
    </Flex>
  );
};

export default MainTab;
