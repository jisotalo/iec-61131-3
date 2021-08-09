import { nonComplexTypes, ARRAY, STRING, STRUCT, WSTRING } from "./iec-61131-3"
import { ExtractedStruct, ExtractedStructVariable, IecType } from "./types/types"

/**
 * RegExp pattern for matching TYPEs like STRUCT etc.
 *  TYPE
 *   ...
 *  END_TYPE
 */
const typeRegEx = new RegExp(/type\s*(\w*)\s*:(.*?)end_type/gis)

/**
 * RegExp pattern for matching STRUCT variables (children)
 */
const structVariableRegEx = new RegExp(/(\w+)\s*:\s*([^:;]*)/gis)


/**
 * RegExp pattern for matching STRING or WSTRING types
 *  STRING (=80)
 *  WSTRING (=80)
 *  STRING(123)
 *  WSTRING(123)
 *  STRING[123]
 *  WSTRING[123]
 */
const stringRegEx = new RegExp('^(STRING|WSTRING)([\\[\\(](.*?)[\\)\\]])*$', 'i')

/**
 * RegExp pattern for matching ARRAY types
 */
const arrayRegEx = new RegExp(/array\s*[\[(]+(.*?)\s*\.\.\s*(.*?)[\])]\s*of\s*([^:;]*)/gis)


/**
 * Extracts struct declarations from given string containing one or multiple TYPE...END_TYPE declarations
 * @param declaration 
 */
const extractStructDeclarations = (declarations: string): ExtractedStruct[] => {

  const extractedStructs: ExtractedStruct[] = []
  let match: RegExpExecArray | null
  
  //Looping until all no more declarations found
  while ((match = typeRegEx.exec(declarations)) !== null) {

    // This is necessary to avoid infinite loops with zero-width matches
    if (match.index === typeRegEx.lastIndex) {
      typeRegEx.lastIndex++;
    }

    //Creating new temporary extracted struct object
    extractedStructs.push({
      dataType: match[1],
      children: extractStructVariables(match[2]),
      resolved: undefined,
      resolvers: []
    })
  }

  return extractedStructs
}



/**
 * Extracts struct variables (children) from given declaration string
 * @param declaration 
 * @returns 
 */
const extractStructVariables = (declaration: string): ExtractedStructVariable[] => {

  const extractedVariables: ExtractedStructVariable[] = []

  let match: RegExpExecArray | null

  while ((match = structVariableRegEx.exec(declaration)) !== null) {

    // This is necessary to avoid infinite loops with zero-width matches
    if (match.index === structVariableRegEx.lastIndex) {
      structVariableRegEx.lastIndex++
    }

    extractedVariables.push({
      name: match[1],
      dataType: match[2].trim() //Removing whitespace here (TODO: with regexp?)
    })
  }

  return extractedVariables
}




export const resolveIecStructs = (declarations: string, topLevelDataType?: string, providedTypes?: Record<string, IecType>): IecType => {

  //First extracting struct definitions from string
  const structs = extractStructDeclarations(declarations)

  //If multiple structs found, we need to know which one is the top-level
  if (!topLevelDataType && structs.length > 1) {
    throw new Error('Top level data type name (topLevelDataType) is not given and many struct declarations found. Not possible to guess.')

  } else if (!topLevelDataType) {
    //When only one struct type found, we know it's the top-level
    topLevelDataType = structs[0].dataType
  }


  /**
   * Variable resolver that can be called recurively
   * Does not return anything, instead, saves result to refResolved object (so that we can resolve some structs later)
   * @param variable Variable to be resolved
   * @param refResolved Target object where to save the result or where the result will be saved later ("as reference")
   * @returns 
   */
  const resolveVariable = (variable: ExtractedStructVariable, refResolved: Record<string, IecType | undefined>): void => {
    //Simple non-complex data type
    let type: IecType | undefined = nonComplexTypes.find(t => t.type.toLowerCase() === variable.dataType.toLowerCase())

    if (type) {
      refResolved[variable.name] = type
      return
    }

    //String or wstring
    const stringMatch = stringRegEx.exec(variable.dataType)
    
    if (stringMatch) {
      if (stringMatch[1].toLowerCase() === 'string') {
        refResolved[variable.name] = STRING(stringMatch[3] ? parseInt(stringMatch[3]) : 80)

      } else if (stringMatch[1].toLowerCase() === 'wstring') {
        refResolved[variable.name] = WSTRING(stringMatch[3] ? parseInt(stringMatch[3]) : 80)

      } else {
        throw new Error(`Unknown STRING definition: ${stringMatch}`)
      }
      return
    }

    //Array
    const arrayMatch = arrayRegEx.exec(variable.dataType)

    if (arrayMatch) {
      const resolvedArrayType = {} as Record<string, IecType | undefined>

      resolveVariable({ name: 'result', dataType: arrayMatch[3] }, resolvedArrayType)
      type = resolvedArrayType['result']
      

      if (!type) {
        throw new Error(`Unknown array subtype ${arrayMatch[3]}`)
      }

      refResolved[variable.name] = ARRAY(type, parseInt(arrayMatch[2]) - parseInt(arrayMatch[1]) + 1)
      return
    }


    //Struct (or unknown)
    const struct = structs.find(struct => struct.dataType.toLowerCase() == variable.dataType.toLowerCase())

    if (struct) {
      if (struct.resolved) {
        refResolved[variable.name] = STRUCT(struct.resolved)

      } else {
        //To be resolved later (struct not parsed yet), add resolver callback
        refResolved[variable.name] = undefined

        struct.resolvers.push(() => {
          refResolved[variable.name] = STRUCT(struct.resolved)
        })
      }
      return

    } else {
      //Are there any types provided?
      if (providedTypes) {
        const key = Object.keys(providedTypes).find(key => key.toLowerCase() === variable.dataType.toLowerCase())

        if (key) {
          refResolved[variable.name] = providedTypes[key]
          return

        } else {
          throw new Error(`Unknown subtype ${variable.dataType} - Is data type declaration provided? Types found: ${structs.map(struct => struct.dataType).join(', ')}, types provided: ${Object.keys(providedTypes).join(',')}`)
        }
      } else {
        throw new Error(`Unknown subtype ${variable.dataType} - Is data type declaration provided? Types found: ${structs.map(struct => struct.dataType).join(', ')}`)
      }
    }
  }




  for (const struct of structs) {
    //Going through all variables of the struct
    struct.resolved = {}

    for (const variable of struct.children) {
      resolveVariable(variable, struct.resolved)
    }
    struct.resolvers.forEach(resolver => resolver())
    struct.resolvers = []
  }


  //Return the top-level struct
  const returnVal = structs.find(struct => topLevelDataType !== undefined && struct.dataType.toLowerCase() === topLevelDataType.toLowerCase())

  if (!returnVal) {
    throw new Error(`Top-level type ${topLevelDataType} was not found - Is data type declaration provided? Types found: ${structs.map(struct => struct.dataType).join(', ')}`)
  }

  return STRUCT(returnVal.resolved)
}
