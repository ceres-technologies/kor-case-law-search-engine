import * as React from "react";
import { useMediaQuery } from "react-responsive";
import { Icon, Fade, useToast } from "@chakra-ui/react";
import { useState, useCallback, useRef, useEffect, RefObject } from "react";
import { insertAt } from "../utils/TextUtils";
import { RelevantPart } from "../logics/Search";

export const handleEnterPress = async (e, callback) => {
  if (e.key === "Enter") {
    e.preventDefault();
    await callback();
  }
};

export const range = (start: number, end: number) => {
  return Array.from({ length: end - start }, (_, i) => start + i);
};

export const isMobileQuery = {
  query: "(max-width: 48em)",
};

export const isPCQuery = {
  query: "(min-width: 48.001em)",
};

export const OnlyMobile = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useMediaQuery(isMobileQuery);
  return <React.Fragment>{isMobile && children}</React.Fragment>;
};

export const OnlyPC = ({ children }: { children: React.ReactNode }) => {
  const isPc = useMediaQuery(isPCQuery);
  return <React.Fragment>{isPc && children}</React.Fragment>;
};

export const remToPx = (rem: string) => {
  return (
    parseFloat(rem) *
    parseFloat(getComputedStyle(document.documentElement).fontSize)
  );
};

export const useComponentHeight = () => {
  const [height, setHeight] = useState(0);
  const ref = useCallback((node) => {
    if (node !== null) {
      setHeight(node.getBoundingClientRect().height);
    }
  }, []);
  return [ref, height];
};

export const useElementHeight = (): [RefObject<HTMLDivElement>, number] => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    if (ref.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        const targetElement = entries[0].target as HTMLElement;
        setHeight(targetElement.offsetHeight);
      });

      resizeObserver.observe(ref.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [ref]);

  return [ref, height];
};

export const CircleIcon = (props: any) => (
  <Icon viewBox="0 0 200 200" {...props}>
    <path
      fill="currentColor"
      d="M 100, 100 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0"
    />
  </Icon>
);

const fontSizeMapping = {
  xs: "12px",
  sm: "14px",
  md: "16px",
  lg: "18px",
  xl: "20px",
};

const getFontSize = (size) => fontSizeMapping[size] || fontSizeMapping.md;

export const TextCursorBlink = ({ text, fontSize = "md" }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible((prevVisible) => !prevVisible);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const textStyle = {
    fontSize: getFontSize(fontSize),
  };

  const cursorStyle = {
    opacity: visible ? 1 : 0,
    transition: "opacity 0.1s",
    fontSize: getFontSize(fontSize),
    verticalAlign: "baseline",
  };

  return (
    <div style={textStyle}>
      {text}
      <span style={cursorStyle}>{"\uFE33"}</span>
    </div>
  );
};

export const BlinkItem = ({ children }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible((prevVisible) => !prevVisible);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Fade
      in={visible}
      transition={{ enter: { duration: 0.5 }, exit: { duration: 0.5 } }}
    >
      {children}
    </Fade>
  );
};

export const getHighlightByKeywords = (
  str: string,
  keywords: string[],
  tagSt: string = "<b>",
  tagEd: string = "</b>"
) => {
  let retStr = str;
  for (const keyword of keywords) {
    retStr = retStr.replace(keyword, `${tagSt}${keyword}${tagEd}`);
  }
  return retStr;
};

const removeDuplicates = (arr: string[]): string[] => {
  return arr.filter((item, index) => arr.indexOf(item) === index);
};

function removeBoldTags(text: string): string {
  return text.replace(/<b>|<\/b>/g, "");
}

export const highlightByKeywords = (contentsJson: any, keywords: string[]) => {
  const strippedReferences = keywords.map((ref) => ref.trim());
  const uniqueStrippedReferences = removeDuplicates(strippedReferences);
  const higlightedDocDic = {};
  // Deep copy
  const highlightedContentsJson = JSON.parse(JSON.stringify(contentsJson));

  Object.keys(contentsJson).forEach((key) => {
    if (contentsJson[key] !== undefined && contentsJson[key] !== null) {
      const snippets = [] as string[];
      const str = contentsJson[key];
      let snippet = getHighlightByKeywords(str, uniqueStrippedReferences);

      const matchingIndices = uniqueStrippedReferences
        .map((ref) => {
          const index: number = snippet!.indexOf(`<em>${ref}</em>`);
          return [index, index + ref.length + 9];
        })
        .filter((x) => x[0] !== -1);

      const extendedIndices = matchingIndices.map((x) => [
        Math.max(0, x[0] - 70),
        Math.min(snippet.length, x[1] + 70),
      ]);
      const mergedIndices = mergeIntervals(extendedIndices);
      const snippetTemp = mergedIndices.map((x) =>
        snippet.substring(x[0], x[1])
      );
      snippets.push(...snippetTemp);

      let highlightedContent = contentsJson[key];

      if (snippets.length > 0) {
        Object(snippets).forEach((snippet, index) => {
          const noEmtagSnippet = removeBoldTags(snippet);
          highlightedContent = highlightedContent.replace(
            noEmtagSnippet,
            `<span id="${key + String(index)}">${snippet}</span>`
          );
        });
        highlightedContentsJson[key] = highlightedContent;
        higlightedDocDic[key] = snippets;
      }
    }
  });

  return [higlightedDocDic, highlightedContentsJson];
};

export const getHighlightByRelevantPart = (
  str: string,
  relevantParts: RelevantPart[],
  tagSt: string = "<b>",
  tagEd: string = "</b>"
) => {
  // Assumption: relevantParts are not overlapping
  // 1. sort relevantParts by start
  relevantParts.sort((a, b) => a.start_offset - b.start_offset);
  // 2. insert tags
  let snippet = str;
  let offset = 0;
  const newIndices: number[][] = [];

  for (const relevantPart of relevantParts) {
    const start = relevantPart.start_offset + offset;
    const end = relevantPart.end_offset + offset + 4;
    offset += 9;
    snippet = insertAt(snippet, tagSt, start);
    snippet = insertAt(snippet, tagEd, end);
    newIndices.push([start, end + 5]);
  }
  return { snippet, newIndices };
};

// TODO : clean code
export const highlightByRelevantParts = (
  contentsJson: any,
  relevantParts: RelevantPart[]
) => {
  const higlightedDocDic = {};
  const highlightedContentsJson = { ...contentsJson };
  console.log(contentsJson);
  console.log(relevantParts);

  Object.keys(contentsJson).forEach((key) => {
    if (contentsJson[key] !== undefined && contentsJson[key] !== null) {
      const snippets = [] as string[];
      const str = contentsJson[key];
      const relevantPartsForThisKey = relevantParts.filter(
        (part) => part.key === key
      );
      let { snippet, newIndices } = getHighlightByRelevantPart(
        str,
        relevantPartsForThisKey
      );


      const extendedIndices = newIndices.map((x) => [
        Math.max(0, x[0] - 70),
        Math.min(snippet.length, x[1] + 70),
      ]);
      const mergedIndices = mergeIntervals(extendedIndices);
      const snippetTemp = mergedIndices.map((x) =>
        snippet.substring(x[0], x[1])
      );
      snippets.push(...snippetTemp);

      let highlightedContent = contentsJson[key];

      if (snippets.length > 0) {
        Object(snippets).forEach((snippet, index) => {
          const noEmtagSnippet = removeBoldTags(snippet);
          highlightedContent = highlightedContent.replace(
            noEmtagSnippet,
            `<span id="${key + String(index)}">${snippet}</span>`
          );
        });
        highlightedContentsJson[key] = highlightedContent;
        higlightedDocDic[key] = snippets;
      }
    }
  });

  return [higlightedDocDic, highlightedContentsJson];
};

function mergeIntervals(intervals) {
  if (!intervals.length) return [];

  intervals.sort((a, b) => a[0] - b[0]);

  const merged = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const lastMerged = merged[merged.length - 1];
    if (current[0] <= lastMerged[1]) {
      lastMerged[1] = Math.max(lastMerged[1], current[1]);
    } else {
      merged.push(current);
    }
  }

  return merged;
}

export const toastErrorMessage = ({
  toast,
  message,
  duration,
}: {
  toast: ReturnType<typeof useToast>;
  message: string;
  duration?: number;
}) => {
  toast({
    title: "Error",
    description: message,
    status: "error",
    duration: duration,
    isClosable: true,
  });
};
