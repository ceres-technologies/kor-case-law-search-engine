import * as React from "react";
import { useSetAtom, useAtom } from "jotai";
import { IconButton, Icon, Flex, Input} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import TextareaAutosize from "react-textarea-autosize";

import {
  requestQuery
} from "../../logics/Search";
import {
  searchResultsWithStatusAtom,
  selectedCaseAtom,
  currentResultIdAtom,
} from "../../states/Search";
import { handleEnterPress } from "../../utils/UIUtils";

const SearchBox = ({
  directionExpansion = "down",
  inNavbar = false,
  initialQuery = "",
}: {
  directionExpansion?: "up" | "down";
  inNavbar?: boolean;
  initialQuery?: string;
  showHistory?: boolean;
}) => {
  const [searchResultsWithStatus, setSearchResultsWithStatus] = useAtom(
    searchResultsWithStatusAtom,
  );

  const setCurrentResultId = useSetAtom(currentResultIdAtom);
  const paddingY = inNavbar ? "5px" : "10px";

  const flexDirection = directionExpansion === "up" ? "flex-end" : "flex-start";
  const navigate = useNavigate();
  const [query, setQuery] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const setSelectedCase = useSetAtom(selectedCaseAtom);


  React.useEffect(() => {
    if (initialQuery !== "") {
      setQuery(initialQuery);
    }
  }, [initialQuery]);
  const boxShadow = inNavbar ? "" : "base";

  const handleOnClick = async (e) => {
    if (isLoading) {
      return;
    }
    const id = Date.now();
    setCurrentResultId(id);
    e.preventDefault();
    e.target.blur();

    if (searchResultsWithStatus.status !== "Empty") {
      setSearchResultsWithStatus({
        status: "Loading",
        startIdxDisplay: 0,
        query: query,
      });
    }
    setIsLoading(true);
    setSelectedCase(undefined);
    setSearchResultsWithStatus({
      status: "Loading",
      startIdxDisplay: 0,
      query: query,
    });

    navigate("/search");

    try {
      const startTimeRequestQuery = Date.now();
      const {results, category, filters} = await requestQuery(
        query,
      );

      const endTimeRequestQuery = Date.now();
      console.log(
        "elapsed time (검색 요청)",
        endTimeRequestQuery - startTimeRequestQuery,
      );
      setSearchResultsWithStatus({
        status: "Finished",
        searchResults: results,
        category: category,
        filters: filters,
        query,
        id: id,
        startIdxDisplay: 0,
      });
      setIsLoading(false);
    } catch (e) {
      console.log(e);
      setSearchResultsWithStatus({
        status: "Error",
        searchResults: [],
        query: query,
        id: id,
        startIdxDisplay: 0,
        took: 0,
      });
      setIsLoading(false);
      return;
    }
    
  };

  const inputRef = React.useRef<HTMLInputElement>(null);


  return (
    <Flex
      width={"100%"}
      justifyContent={flexDirection}
      height={inNavbar ? "36px" : "46px"}
      direction="column"
    >
      <Flex width={"100%"} alignItems={flexDirection}>
        <Flex
          border={"1px"}
          borderColor={"gray.300"}
          borderRadius={"20px"}
          width={"100%"}
          justifyContent={flexDirection}
          py={paddingY}
          pe="10px"
          ps="10px"
          zIndex={10}
          boxShadow={boxShadow}
          bg="white"
        >
          <IconButton
            borderRadius={"full"}
            aria-label="Search"
            size="xs"
            bg={query === "" ? "gray.300" : "blue.600"}
            _hover={{ bg: query === "" ? "gray.300" : "blue.500" }}
            icon={<Icon as={SearchIcon} />}
            colorScheme="blue"
            onClick={(e) => {
              if (query === "") {
                return;
              }

              handleOnClick(e);
            }}
          />
          <Flex width={"100%"} direction={"column"}>
            <Input
              ref={inputRef}
              minHeight={"24px"}
              maxHeight={inNavbar ? "24px" : "200px"}
              as={TextareaAutosize}
              resize={"none"}
              value={query}
              size={"md"}
              placeholder="질문을 입력하세요."
              border={"none"}
              overflowY={inNavbar ? "hidden" : "auto"}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              _focus={{
                boxShadow: "none",
                maxHeight: "200px",
                overflowY: "auto",
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter" && query === "") {
                  e.preventDefault();
                  return;
                }
                handleEnterPress(e, () => {
                  handleOnClick(e);
                });
              }}
              bg="white"
              zIndex={10}
            />

          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default SearchBox;
