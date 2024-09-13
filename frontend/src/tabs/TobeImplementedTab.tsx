import { Text, Flex } from "@chakra-ui/react";

const TobeImplementedTab = ({ mobile = false }: { mobile?: boolean }) => {
  return (
    <Flex
      height="100%"
      width={"100%"}
      alignItems="center"
      justifyContent="center"
    >
      <Text
        fontWeight="bold"
        align={"center"}
        color="gray.600"
        minWidth={"200px"}
      >
        {mobile ? "모바일 버전은 준비 중입니다." : "개발 중입니다."}
      </Text>
    </Flex>
  );
};

export default TobeImplementedTab;
