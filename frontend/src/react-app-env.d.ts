/// <reference types="react-scripts" />

declare namespace React {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: boolean;
    directory?: boolean;
  }
}
