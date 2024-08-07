import { useState } from "react";
import { Box, Button, HStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";

let count = 0;

function useQueryTester(payload: Record<string, any>) {
  return useQuery({
    queryKey: ["queryTester", payload],
    queryFn: (a: any) => {
      console.log(">>> query with: ", a.queryKey, count);
      return count++;
    },
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
    y: 12,
    x: 11,
  },
  {
    y: 12,
    x: 11,
  },
  {
    z: 33,
  },
];

export function QueryTester2() {
  return <Box>kuku</Box>;
}

export function QueryTester() {
  const [idx, setIdx] = useState(0);
  const result = useQueryTester({ ...configs[idx], extraParam: 333 });

  return (
    <Box>
      <Box>bong</Box>
      <HStack>
        <Button
          onClick={() => setIdx((configs.length + idx - 1) % configs.length)}
        >
          prev
        </Button>
        <Box title={JSON.stringify(configs[idx])}>
          idx: {idx}, {result?.data}
        </Box>
        <Button onClick={() => setIdx((idx + 1) % configs.length)}>next</Button>
      </HStack>
    </Box>
  );
}
