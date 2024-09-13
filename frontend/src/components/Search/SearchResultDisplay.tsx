import { Flex, Spinner } from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { searchResultsWithStatusAtom } from "../../states/Search";
import ExternalSearchResultList from "./ExternalSearchResultList";
import { selectedCaseAtom } from "../../states/Search";
import SearchBox from "./SearchBox";
import FilterAndCategory from "./FilterAndCategory";

export const caseSearchResulWidth = 714;

const SearchResultDisplay = ({ searchRegion }) => {
  const selectedCase = useAtomValue(selectedCaseAtom);
  const searchResultsWithStatus = useAtomValue(searchResultsWithStatusAtom);

  return (
    <Flex height={"100%"} direction="column" flex={1}>
      <Flex
        width={"100vw"}
        height={`calc( 100vh)`}
        overflowY={selectedCase ? "hidden" : "auto"}
        ps="214px"
        direction="column"
      >
        <Flex
          height={"36px"}
          alignItems={"center"}
          justifyContent={"center"}
          width={"714px"}
          paddingTop="50px"
          paddingBottom="50px"
        >
          <SearchBox inNavbar={true} initialQuery={searchResultsWithStatus.query} />
        </Flex>
        {searchResultsWithStatus.status === "Empty" ? (
          <Flex
            width={"100%"}
            justifyContent={"center"}
            alignItems={"center"}
          ></Flex>
        ) : searchResultsWithStatus.status === "Loading" ? (
          <Flex width={"100%"} justifyContent={"center"} alignItems={"center"}>
            <Spinner color="gray.500" size={"lg"} />
          </Flex>
        ) : (
          <Flex direction={"column"}>
            <FilterAndCategory category={searchResultsWithStatus.category} filters={searchResultsWithStatus.filters} />
            <ExternalSearchResultList />
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};

export default SearchResultDisplay;
