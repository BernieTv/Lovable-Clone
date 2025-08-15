export type FileCollection = { [path: string]: string };

export type TreeItem = string | [string, ...TreeItem[]];