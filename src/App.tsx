import { ReactNode } from "react";
import { HStack, Button, VStack, useColorMode } from "@chakra-ui/react";
import { QueryControls } from "./query/QueryControls";
import {
  NavLink as BaseLink,
  To,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  bigConfig,
  bigConfigValues,
  otherConfig,
  partialOnBigConfig,
} from "./query/queryDemoData";

const Link = ({ to, children, ...props }: { to: To; children: ReactNode }) => {
  const location = useLocation();
  const searchParams = location.search;

  const toWithSearchParams =
    typeof to === "string"
      ? `${to}${searchParams}`
      : {
          ...to,
          search: `${to.search || ""}${searchParams}`,
        };

  return (
    <Button
      variant="outline"
      _activeLink={{ color: "blue.500" }}
      as={BaseLink}
      to={toWithSearchParams}
      end
      {...props}
    >
      {children}
    </Button>
  );
};

function BigParams() {
  return (
    <>
      <QueryControls
        config={bigConfig}
        arrayValues={bigConfigValues}
        prefix="big"
        clearKeys={["ticks", "x"]}
      />
      <Outlet />
    </>
  );
}

function PartialOnBigParams() {
  return (
    <QueryControls
      config={partialOnBigConfig}
      title="Partial on Big"
      prefix="big"
    />
  );
}

function OtherParams() {
  return (
    <>
      <QueryControls config={otherConfig} prefix="other" />
      <Outlet />
    </>
  );
}

function HomeLinks() {
  return (
    <HStack gap={4} p={4}>
      <Button variant="outline" as={BaseLink} to="/">
        Clear all
      </Button>
      <Link to="/">Home</Link>
      <Link to="/big">Big</Link>
      <Link to="/other">Other</Link>
      <Link to="/big/other">Big + Other</Link>
      <Link to="/other/big">Other + Big</Link>
      <Link to="/big/partial">Big + Partial</Link>
      <Link to="/other/big/partial">All</Link>
    </HStack>
  );
}

function MakeItDark() {
  const { colorMode, toggleColorMode } = useColorMode();
  return colorMode === "light" ? (
    <Button onClick={toggleColorMode}>
      Toggle {colorMode === "light" ? "Dark" : "Light"}
    </Button>
  ) : undefined;
}

function App() {
  return (
    <VStack w="full" align="start">
      <MakeItDark />
      <HomeLinks />
      <Routes>
        <Route path="big" element={<BigParams />}>
          <Route path="other" element={<OtherParams />} />
          <Route path="partial" element={<PartialOnBigParams />} />
        </Route>
        <Route path="other" element={<OtherParams />}>
          <Route path="big" element={<BigParams />}>
            <Route path="partial" element={<PartialOnBigParams />} />
          </Route>
        </Route>
      </Routes>
    </VStack>
  );
}

export default App;
