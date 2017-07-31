
/**
 * Creates a <property> element with the given name and value
 *
 * @method createProperty
 * @param  {String} name    <property>'s name attribute
 * @param  {String} value   <property>'s value attribute
 * @return {Object}         The <property> element
 */
function createProperty(name, value) {
    return {
        property: [{
            _attr: {
                name: name,
                value: value
            }
        }]
    };
}

/**
 * Creates a <failure> element with an failure message
 *
 * @method createFailure
 * @param message           result.error_message or result.status
 * @returns {Object}        The <failure> element
 */
function createFailure(message) {
    return {
        failure: [
            { _attr: { message: message.split("\n").shift() } },
            message
        ]
    };
}

module.exports = {
	createProperty,
	createFailure
}
