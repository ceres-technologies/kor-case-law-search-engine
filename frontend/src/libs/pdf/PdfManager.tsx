import { PDFDocument, ReadingDirection } from "pdf-lib";
import React, { useState, useCallback, useRef, useEffect } from "react";
import * as pdfjs from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";
import "./PdfPage.css";

import { FixedSizeList } from "react-window";
import AwaitLock from "await-lock";
import { Center, Flex } from "@chakra-ui/react";

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const splitPDF = async (
  file: File,
  arrayBuffer,
  partitionSize,
): Promise<[number, File[]]> => {
  try {
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const numPages = pdfDoc.getPageCount();
    if (numPages <= partitionSize) {
      return [numPages, [file]];
    } else {
      let files: File[] = [];
      for (
        let startIndex = 0;
        startIndex < numPages;
        startIndex += partitionSize
      ) {
        const endIndex = Math.min(startIndex + partitionSize, numPages);
        const newPdfDoc = await PDFDocument.create();
        const pages = await newPdfDoc.copyPages(
          pdfDoc,
          Array.from(
            { length: endIndex - startIndex },
            (_, i) => i + startIndex,
          ),
        );
        pages.forEach((page) => newPdfDoc.addPage(page));
        const newPdfBytes = await newPdfDoc.save();
        const blob = new Blob([newPdfBytes], { type: "application/pdf" });
        const fileName = file.name;
        const newFile = new File([blob], fileName, { type: "application/pdf" });
        files.push(newFile);
      }
      return [numPages, files];
    }
  } catch (error) {
    console.error("Error loading PDF: ", error);
    return [0, []];
  }
};

export const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

export const Highlight = ({ top, left, width, height }) => (
  <div
    style={{
      position: "absolute",
      top: top,
      left: left,
      width: width,
      height: height,
      backgroundColor: "yellow",
      opacity: 0.15,
    }}
  />
);

export interface PdfPageViewerProps {
  url: string;
  pageId: number;
  highlightPosition: any;
  setHeight?: React.Dispatch<React.SetStateAction<number>>;
  onDocumentLoadStart: () => void;
  onDocumentLoadSuccess: () => void;
  isExpanded: boolean;
}

export const PdfPageViewer = React.memo((props: PdfPageViewerProps) => {
  const {
    url,
    pageId,
    highlightPosition,
    setHeight = () => {},
    onDocumentLoadStart,
    onDocumentLoadSuccess,
    isExpanded,
  } = props;
  const componentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const pageHeight = useRef(0);
  const pageWidth = useRef(0);
  const [innerHeight, setInnerHeight] = useState(0);

  useEffect(() => {
    if (url) {
      onDocumentLoadStart();
      var loadingTask = pdfjs.getDocument(url);
      loadingTask.promise.then((pdf) => {
        pdf.getPage(pageId + 1).then((page: pdfjs.PDFPageProxy) => {
          const resolution = window.devicePixelRatio;
          const preViewport = page.getViewport({ scale: 1 });
          const newScale = componentRef.current
            ? componentRef.current.offsetWidth / preViewport.width
            : 1;
          const viewport = page.getViewport({ scale: newScale * resolution });

          // Prepare canvas using PDF page dimensions
          const canvas = canvasRef.current;
          if (canvas != null) {
            const context = canvas?.getContext("2d");
            if (context) {
              canvas.width = viewport.width;
              canvas.height = viewport.height;

              canvas.style.width = `${Math.floor(
                viewport.width / resolution,
              )}px`;
              canvas.style.height = `${Math.floor(
                viewport.height / resolution,
              )}px`;
              setHeight(Math.floor(viewport.height / resolution));
              setInnerHeight(Math.floor(viewport.height / resolution));

              pageHeight.current = viewport.height / resolution;
              pageWidth.current = viewport.width / resolution;
              // Render PDF page into canvas context
              const renderContext = {
                canvasContext: context,
                viewport: viewport,
              };
              const renderTask = page.render(renderContext);
              renderTask.promise.then(function () {});
              page.getTextContent().then((textContent) => {
                if (!textLayerRef.current) {
                  return;
                }
                textLayerRef.current.style.setProperty(
                  "--scale-factor",
                  `${newScale}`,
                );
                pdfjs.renderTextLayer({
                  textContentSource: textContent,
                  container: textLayerRef.current,
                  viewport: viewport,
                  textDivs: [],
                });
              });
            }
          }
          onDocumentLoadSuccess();
        });
      });
    }
  }, [url, pageId]);
  const internalStyle = {
    width: "100%",
    height: "100%",
    alignItems: "center",

    justifyContent: "center",
  };

  return (
    <div style={internalStyle} ref={componentRef}>
      <Flex className="PdfPage" justifyContent={"center"} alignItems={"center"}>
        <Center
          transform={
            isExpanded
              ? undefined
              : `translate(0, -${highlightPosition.top * innerHeight - 30}px)`
          }
        >
          <Flex position={"relative"}>
            <canvas ref={canvasRef} />
            <div ref={textLayerRef} className="PdfPage__textLayer" />
            {canvasRef && (
              <Highlight
                top={highlightPosition.top * pageHeight.current}
                left={highlightPosition.left * pageWidth.current}
                width={
                  (highlightPosition.right - highlightPosition.left) *
                  pageWidth.current
                }
                height={
                  (highlightPosition.bottom - highlightPosition.top) *
                  pageHeight.current
                }
              />
            )}
          </Flex>
        </Center>
      </Flex>
    </div>
  );
});

export interface PdfPageProps {
  pageId: number;
  currentScale: number;
  pageHeight: number;
  getPdfPage: (pageId: number) => Promise<pdfjs.PDFPageProxy>;
  style?: React.CSSProperties;
  acquireLock: () => Promise<void>;
  releaseLockAndPrefetch: (pageId: number) => Promise<void>;
}

export const PdfPage = React.memo((props: PdfPageProps) => {
  const {
    pageId,
    currentScale,
    pageHeight,

    getPdfPage,
    style,
    acquireLock,
    releaseLockAndPrefetch,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    acquireLock().then(async () => {
      const page = await getPdfPage(pageId);
      const resolution = window.devicePixelRatio;
      const defaultViewport = page.getViewport({ scale: 1 });
      // Calculate the scale required to match the desired pageHeight
      const desiredScale = pageHeight / defaultViewport.height;
      const scale = desiredScale * resolution;

      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;

      if (canvas) {
        const context = canvas.getContext("2d");
        if (context) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          canvas.style.width = `${Math.floor(viewport.width / resolution)}px`;
          canvas.style.height = `${Math.floor(viewport.height / resolution)}px`;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          page.cleanupAfterRender = true;
          const renderTask = page.render(renderContext);
          renderTask.promise.then(function () {});

          page.getTextContent().then((textContent) => {
            if (!textLayerRef.current) {
              releaseLockAndPrefetch(pageId);
              return;
            }
            textLayerRef.current.style.setProperty(
              "--scale-factor",
              `${desiredScale}`,
            );
            pdfjs.renderTextLayer({
              textContentSource: textContent,
              container: textLayerRef.current,
              viewport: viewport,
              textDivs: [],
            });
          });
        }
      }
      releaseLockAndPrefetch(pageId);
    });
  }, [pageId, currentScale, pageHeight]);

  const internalStyle = {
    ...style,
    // width: "calc(100% - 0px)",
    display: "flex",
    alignItems: "center",
    minHeight: `${pageHeight}px`,
    height: `${pageHeight}px`,
    maxHeight: `${pageHeight}px`,
    // backgroundColor: "red",
  };

  return (
    <div style={internalStyle}>
      <div
        style={{
          minHeight: `${pageHeight}px`,
          height: `${pageHeight}px`,
          maxHeight: `${pageHeight}px`,
        }}

        // overflowY={"hidden"}
      >
        <div className="PdfPage">
          <canvas ref={canvasRef} />
          <div ref={textLayerRef} className="PdfPage__textLayer" />
        </div>
      </div>
    </div>
  );
});

export interface CurrentPageNoProps {
  numPages: number | null;
  currentPageNo: number;
}

export const CurrentPageNoViewer = (props: CurrentPageNoProps) => {
  const { numPages, currentPageNo } = props;
  return (
    <b>{numPages ? currentPageNo + "/" + numPages : currentPageNo + "/"}</b>
  );
};

export interface PdfProps {
  fileId: number;
  gap: number;
  highlight: boolean;
  highlightPage?: number;
  highlightPosition?: any;
  pdfWidth?: number;
  pdfHeight?: number;
  fullHeight?: boolean;
  fullWidth?: boolean;
  backgroundColor?: string;
  prefetchSize: number;
  windowRef: FixedSizeList | null;
  getFileInfo: (fileId: number) => Promise<[number, number, number]>;
  getUrlOfPartition: (
    fileId: number,
    numPartitions: number,
    partitionId: number,
  ) => Promise<string>;
  onDocumentLoadSuccess: (numPages: number) => void;
  setCurrentPageNo: (currentPageNo: number) => void;
  startPage: number;
}

export const LargePdfViewer = React.memo((props: PdfProps) => {
  const {
    fileId,
    gap = 40,
    highlight,
    highlightPage,
    highlightPosition,
    pdfWidth = 600,
    pdfHeight = 900,
    fullHeight = false,
    fullWidth = false,
    backgroundColor = "gray.100",
    prefetchSize = 5,
    windowRef,
    getFileInfo,
    getUrlOfPartition,
    onDocumentLoadSuccess,
    setCurrentPageNo,
    startPage,
  } = props;

  const componentRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const listRef = useRef<FixedSizeList>(null);
  const [currentScale, setCurrentScale] = useState(1);
  const widthPerPage = useRef(0);
  const heightPerPage = useRef(0);
  const [height, setHeight] = useState(900);

  const [isReadyToMove, setIsReadyToMove] = useState(false);

  const updateSize = () => {
    if (componentRef.current) {
      const newScale =
        (componentRef.current.offsetWidth - 10) / widthPerPage.current;
      setCurrentScale(newScale);
      setIsReadyToMove(true);
      setHeight(componentRef.current.offsetHeight);
    }
  };

  React.useLayoutEffect(() => {
    updateSize();
  }, [componentRef.current]);

  useEffect(() => {
    window.addEventListener("resize", updateSize); // Add resize event listener to update width on window resize
    return () => {
      window.removeEventListener("resize", updateSize); // Clean up event listener on component unmount
    };
  }, []);

  // useEffect(() => {
  //   if (isReady) {
  //     updateSize();
  //     listRef.current.resetAfterIndex(0);
  //   }
  // }, [isReady]);

  // useEffect(() => {
  //   if (listRef.current) {
  //     listRef.current.resetAfterIndex(0, true);
  //   }
  // }, [currentScale]);

  let lock = new AwaitLock();

  const numPages = useRef(0);
  const numPartitions = useRef(0);
  const numPagesPerPartition = useRef(1);
  const numLoadedPartitions = useRef(0);
  const accessedTimes = useRef<(number | any)[]>([]);
  const partitions = useRef<(pdfjs.PDFDocumentProxy | any)[]>([]);
  const threshold = 20;

  const getPdfPage = async (pageId: number) => {
    const partitionId: number = getPartitionId(pageId);
    return fetchPartition(partitionId).then((partition) => {
      if (partitionId === 0) return partition.getPage(pageId + 1);
      else
        return partition.getPage((pageId % numPagesPerPartition.current) + 1);
    });
  };

  useEffect(() => {
    if (listRef.current && isReadyToMove) {
      listRef.current.scrollToItem(startPage, "start");
    }
  }, [startPage, isReadyToMove]);

  useEffect(() => {
    if (fileId) {
      getFileInfo(fileId).then(
        ([fetchedNumPages, fetchedPartitionSize, fetchedNumPartitions]) => {
          numPartitions.current = fetchedNumPartitions;
          numPagesPerPartition.current = fetchedPartitionSize;
          numPages.current = fetchedNumPages;
          const mainPageId = fetchedNumPages > 1 ? 1 : 0;
          getPdfPage(mainPageId).then((page) => {
            const scale = 1;
            const viewport = page.getViewport({ scale });
            heightPerPage.current = viewport.height;
            widthPerPage.current = viewport.width;
            setIsReady(true);
            onDocumentLoadSuccess(numPages.current);
          });
        },
      );
    }
  }, [fileId]);

  const getPartitionId = (pageId: number) => {
    if (numPartitions.current == 1) return 0;
    const partitionId = Math.floor(pageId / numPagesPerPartition.current);
    return partitionId;
  };

  const evictPartition = async () => {
    if (numLoadedPartitions.current < threshold) return;
    var i: number = 0;
    // Find victim

    var victim = -1;
    const currentTime = new Date(); // Gets the current date and time
    var accessedTimeOfVictim = currentTime.getTime();
    for (; i < numPartitions.current; ++i) {
      if (accessedTimes.current[i]) {
        const accessedTime = accessedTimes.current[i];
        if (victim == -1 || accessedTime < accessedTimeOfVictim) {
          victim = i;
          accessedTimeOfVictim = accessedTime;
        }
      }
    }
    partitions.current[victim].destroy();
    partitions.current[victim] = undefined;
    accessedTimes.current[victim] = null;
    numLoadedPartitions.current -= 1;
  };

  const acquireLock = async () => {
    await lock.acquireAsync();
  };

  const releaseLockAndPrefetch = async (pageId: number) => {
    await prefetchPartitions(pageId);
    lock.release();
  };

  const fetchPartition = async (partitionId: number) => {
    const partition = partitions.current[partitionId];
    const currentTime = new Date(); // Gets the current date and time
    const epochTime = currentTime.getTime();
    accessedTimes.current[partitionId] = epochTime;
    if (!partition) {
      await evictPartition();
      return getUrlOfPartition(fileId, numPartitions.current, partitionId).then(
        (url: string) => {
          var loadingTask = pdfjs.getDocument(url);
          numLoadedPartitions.current += 1;
          return loadingTask.promise.then((pdf) => {
            partitions.current[partitionId] = pdf;
            return pdf;
          });
        },
      );
    }
    return Promise.resolve(partitions.current[partitionId]);
  };

  const prefetchPartitions = async (pageId: number) => {
    const partitionId = getPartitionId(pageId);

    for (let i = 0; i < prefetchSize; ++i) {
      if (partitionId + i + 2 < numPartitions.current) {
        await fetchPartition(partitionId + i + 1);
      }
      if (partitionId - i - 1 > 0) {
        await fetchPartition(partitionId - i - 1);
      }
    }
  };

  const handleItemsRendered = useCallback(({ visibleStartIndex }) => {
    setCurrentPageNo(visibleStartIndex + 1);
  }, []);

  // const handleOnScroll = useCallback(
  //   ({ scrollDirection, scrollOffset, scrollUpdateWasRequested }) => {
  //     console.log("scrollDirection", scrollDirection);
  //     console.log("scrollOffset", scrollOffset);
  //     console.log("scrollUpdateWasRequested", scrollUpdateWasRequested);
  //   },
  //   [],
  // );

  const itemSize = Math.floor(heightPerPage.current * currentScale) + gap;

  const handleListRef = useCallback(
    (elem) => {
      listRef.current = elem;
      if (windowRef) {
        windowRef.current = elem;
      }
    },
    [windowRef],
  );
  if (isReady) {
    return (
      <div
        ref={componentRef}
        style={{
          width: "100%",
          height: "calc(100% - 50px)",
          alignItems: "center",
        }}
      >
        <FixedSizeList
          ref={handleListRef}
          height={height}
          itemCount={numPages.current}
          itemSize={itemSize}
          onItemsRendered={handleItemsRendered}
          style={{
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {({ index, style }) => {
            return (
              <PdfPage
                pageId={index}
                currentScale={currentScale}
                pageHeight={itemSize - gap}
                getPdfPage={getPdfPage}
                style={style}
                acquireLock={acquireLock}
                releaseLockAndPrefetch={releaseLockAndPrefetch}
              />
            );
          }}
        </FixedSizeList>
      </div>
    );
  } else {
    return <div> </div>;
  }
});
