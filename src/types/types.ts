/**
 * IEC data type interface
 */
export interface IecType {
  /**
   * Name of the IEC data type as string
   */
  type: string,

  /**
   * Size of the data in bytes
   */
  byteLength: number,

  /**
   * Converts given Javascript object to Buffer
   */
  /* eslint-disable @typescript-eslint/no-explicit-any*/
  convertToBuffer: (data: any) => Buffer,
  
  /**
   * Converts given Buffer data to Javascript object
   */
  convertFromBuffer: (data: Buffer) => Record<string, unknown> | unknown,

  /**
   * Returns default (empty) Javascript object representing the IEC type
   */
  getDefault: () => Record<string, unknown> | unknown
}


/**
 * Anything that can be under STRUCT data type
 */
export type StructChildren = Record<string, IecType> | Record<string, never> | undefined | null