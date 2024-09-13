import * as React from "react";
import { Flex, Badge} from "@chakra-ui/react";

const FilterAndCategory = ({
    category,
    filters
}) => {
    const showingFilters: string[] = []
    console.log(filters)
    const stringifyFilter = (filter) => {
        if (filter.type === "ConjunctedFilter") {
            return `${filter.conjunction}: ${filter.filters.map(stringifyFilter).join(", ")}`
        }
        return `${filter.operator} ${filter.value}`
    }
    if (filters.date.type) {
        showingFilters.push("날짜: " + stringifyFilter(filters.date))
    }
    if (filters.court.type) {
        showingFilters.push("법원: " + stringifyFilter(filters.court))
    }
  return (
    <Flex direction={"column"}>
        {category && (
            <Flex paddingBottom={"15px"}>
                <Badge fontSize={"14px"} variant={"outline"}>사건종류: {category}</Badge>
            </Flex>
        )}
        {filters && (
            <Flex wrap={"wrap"} paddingTop={"5px"} gap={"5px"}>
                {showingFilters.map((filter) => (
                    <Badge colorScheme="blue" key={filter}>{filter}</Badge>
                ))}
            </Flex>
        )}
    </Flex>
  );
};

export default FilterAndCategory;
