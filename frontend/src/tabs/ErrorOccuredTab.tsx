import * as React from "react";
import { Text, Flex, Alert, AlertIcon } from "@chakra-ui/react";

const ErrorOccuredTab = ({ errorMessage }) => {
  return (
    <Flex align="center" justify="center" height="100%">
      <Alert status="error" width="200px">
        <AlertIcon />
        죄송합니다. 에러가 발생했습니다. {errorMessage}
      </Alert>
    </Flex>
  );
};

export default ErrorOccuredTab;
