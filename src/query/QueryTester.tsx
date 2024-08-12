import { useState, Suspense } from "react";
import { Box, Button, HStack, VStack } from "@chakra-ui/react";
import {
  keepPreviousData,
  useQuery,
  // useSuspenseQuery,
  useQueryClient,
} from "@tanstack/react-query";

let count = 0;

function useQueryTester(idx: number, payload: Record<string, any>) {
  return useQuery<number>({
    queryKey: ["queryTester", idx, payload],
    queryFn: (a: any) => {
      console.log(">>> query with: ", a.queryKey, count);
      // return count++;
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(count++);
        }, 5000);
      });
    },
    staleTime: 5000,
    placeholderData: keepPreviousData,
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
const sk1 = { x: 11, y: 12, z: 13 };
const sk2 = { y: 12, x: 11 };

function useSimpleQuery() {
  return useQuery({
    queryKey: [simpleQueryKey, sk1],
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

function SubTester({ rnd }: { rnd?: number }) {
  const result = useQueryTester(rnd ?? 0, {
    ...configs[0],
    extraParam: 333,
    // rnd,
    // rnd: Date.now() % 100,
  });

  return <Box>sub tester: {result?.data}</Box>;
}

function QueryTesterBase() {
  const [idx, setIdx] = useState(0);
  const [count, setCount] = useState(0);
  const result = useQueryTester(count, { ...configs[idx], extraParam: 333 });
  const queryClient = useQueryClient();

  if (Math.random()) {
    return (
      <VStack w="full" align="start">
        <SimpleDisplay />
        <Button
          onClick={() => {
            queryClient.invalidateQueries({
              // queryKey: ["miro"],
              queryKey: [simpleQueryKey, sk2],
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

        <VStack w="full" align="start" border="1px solid red">
          <Button onClick={() => setCount(count + 1)}>inc</Button>
          <Box>count: {count}</Box>
          <Box>tester: {result?.data}</Box>
          <Suspense fallback={<Box>I am loading!</Box>}>
            {count % 2 ? <SubTester rnd={count} /> : null}
          </Suspense>
        </VStack>
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

export function QueryTester() {
  return (
    <Suspense fallback={<Box>Wait!</Box>}>
      <QueryTesterBase />
    </Suspense>
  );
}
