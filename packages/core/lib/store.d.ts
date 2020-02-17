import { FileNode, FileType, TemplateData } from "@shuvi/types/core";
interface State {
    bootstrapFilePath: string;
    routesSource: string;
    files: FileNode[];
}
interface FileNodeOptions {
    type: FileType;
    [x: string]: any;
}
interface Actions {
    set(fn: (state: State) => void): void;
    addFileNode(path: string, options: FileNodeOptions): void;
}
declare const useStore: import("zustand").UseStore<State & Actions>;
export declare function initBootstrap(options: {
    bootstrapFilePath: string;
}): void;
export declare function addSelectorFile(path: string, files: string[], fallbackFile: string): void;
export declare function addTemplateFile(path: string, templateFile: string, data: TemplateData): void;
export declare function addFile(path: string, content: string): void;
export declare function setRoutesSource(content: string): void;
export { useStore };