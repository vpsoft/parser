const { AbstractExpressionParser } = require('./AbstractExpressionParser')
const { ComputedEntry } = require('../entity/ComputedEntry')
const { UndefinedValue } = require('../entity/UndefinedValue')

const { Syntax, Features } = require('../Enum')

const RE_THIS_EXPRESSION = /this\.([a-z0-9_$]+)/ig

class ComputedParser extends AbstractExpressionParser {
  parse (node) {
    if (this.features.includes(Features.computed)) {
      super.parse(node)
    }
  }

  getDependencies (node) {
    const dependencies = []
    const source = this.source.substring(node.start, node.end - 1)

    let index = 0

    while (index < source.length && index !== -1) {
      const matches = RE_THIS_EXPRESSION.exec(source)

      if (!matches) {
        break
      }

      /* eslint-disable prefer-destructuring */
      index = matches.index

      dependencies.push(matches[1])
    }

    return dependencies
  }

  getBlockStatement (node) {
    switch (node.type) {
      case Syntax.Property:
        return node.value

      case Syntax.FunctionExpression:
      case Syntax.ArrowFunctionExpression:
        return node.body

      case Syntax.ObjectExpression:
        for (const item of node.properties) {
          if (item.key.name === 'get') {
            return this.getBlockStatement(item)
          }
        }
        break
    }

    return null
  }

  /* eslint-disable no-unused-vars */
  /* eslint-disable class-methods-use-this */
  parseCallExpression (node) {
    // ignore call expression on Computed Property
  }

  parseReturnStatement (node) {
    switch (node.type) {
      case Syntax.ObjectExpression:
        this.parseObjectExpression(node)
        break
    }
  }

  parseObjectExpression (node) {
    node.properties.forEach((property) => {
      switch (property.type) {
        case Syntax.FunctionExpression:
        case Syntax.ArrowFunctionExpression:
          this.parseReturnStatement(property.value)
          break

        case Syntax.Property: {
          const name = property.key.name
          const entry = new ComputedEntry(name)
          const block = this.getBlockStatement(property.value)

          if (block) {
            const dependencies = this.getDependencies(block)

            entry.dependencies.push(...dependencies)
          }

          this.root.scope[entry.name] = new UndefinedValue()

          this.parseEntryComment(entry, property)
          this.emit(entry)
          break
        }

        default:
          super.parseObjectExpression(property)
      }
    })
  }
}

module.exports.ComputedParser = ComputedParser