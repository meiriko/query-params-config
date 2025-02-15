import {
  Box,
  VStack,
  Button,
  HStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  Switch,
  Input,
  Badge,
  AccordionIcon,
  Heading,
} from "@chakra-ui/react";
import { NumberParam, ArrayParam, QueryParamConfig } from "use-query-params";
import {
  BooleanParam,
  InitTypes,
  ParamHelpers,
  useDeferredQueryParamHelpers,
  useQueryParamHelpers,
} from "./queryUtils";
import { useMemo } from "react";

const ArrayCotrols = ({
  name,
  value,
  helpers,
  values,
}: {
  name: string;
  value: string[];
  helpers: {
    set: (value?: unknown[]) => void;
    add: (value: unknown) => void;
    remove: (value: unknown) => void;
    toggle: (value: unknown) => void;
  };
  values: string[];
}) => {
  return (
    <AccordionItem w="full">
      <AccordionButton bg="gray.700">
        <HStack w="full" textAlign="start">
          <Box w="286px">{name}</Box>
          <Box>{value?.join(",")}</Box>
        </HStack>
        <AccordionIcon marginInlineStart="auto" />
      </AccordionButton>
      <AccordionPanel>
        <Box
          display="grid"
          gridTemplateColumns={"286px repeat(3, 100px)"}
          gap={2}
          alignItems="center"
        >
          {values.map((v) => {
            const isActive = value?.includes(v);
            return [
              <Box key={`value-${v}`} color={isActive ? "blue.500" : undefined}>
                {v}
              </Box>,
              <Button key={`toggle-${v}`} onClick={() => helpers.toggle(v)}>
                Toggle
              </Button>,
              <Button
                key={`add-${v}`}
                variant={isActive ? undefined : "outline"}
                onClick={() => helpers.add(v)}
              >
                Add
              </Button>,
              <Button
                key={`remove-${v}`}
                variant={isActive ? "outline" : undefined}
                onClick={() => helpers.remove(v)}
              >
                Remove
              </Button>,
            ];
          })}
        </Box>
      </AccordionPanel>
    </AccordionItem>
  );
};

const BooleanControls = ({
  name,
  value,
  helpers,
}: {
  name: string;
  value?: boolean;
  helpers: {
    set: (value?: boolean) => void;
    toggle: () => void;
  };
}) => {
  return (
    <Box
      display="grid"
      gridTemplateColumns="300px repeat(3, 100px) auto"
      gap={2}
      alignItems="center"
    >
      <Box paddingInlineStart={4}>{name}</Box>
      <Button onClick={() => helpers.toggle()}>Toggle</Button>
      <Button
        onClick={() => helpers.set(true)}
        variant={value ? undefined : "outline"}
      >
        On
      </Button>
      <Button
        onClick={() => helpers.set(false)}
        variant={value ? "outline" : undefined}
      >
        Off
      </Button>
      <Switch
        margin="auto"
        marginInlineStart={4}
        isChecked={Boolean(value)}
        onChange={({ target: { checked } }) => {
          helpers.set(checked);
        }}
      />
    </Box>
  );
};

const NumberControls = ({
  name,
  value,
  helpers,
}: {
  name: string;
  value: number;
  helpers: { set: (value?: number) => void };
}) => {
  return (
    <Box
      display="grid"
      gridTemplateColumns="300px repeat(4,100px)"
      gap={2}
      alignItems="center"
    >
      <Box paddingInlineStart={4}>{name}</Box>
      <Input
        type="number"
        value={value ?? ""}
        onChange={(e) => helpers.set(+e.target.value)}
        w="full"
      />
      <Button onClick={() => helpers.set((value ?? 0) + 1)}>Increase</Button>
      <Button onClick={() => helpers.set((value ?? 0) - 1)}>Decrease</Button>
      <Button onClick={() => helpers.set()}>Clear</Button>
    </Box>
  );
};

const ValueControls = ({
  name,
  value,
  set,
}: {
  name: string;
  value: string;
  set: (v?: string) => void;
}) => {
  return (
    <Box
      display="grid"
      gridTemplateColumns="300px 100px"
      gap={2}
      alignItems="center"
    >
      <Box paddingInlineStart={4}>{name}</Box>
      <Input
        type="text"
        value={value ?? ""}
        onChange={(e) => set(e.target.value || undefined)}
        w="full"
      />
    </Box>
  );
};

export function QueryControls({
  config,
  prefix,
  init,
  title = prefix,
  arrayValues,
  clearKeys,
  commitMode = false,
}: {
  config: Record<string, any>;
  prefix?: string;
  init?: InitTypes<typeof config>;
  title?: string;
  arrayValues?: Record<string, string[]>;
  clearKeys?: string[];
  commitMode?: boolean;
}) {
  const { query: synchedQuery, helpers: synchedHelpers } = useQueryParamHelpers(
    config,
    prefix,
    init
  );
  const {
    query: asyncQuery,
    helpers: asyncHelpers,
    applyQuery,
  } = useDeferredQueryParamHelpers(config, prefix, init);
  const query = commitMode ? asyncQuery : synchedQuery;
  const helpers = commitMode ? asyncHelpers : synchedHelpers;

  const blocks = useMemo(
    () =>
      Object.keys(config).map((key) => {
        const value = config[key];
        if (value === ArrayParam || value.isArray) {
          const values = arrayValues?.[key];
          if (values) {
            return (
              <ArrayCotrols
                key={key}
                name={key}
                value={query[key]}
                helpers={
                  helpers[key] as ParamHelpers<QueryParamConfig<unknown[]>>
                }
                values={values}
              />
            );
          } else {
            return (
              <Box
                key={key}
                display="grid"
                gridTemplateColumns="300px 100px"
                gap={2}
              >
                <Box paddingInlineStart={4}>{key}</Box>
                <Badge colorScheme="blue" as={Button}>
                  Array
                </Badge>
              </Box>
            );
          }
        } else if (
          value === BooleanParam ||
          typeof value?.default === "boolean"
        ) {
          return (
            <BooleanControls
              key={key}
              name={key}
              value={query[key]}
              helpers={helpers[key] as ParamHelpers<QueryParamConfig<boolean>>}
            />
          );
        } else if (value === NumberParam) {
          return (
            <NumberControls
              key={key}
              name={key}
              helpers={helpers[key]}
              value={query[key]}
            />
          );
        } else {
          return (
            <ValueControls
              key={key}
              name={key}
              value={query[key]}
              set={helpers[key].set}
            />
          );
        }
      }),
    [config, helpers, query, arrayValues]
  );

  return (
    <AccordionItem
      w="full"
      as={VStack}
      align="start"
      px={2}
      py={2}
      border="1px solid"
    >
      <HStack paddingInlineStart={4} spacing={10} mb={6} w="full">
        <AccordionButton
          bg="gray.700"
          w="full"
          title={JSON.stringify(query, null, 2)}
        >
          <AccordionIcon />
          <Heading as="h4">{title}</Heading>
        </AccordionButton>
        <Button
          variant="solid"
          colorScheme="blue"
          onClick={() => helpers.clear()}
        >
          Clear
        </Button>
        {commitMode ? <Button onClick={applyQuery}>Do it</Button> : undefined}
        {clearKeys?.length ? (
          <Button
            variant="solid"
            colorScheme="blue"
            onClick={() => helpers.clear(clearKeys)}
          >
            Clear [{clearKeys.join(",")}]
          </Button>
        ) : undefined}
      </HStack>
      <Box w="full">
        <AccordionPanel>
          <Accordion w="full" allowMultiple as={VStack} align="start">
            {blocks}
            <AccordionItem w="full">
              <AccordionButton bg="gray.700">
                <HStack w="full" textAlign="start">
                  <Box w="286px">Query</Box>
                </HStack>
                <AccordionIcon marginInlineStart="auto" />
              </AccordionButton>
              <AccordionPanel as={VStack} w="full" align="start">
                <Box as="pre">{JSON.stringify(query, null, 2)}</Box>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </AccordionPanel>
      </Box>
    </AccordionItem>
  );
}
