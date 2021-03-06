const parser = require('../..')

/* global describe beforeAll it expect */

module.exports.ComponentTestCase = ({ name, expected, options }) => {
  describe(name, () => {
    let component = null

    beforeAll(() => {
      return parser.parse(options).then((definition) => {
        component = definition
      })
    })

    Object.keys(expected).forEach((key) => {
      it(`should successfully parse ${key}`, () => {
        expect(component[key]).toEqual(expected[key])
      })
    })
  })
}
