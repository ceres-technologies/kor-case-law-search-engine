import * as React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Flex } from "@chakra-ui/react";

import CaseViewerNewTab from "../components/Search/CaseViewerNewTab";
import MainTab from "../tabs/MainTab";
import SearchTab from "../tabs/SearchTab";

const HomePage = () => {
  const getContent = () => {
    return (
      <Routes>
        <Route path="*" element={<Navigate to="main" replace />} />
        <Route path="/main" element={<MainTab />} />
        <Route path="/search/*" element={<SearchTab />} />
        <Route path="/case/:caseId" element={<CaseViewerNewTab />} />
      </Routes>
    );
  };

  return (
    <Flex direction={"column"}>
      <Flex>{getContent()}</Flex>
    </Flex>
  );
};

export default HomePage;
