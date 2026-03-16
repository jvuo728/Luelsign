export type FieldType = "signature" | "date" | "text";

export interface Field {
  id: string;
  documentId: string;
  type: FieldType;
  page: number;    // 1-indexed
  x: number;       // 0 to 1, relative to page width, from LEFT
  y: number;       // 0 to 1, relative to page height, from TOP
  width: number;   // 0 to 1, relative to page width
  height: number;  // 0 to 1, relative to page height
  label: string;
}
