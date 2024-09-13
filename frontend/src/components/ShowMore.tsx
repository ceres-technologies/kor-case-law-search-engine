import { Collapse, Flex, Button, Box } from "@chakra-ui/react";
import * as React from "react";
import { useState, useRef, useEffect, useLayoutEffect } from "react";

const ShowMore = ({ height, right = false, children }) => {
  const [childHeight, setChildHeight] = useState<number>(100000);

  const Children = ({ childComponent }) => {
    const childRef = useRef<HTMLDivElement | null>(null);
    useLayoutEffect(() => {
      if (childRef.current) {
        setChildHeight(childRef.current.offsetHeight);
      }
    }, [children]);
    return <Box ref={childRef}>{childComponent}</Box>;
  };

  const [show, setShow] = useState(false);
  const handleToggle = () => setShow(!show);

  const directionFlex = right ? "row" : "column";
  const alignFlex = right ? "center" : "flex-start";
  const margeFlex = right ? 0 : 1;

  return height > childHeight ? (
    <Children childComponent={children} />
  ) : (
    <Flex direction={directionFlex} alignItems={alignFlex}>
      <Collapse startingHeight={height} in={show}>
        <Flex width="100%">
          <Children childComponent={children} />
        </Flex>
      </Collapse>
      <Flex>
        <Button
          mt={margeFlex}
          width="40px"
          color="gray.500"
          variant="link"
          size="xs"
          onClick={handleToggle}
        >
          {show ? "줄이기" : "...더보기"}
        </Button>
      </Flex>
    </Flex>
  );
};

export default ShowMore;
