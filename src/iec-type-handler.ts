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
  EnumDataType,
  EnumEntry,
  EnumValue,
  IecType,
  IteratedIecType
} from './types/types'


/**
 * Base abstract type
 */
abstract class TypeBase implements Partial<IecType> {
  type = ''
  byteLength = 0

  /**
   * Shorthand for variableIterator()
   * --> for(const variable of dataType) {...}
   */
  public *[Symbol.iterator](): IterableIterator<IteratedIecType> {
    let startIndex = 0;

    //Helper recursive function
    function* iterate(dt: IecType): IterableIterator<IteratedIecType> {
      if (dt.children === undefined) {
        yield {
          name: undefined,
          startIndex,
          type: dt
        }
        startIndex += dt.byteLength;
      } else {
        for (const name in dt.children) {
          const type = dt.children[name]

          if (type.children !== undefined) {
            //There are children -> go deeper
            yield* iterate(type)
          } else {
            yield {
              name,
              startIndex,
              type
            }
            startIndex += type.byteLength;
          }
        }
      }
    }

    yield * iterate(this as unknown as IecType)
  }

  /**
   * Iterator for looping through all variables in memory order
   * NOTE: Array variable is _one_ variable, see elementIterator() for looping each array element
   * 
   * Usage: for(const variable of dataType.variableIterator()) {...}
   * Shorthand for this is: for(const variable of dataType) {...}
   */
  public *variableIterator(): IterableIterator<IteratedIecType> { 
    yield* this[Symbol.iterator]();
  }

  /**
   * Iterator for looping through all variables (and their array elements) in memory order
   * NOTE: Each array element is yield separately unlike with variableIterator()
   * 
   * Usage: for(const variable of dataType.elementIterator()) {...}
   * 
   */
  public *elementIterator(): IterableIterator<IteratedIecType> {
    function* iterateArrayLevel(dt: ARRAY, startIndex: number, name?: string): IterableIterator<IteratedIecType> {
      for (let i = 0; i < dt.totalSize; i++) {
        if (dt.dataType instanceof ARRAY) {
          yield* iterateArrayLevel(dt.dataType, startIndex + dt.dataType.byteLength * i, `${name}[${i}]`)
        } else {
          yield {
            name: `${name}[${i}]`,
            startIndex: startIndex + dt.dataType.byteLength * i,
            type: dt.dataType
          }
        }
      }
    }

    for (const variable of this) {
      if (variable.type instanceof ARRAY) {
        yield* iterateArrayLevel(variable.type, variable.startIndex, variable.name)
      } else {
        yield variable
      }
    }
  }
}

/**
 * IEC 61131-3 type: STRUCT
 */
export class STRUCT extends TypeBase implements IecType {
  type = 'STRUCT'
  /**
   * STRUCT children data types
   */
  children?: Record<string, IecType | never>

  constructor(children?: Record<string, IecType | never>) {
    super()
    
    this.children = children

    //Calculating struct size
    for (const key in this.children) {
      if (typeof this.children[key] !== 'object' || this.children[key].byteLength === undefined) {
        throw new Error(`Struct member ${key} is not valid IEC data type - Did you remember to use () with some data types that require it (example with STRING())?`)
      }

      this.byteLength += this.children[key].byteLength
    }
  }

  convertToBuffer(data: Record<string, unknown>): Buffer {
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
 * IEC 61131-3 type: UNION
 */
export class UNION extends TypeBase implements IecType {
  type = 'UNION'
  /**
   * UNION children data types
   */
  children?: Record<string, IecType | never>

  constructor(children?: Record<string, IecType | never>) {
    super()

    this.children = children

    //Calculating union size (= biggest child)
    for (const key in this.children) {
      if (typeof this.children[key] !== 'object' || this.children[key].byteLength === undefined) {
        throw new Error(`Struct member ${key} is not valid IEC data type - Did you remember to use () with some data types that require it (example with STRING())?`)
      }

      if (this.children[key].byteLength > this.byteLength)
        this.byteLength = this.children[key].byteLength
    }
  }


  convertToBuffer(data: Record<string, unknown>): Buffer {
    if (!data)
      return Buffer.alloc(0)

    //As UNION type member all are located in same memory, it's not that easy
    //For now: Use the last given object key value
    
    const buffer = Buffer.alloc(this.byteLength)

    for (const key in this.children) {
      if (data[key] === undefined)
        continue
      
      //There is only one value allowed so quit after this
      const converted = this.children[key].convertToBuffer(data[key])
      converted.copy(buffer, 0)
    }

    return buffer
  }

  convertFromBuffer(data: Buffer): Record<string, unknown> {
    const obj = {} as Record<string, unknown>

    for (const key in this.children) {
      obj[key] = this.children[key].convertFromBuffer(data.slice(0, this.children[key].byteLength))
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
 * IEC 61131-3 type: ENUM
 */
export class ENUM extends TypeBase implements IecType {
  type = 'ENUM'

  definition: Record<string, number>
  dataType: IecType

  constructor(definition: Record<string, number>, dataType?: EnumDataType) {
    super()

    this.definition = definition

    this.dataType = dataType ? dataType : new INT()
    this.byteLength = this.dataType.byteLength
  }


  convertToBuffer(data: EnumValue): Buffer {
    if (!data)
      return Buffer.alloc(0)

    if (typeof data === 'string') {
      //Enumeration name given as string
      const found = Object.keys(this.definition).find(key => key.toLowerCase() === data.toLowerCase())

      if (found) {
        return this.dataType.convertToBuffer(this.definition[found])
      }
      throw new Error('Input parameter is not valid for ENUM')

    } else if (typeof data === 'number') {
      //Enumeration value given as number
      return this.dataType.convertToBuffer(data)

    } else if (typeof data === 'object' && (data as EnumEntry).value) {
      //Object given with value key
      return this.dataType.convertToBuffer(data)

    } else if (typeof data === 'object' && (data as EnumEntry).name) {
      //Object given with name key
      const found = Object.keys(this.definition).find(key => data.name && key.toLowerCase() === data.name.toLowerCase())

      if (found) {
        return this.dataType.convertToBuffer(this.definition[found])
      }
      throw new Error('Input parameter is not valid for ENUM')

    } else {
      throw new Error('Input parameter is not valid for ENUM (number, string or object with { value })')
    }
  }
  

  convertFromBuffer(data: Buffer): EnumEntry {
    //First, converting buffer to number
    const value = this.dataType.convertFromBuffer(data) as number

    const entry = this.findEnumEntryByValue(value)

    if (entry)
      return entry

    //Not found
    return {
      name: undefined,
      value
    }
  }



  getDefault(): EnumEntry {
    //Codeys initializes the value with the first enumeration component
    //Use it, unless there are none
    const keys = Object.keys(this.definition)

    if (keys.length > 0) {
      return {
        name: keys[0],
        value: this.definition[keys[0]]
      }

    } else {
      //No entries? Use data type default value
      const value = (this.dataType as EnumDataType).getDefault()

      //Do we have enumeration entry for default value?
      const entry = this.findEnumEntryByValue(value)
    
      if (entry)
        return entry
    
      //Not found
      return {
        name: undefined,
        value
      }
    }
  }



  findEnumEntryByValue(value: number): EnumEntry | undefined {
    for (const key in this.definition) {
      if (this.definition[key] === value) {
        //Found
        return {
          name: key,
          value: value
        }
      }
    }

    //Not found
    return undefined
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


