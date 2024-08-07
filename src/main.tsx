import React from "react";
import ReactDOM from "react-dom/client";
import { extendTheme, ChakraProvider } from "@chakra-ui/react";
import { QueryParamProvider } from "use-query-params";
import { ReactRouter6Adapter } from "use-query-params/adapters/react-router-6";
import { BrowserRouter } from "react-router-dom";

import App from "./App.tsx";

const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <QueryParamProvider
          adapter={ReactRouter6Adapter}
          options={{ removeDefaultsFromUrl: true }}
        >
          <App />
        </QueryParamProvider>
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>
);
