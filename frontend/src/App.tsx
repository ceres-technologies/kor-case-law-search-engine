import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import * as React from "react";

import HomePage from "./pages/HomePage";
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "./styles/theme";
function App() {
  return (
    <ChakraProvider theme={theme}>
      <div className="App">
        <Router>
            <Routes>
              <Route
                path="/*"
                element={
                  <HomePage />
                }
              />
            </Routes>
        </Router>
      </div>
    </ChakraProvider>
  );
}

export default App;
