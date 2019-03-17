const { AbstractExpressionParser } = require('./AbstractExpressionParser')
const { PropEntry } = require('../entity/PropEntry')

const { UNDEFINED, Features, Syntax } = require('../Enum')
const { StringUtils } = require('../StringUtils')

const MODEL_KEYWORD = 'model'

const ObjectExpressionTypes = [
  Syntax.Identifier,
  Syntax.ObjectExpression
]

class PropParser extends AbstractExpressionParser {
  parse (node) {
    if (this.features.includes(Features.props)) {
      super.parse(node)
    }
  }

  parseEntryComment (entry, property) {
    super.parseEntryComment(entry, property)

    /* eslint-disable arrow-body-style */
    const modelKeywordIndex = entry.keywords.findIndex(({ name }) => {
      return name === MODEL_KEYWORD
    })

    if (modelKeywordIndex > -1) {
      entry.name = 'v-model'
      entry.describeModel = true
    }
  }

  parseArrayExpression (node) {
    node.elements.forEach((item) => {
      const name = StringUtils.toKebabCase(item.value)
      const entry = new PropEntry(name, 'Any')

      this.root.scope[entry.name] = UNDEFINED

      this.parseEntryComment(entry, item)
      this.emit(entry)
    })
  }

  parseObjectExpression (node) {
    node.properties
      .filter(({ value }) => ObjectExpressionTypes.includes(value.type))
      .forEach((property) => {
        const { type, value } = this.getValue(property.value)
        const propType = type === Syntax.Identifier ? value : value.type.value
        const required = value.required ? value.required.value : false
        const name = StringUtils.toKebabCase(property.key.name)
        const entry = new PropEntry(name, propType, value.default, required)

        this.root.scope[entry.name] = entry.default

        this.parseEntryComment(entry, property)
        this.emit(entry)
      })
  }

  getFunctionExpressionValue (node) {
    return this.getFunctionExpressionStringValue(node)
  }
}

module.exports.PropParser = PropParser