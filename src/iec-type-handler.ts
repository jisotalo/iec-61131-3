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

import iconv from 'iconv-lite'

import type {
  IecType,
  StructChildren
} from './types/types'


/**
 * Base abstract type
 */
abstract class TypeBase implements Partial<IecType> {
  type = ''
  byteLength = 0
}





/**
 * IEC 61131-3 type: STRUCT
 */
export class STRUCT extends TypeBase implements IecType {
  type = 'STRUCT'
  /**
   * STRUCT children data types
   */
  children: StructChildren

  constructor(children: StructChildren) {
    super()
    
    this.children = children

    //Calculating struct size
    for (const key in this.children) {
      this.byteLength += this.children[key].byteLength
    }
  }


  convertToBuffer(data: StructChildren): Buffer {
    if (!data)
      return Buffer.alloc(0)

    const buffer = Buffer.alloc(this.byteLength)
    let pos = 0

    for (const key in this.children) {
      const converted = this.children[key].convertToBuffer(data[key])

      converted.copy(buffer, pos)
      pos += converted.byteLength
    }

    return buffer
  }

  convertFromBuffer(data: Buffer): Record<string, unknown> {
    const obj = {} as Record<string, unknown>
    let pos = 0

    for (const key in this.children) {
      obj[key] = this.children[key].convertFromBuffer(data.slice(pos, pos + this.children[key].byteLength))
      pos += this.children[key].byteLength
    }

    return obj
  }

  getDefault(): Record<string, unknown> {
    const obj = {} as Record<string, unknown>

    for (const key in this.children) {
      obj[key] = this.children[key].getDefault()
    }

    return obj
  }
}




/**
 * IEC 61131-3 type: ARRAY
 * Handles 1..3 dimensional arrays
 */
export class ARRAY extends TypeBase implements IecType {
  type = 'ARRAY'
  dataType: IecType
  dimensions: number[] = []
  totalSize = 0

  /**
   * Constructor for array
   * @param dataType Data type of the array (example: iec.INT)
   * @param dimensions If 1-dimensional array: Array dimension (size) as number. If multi-dimensional array, array dimensions as array (like [1, 10, 5])
   */
  constructor(dataType: IecType, dimensions: number | number[]) {
    super()

    this.dataType = dataType

    if (Array.isArray(dimensions)) {
      this.dimensions = dimensions
    } else {
      this.dimensions.push(dimensions)
    }
      
    //Calculating total size
    this.totalSize = this.dimensions.reduce((total, size) => total * size, 1)
    this.byteLength = this.totalSize * dataType.byteLength
  }


  convertToBuffer(data: unknown[]): Buffer {
    if (!data)
      return Buffer.alloc(0)

    const buffer = Buffer.alloc(this.byteLength)
    let pos = 0

    //Recursive handling of array dimensions
    //Loops dimensions until we found the last one and then reads the data
    const parseArray = (data: unknown[], arrayDimension: number): void => {
      
      for (let dimension = 0; dimension < this.dimensions[arrayDimension]; dimension++) {
        if (this.dimensions[arrayDimension + 1]) {
          //More dimensions available -> go deeper
          parseArray(data[dimension] as unknown[], arrayDimension + 1)

        } else {
          //This is the final dimension -> we have actual data
          const converted = this.dataType.convertToBuffer(data[dimension])
          converted.copy(buffer, pos)
          pos += converted.byteLength
        }
      }
    }

    //Start from 1st dimension
    parseArray(data, 0)

    return buffer
  }

  convertFromBuffer(data: Buffer): unknown[] {
    let pos = 0

    //Recursive handling of array dimensions
    //Loops dimensions until we found the last one and then fills with data
    const parseArray = (arrayDimension: number): unknown[] => {
      const result = []

      for (let dimension = 0; dimension < this.dimensions[arrayDimension]; dimension++) {
        if (this.dimensions[arrayDimension + 1]) {
          //More dimensions available -> go deeper
          result.push(parseArray(arrayDimension + 1))

        } else {
          //This is the final dimension -> we have actual data
          result.push(this.dataType.convertFromBuffer(data.slice(pos, pos + this.dataType.byteLength)))
          pos += this.dataType.byteLength
        }
      }
      return result
    }

    //Start from 1st dimension
    return parseArray(0)
  }

  getDefault(): unknown[] {

    //Recursive parsing of array dimensions
    //Loops dimensions until we found the last one and then fills with data
    const parseArray = (arrayDimension: number): unknown[] => {
      const result = []

      for (let dimension = 0; dimension < this.dimensions[arrayDimension]; dimension++) {
        if (this.dimensions[arrayDimension + 1]) {
          //More dimensions available -> go deeper
          result.push(parseArray(arrayDimension + 1))

        } else {
          //This is the final dimension -> we have actual data
          result.push(this.dataType.getDefault())
        }
      }
      return result
    }

    //Start from 1st dimension
    return parseArray(0)
  }
}




/**
 * IEC 61131-3 type: STRING
 * Default length 80 characters
 */
export class STRING extends TypeBase implements IecType {
  type = 'STRING'
  byteLength = 80

  /**
   * Constructor for string
   * @param length Length of the string variable (similar as in the PLC), default is 80
   */
  constructor(length = 80) {
    super()

    //Adding string end delimeter
    this.byteLength = length + 1
  }

  convertToBuffer(data: string): Buffer {
    const buffer = Buffer.alloc(this.byteLength)
    iconv.encode(data, 'cp1252').copy(buffer)
  
    return buffer
  }

  convertFromBuffer(data: Buffer): string {
    return trimPlcString(iconv.decode(data, 'cp1252'))
  }

  getDefault(): string {
    return ''
  }
}




/**
 * IEC 61131-3 type: WSTRING
 * Default length 80 characters
 */
export class WSTRING extends TypeBase implements IecType {
  type = 'WSTRING'
  byteLength = 160

  /**
   * Constructor for wstring
   * @param length Length of the string variable (similar as in the PLC), default is 80
   */
  constructor(length = 80) {
    super()

    //Adding string end delimeter
    this.byteLength = length * 2 + 2
  }

  convertToBuffer(data: string): Buffer {
    const buffer = Buffer.alloc(this.byteLength)
    iconv.encode(data, 'ucs2').copy(buffer)

    return buffer
  }

  convertFromBuffer(data: Buffer): string {
    return trimPlcString(iconv.decode(data, 'ucs2'))
  }

  getDefault(): string {
    return ''
  }
}



/**
 * IEC 61131-3 type: BOOL (1 byte)
 */
export class BOOL extends TypeBase implements IecType {
  type = 'BOOL'
  byteLength = 1

  convertToBuffer(data: boolean): Buffer {
    const buffer = Buffer.alloc(this.byteLength)
    buffer.writeUInt8(data ? 1 : 0)

    return buffer
  }

  convertFromBuffer(data: Buffer): boolean {
    return data.readUInt8() ? true : false
  }

  getDefault(): boolean {
    return false
  }
}



/**
 * IEC 61131-3 type: USINT (1 byte)
 */
export class USINT extends TypeBase implements IecType {
  type = 'USINT'
  byteLength = 1

  convertToBuffer(data: number): Buffer {
    const buffer = Buffer.alloc(this.byteLength)
    buffer.writeUInt8(data)

    return buffer
  }

  convertFromBuffer(data: Buffer): number {
    return data.readUInt8()
  }

  getDefault(): number {
    return 0
  }
}


/**
 * IEC 61131-3 type: BYTE (1 byte)
 */
export class BYTE extends USINT implements IecType {
  type = 'BYTE'
}



/**
 * IEC 61131-3 type: SINT (1 byte)
 */
export class SINT extends TypeBase implements IecType {
  type = 'SINT'
  byteLength = 1

  convertToBuffer(data: number): Buffer {
    const buffer = Buffer.alloc(this.byteLength)
    buffer.writeInt8(data)

    return buffer
  }

  convertFromBuffer(data: Buffer): number {
    return data.readInt8()
  }

  getDefault(): number {
    return 0
  }
}




/**
 * IEC 61131-3 type: UINT (2 bytes)
 */
export class UINT extends TypeBase implements IecType {
  type = 'UINT'
  byteLength = 2

  convertToBuffer(data: number): Buffer {
    const buffer = Buffer.alloc(this.byteLength)
    buffer.writeUInt16LE(data)

    return buffer
  }

  convertFromBuffer(data: Buffer): number {
    return data.readUInt16LE()
  }

  getDefault(): number {
    return 0
  }
}



/**
 * IEC 61131-3 type: WORD (2 bytes)
 */
export class WORD extends UINT implements IecType {
  type = 'WORD'
}



/**
 * IEC 61131-3 type: INT (2 bytes)
 */
export class INT extends TypeBase implements IecType {
  type = 'INT'
  byteLength = 2

  convertToBuffer(data: number): Buffer {
    const buffer = Buffer.alloc(this.byteLength)
    buffer.writeInt16LE(data)

    return buffer
  }

  convertFromBuffer(data: Buffer): number {
    return data.readInt16LE()
  }

  getDefault(): number {
    return 0
  }
}


/**
 * IEC 61131-3 type: DINT (4 bytes)
 */
export class DINT extends TypeBase implements IecType {
  type = 'DINT'
  byteLength = 4

  convertToBuffer(data: number): Buffer {
    const buffer = Buffer.alloc(this.byteLength)
    buffer.writeInt32LE(data)

    return buffer
  }

  convertFromBuffer(data: Buffer): number {
    return data.readInt32LE()
  }

  getDefault(): number {
    return 0
  }
}



/**
 * IEC 61131-3 type: UDINT (4 bytes)
 */
export class UDINT extends TypeBase implements IecType {
  type = 'UDINT'
  byteLength = 4

  convertToBuffer(data: number): Buffer {
    const buffer = Buffer.alloc(this.byteLength)
    buffer.writeUInt32LE(data)

    return buffer
  }

  convertFromBuffer(data: Buffer): number {
    return data.readUInt32LE()
  }

  getDefault(): number {
    return 0
  }
}



/**
 * IEC 61131-3 type: DWORD (4 bytes)
 */
export class DWORD extends UDINT implements IecType {
  type = 'DWORD'
}



/**
 * IEC 61131-3 type: TIME (4 bytes)
 */
export class TIME extends UDINT implements IecType {
  type = 'TIME'
}



/**
 * IEC 61131-3 type: TOD (4 bytes)
 */
export class TOD extends UDINT implements IecType {
  type = 'TOD'
}



/**
 * IEC 61131-3 type: TIME_OF_DAY (4 bytes)
 */
export class TIME_OF_DAY extends TOD implements IecType {
  type = 'TIME_OF_DAY'
}



/**
 * IEC 61131-3 type: DT (4 bytes)
 * TODO: Conversion to Javascript Date object?
 */
export class DT extends UDINT implements IecType {
  type = 'DT'
}



/**
 * IEC 61131-3 type: DATE_AND_TIME (4 bytes)
 * TODO: Conversion to Javascript Date object?
 */
export class DATE_AND_TIME extends DT implements IecType {
  type = 'DATE_AND_TIME'
}



/**
 * IEC 61131-3 type: DATE (4 bytes)
 * TODO: Conversion to Javascript Date object?
 */
export class DATE extends UDINT implements IecType {
  type = 'DATE'
}




/**
 * IEC 61131-3 type: REAL (4 bytes)
 */
export class REAL extends TypeBase implements IecType {
  type = 'REAL'
  byteLength = 4

  convertToBuffer(data: number): Buffer {
    const buffer = Buffer.alloc(this.byteLength)
    buffer.writeFloatLE(data)

    return buffer
  }

  convertFromBuffer(data: Buffer): number {
    return data.readFloatLE()
  }

  getDefault(): number {
    return 0
  }
}




/**
 * IEC 61131-3 type: LREAL (4 bytes)
 */
export class LREAL extends TypeBase implements IecType {
  type = 'LREAL'
  byteLength = 8

  convertToBuffer(data: number): Buffer {
    const buffer = Buffer.alloc(this.byteLength)
    buffer.writeDoubleLE(data)

    return buffer
  }

  convertFromBuffer(data: Buffer): number {
    return data.readDoubleLE()
  }

  getDefault(): number {
    return 0
  }
}




/**
 * IEC 61131-3 type: ULINT (8 bytes)
 * TODO: Requires Node.js that supports BigInt
 */
export class ULINT extends TypeBase implements IecType {
  type = 'ULINT'
  byteLength = 8

  convertToBuffer(data: bigint): Buffer {
    const buffer = Buffer.alloc(this.byteLength)
    buffer.writeBigUInt64LE(data)

    return buffer
  }

  convertFromBuffer(data: Buffer): bigint {
    return data.readBigUInt64LE()
  }

  getDefault(): number {
    return 0
  }
}




/**
 * IEC 61131-3 type: LWORD (8 bytes)
 * TODO: Requires Node.js that supports BigInt
 */
export class LWORD extends ULINT implements IecType {
  type = 'LWORD'
}




/**
 * IEC 61131-3 type: LINT (8 bytes)
 * TODO: Requires Node.js that supports BigInt
 */
export class LINT extends TypeBase implements IecType {
  type = 'LINT'
  byteLength = 8

  convertToBuffer(data: bigint): Buffer {
    const buffer = Buffer.alloc(this.byteLength)
    buffer.writeBigInt64LE(data)

    return buffer
  }

  convertFromBuffer(data: Buffer): bigint {
    return data.readBigInt64LE()
  }

  getDefault(): number {
    return 0
  }
}





/**
 * Trims the given PLC string until end mark (\0, 0 byte) is found
 * (= removes empty bytes from end of the string)
 * @param {string} plcString String to trim
 * 
 * @returns {string} Trimmed string
 */
const trimPlcString = (plcString: string): string => {
  let parsedStr = ''

  for (let i = 0; i < plcString.length; i++) {
    if (plcString.charCodeAt(i) === 0) break

    parsedStr += plcString[i]
  }

  return parsedStr
}


