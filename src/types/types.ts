/*
https://github.com/jisotalo/iec-61131-3

Copyright (c) 2021 Jussi Isotalo <j.isotalo91@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


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



/**
 * Extracted STRUCT definition from string declaration - used in fromString()
 */
export interface ExtractedStruct {
  /**
   * Data type of the struct as string (like ST_Example)
   */
  dataType: string,

  /**
   * Array of extracted children variables of the struct (names and data types as string)
   */
  children: ExtractedStructVariable[],

  /**
   * Resolved struct children variable declarations (names and resolved IEC data types)
   * Note: This might be undefined if data type is not yet resolved (like struct that contains structs)
   */
  resolved?: Record<string, IecType>,
}



/**
 * Extracted STRUCT child variable definition from string declaration - used in fromString()
 */
export interface ExtractedStructVariable {
  /**
   * Variable name
   */
  name: string,

  /**
   * Variable data type as string
   */
  dataType: string
}