'use strict';

const assert = require('assert');
const GWHandler = require('./gw-handler');

class ThingClass {

  constructor(handler) {
    this.handler = handler;
    const config = this.handler.apihandler.config;
    this.gwhandler = new GWHandler(config.accessToken);
    this.gwhandler.init().then(() => {
      if (config.scanInterval)
        setInterval(this.gwhandler.listDevices.bind(this.gwhandler), config.scanInterval*1000);
    });

    this.triggerClass = require('./trigger');
  }

  async set(description, value) {
    assert(description && typeof description == 'object');
    assert(description.thing && description.property);
    let val;
    const property = this.gwhandler.getProperty(description.thing, description.property);
    switch (property.type) {
      case 'boolean':
        val = this.handler.decodeBoolean(value);
        break;
      case 'number': case 'integer':
        val = this.handler.decodeNumber(value);
        break;
      case 'string':
        val = this.handler.decodeString(value);
        break;
      default:
        val = null;
        break;
    }
    await this.gwhandler.setPropertyValue(description.thing, description.property, val);
  }

  async eval(description) {
    assert(description && typeof description == 'object');
    assert(description.thing && description.property);
    const val = await this.gwhandler.getPropertyValue(description.thing, description.property);
    return this.handler.encode(val);
  }

  async exec(description) {
    assert(description && typeof description == 'object');
    assert(description.thing && description.property && description.action);
    switch (description.action) {
      case 'next':
        await this.next(description.thing, description.property);
        break;
      case 'prev':
        await this.prev(description.thing, description.property);
        break;
    }
  }

  async next(thing, property) {
    const prop = this.gwhandler.getProperty(thing, property);
    let val = await this.gwhandler.getPropertyValue(thing, property);
    switch (prop.type) {
      case 'boolean':
        val = !val;
        break;
      case 'number': case 'integer':
        val = val + 1;
        if (val > prop.maximum) val = prop.minimum;
        break;
      case 'string':
        if (prop.enum) {
          val = prop.enum.indexOf(val) + 1;
          if (val >= prop.enum.length) val = 0;
          val = prop.enum[val];
        }
        break;
    }
    this.gwhandler.setPropertyValue(thing, property, val);
  }

  async prev(thing, property) {
    const prop = this.gwhandler.getProperty(thing, property);
    let val = await this.gwhandler.getPropertyValue(thing, property);
    switch (prop.type) {
      case 'boolean':
        val = !val;
        break;
      case 'number': case 'integer':
        val = val - 1;
        if (val < prop.minimum) val = prop.maximum;
        break;
      case 'string':
        if (prop.enum) {
          val = prop.enum.indexOf(val) - 1;
          if (val < 0) val = prop.enum.length - 1;
          val = prop.enum[val];
        }
        break;
    }
    this.gwhandler.setPropertyValue(thing, property, val);
  }

}

module.exports = ThingClass;