import { useState } from "react";
import { Box, Button, HStack, VStack } from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

let count = 0;

function useQueryTester(payload: Record<string, any>) {
  return useQuery({
    queryKey: ["queryTester", payload],
    queryFn: (a: any) => {
      console.log(">>> query with: ", a.queryKey, count);
      return count++;
    },
    staleTime: 5000,
  });
}

const configs = [
  {
    x: 11,
    y: 12,
  },
  {
    y: 12,
    x: 11,
  },
  {
    x: 11,
    y: 12,
  },
  {
    y: 12,
    x: 11,
  },
  {
    z: 33,
  },
];

const simpleQueryKey = "simpleQuery";

function useSimpleQuery() {
  return useQuery({
    queryKey: [simpleQueryKey, "miro"],
    queryFn: () => {
      console.log(">>> simpleQuery");
      return Date.now() % 100;
    },
    staleTime: 24 * 60 * 60 * 1000,
  });
}

function SimpleDisplay() {
  const simpleResult = useSimpleQuery();

  return (
    <VStack w="full" align="start">
      <Box>simpleResult: {simpleResult?.data}</Box>
    </VStack>
  );
}

export function QueryTester() {
  const [idx, setIdx] = useState(0);
  const result = useQueryTester({ ...configs[idx], extraParam: 333 });
  const queryClient = useQueryClient();

  if (Math.random()) {
    return (
      <VStack w="full" align="start">
        <SimpleDisplay />
        <Button
          onClick={() => {
            queryClient.invalidateQueries({
              // queryKey: ["miro"],
              queryKey: [simpleQueryKey],
              // exact: true,
              // refetchType: "all",
              // predicate: (query) => {
              //   console.log(">>>> ", query);
              //   return true;
              // },
            });
          }}
        >
          invalidate
        </Button>
      </VStack>
    );
  }
  return (
    <VStack w="full" align="start">
      <HStack>
        <Button
          onClick={() => setIdx((configs.length + idx - 1) % configs.length)}
        >
          prev
        </Button>
        <Box title={JSON.stringify(configs[idx])}>
          idx: {idx}, {result?.data},
        </Box>
        <Button onClick={() => setIdx((idx + 1) % configs.length)}>next</Button>
      </HStack>
      <Box as="pre">{JSON.stringify(configs[idx], null, 2)}</Box>
    </VStack>
  );
}
