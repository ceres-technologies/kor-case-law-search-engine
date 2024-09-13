import { atom } from "jotai";
import { LLMModel } from "../logics/Search";
const isDevMode = process.env.REACT_APP_DEV_MODE === "true" ? true : false;

export const modelAtom = atom<LLMModel>(
  isDevMode ? "gpt-3.5-turbo-16k" : "gpt-4-1106-preview"
);
