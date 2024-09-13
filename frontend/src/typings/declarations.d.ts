declare module "*.png";
declare module "*.svg";
declare module "react-show-more-text";
declare module "pdfjs-dist/build/pdf.worker.entry";
declare module "react-pdf";
declare module "react-html-parser";

interface Window {
  myGlobal: {
    REACT_APP_API_URL: string;
    REACT_APP_WS_URL: string;
  };
}
