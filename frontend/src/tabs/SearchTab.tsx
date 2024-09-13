import { useEffect, useLayoutEffect } from "react";
import { Flex } from "@chakra-ui/react";
import { useSetAtom, useAtomValue } from "jotai";
import { searchResultsWithStatusAtom } from "../states/Search";
import { OnlyMobile, OnlyPC } from "../utils/UIUtils";
import { useNavigate } from "react-router-dom";
import { selectedNavbarKeyAtom } from "../states/HomePage";
import SearchResultDisplay from "../components/Search/SearchResultDisplay";
import TobeImplementedTab from "./TobeImplementedTab";

const SearchTab = () => {
  const searchResultsWithStatus = useAtomValue(searchResultsWithStatusAtom);
  const setSelectedNavbarKey = useSetAtom(selectedNavbarKeyAtom);
  const navigate = useNavigate();
  useLayoutEffect(() => {
    setSelectedNavbarKey("검색");
  }, []);

  useEffect(() => {
    if (searchResultsWithStatus.status === "Empty") {
      setSelectedNavbarKey("메인");
      navigate("/main");
    }
  }, [searchResultsWithStatus]);

  return (
    <>
      <OnlyPC>
        <SearchResultDisplay searchRegion={"External"} />
      </OnlyPC>
      <OnlyMobile>
        <Flex width={"100%"} height={"100%"}>
          <TobeImplementedTab mobile={true} />
        </Flex>
      </OnlyMobile>
    </>
  );
};

export default SearchTab;
